import os
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, FitdaysRecord

# Use an in-memory SQLite database for testing with StaticPool to keep the connection alive
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency in the FastAPI application
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(name="client")
def client_fixture():
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)

def register_and_verify_user(
    client: TestClient,
    email: str = "testuser@example.com",
    password: str = "testpassword123",
    display_name: str = "Test User",
    gender: str = "male",
    birthday: str = "1990-01-01",
    height_cm: float = 175.0,
    target_weight_kg: float = 70.0,
    preferred_language: str = "en"
) -> str:
    """Helper to register, verify, and return auth token."""
    reg_response = client.post(
        "/api/users/register",
        json={
            "email": email,
            "password": password,
            "display_name": display_name,
            "gender": gender,
            "birthday": birthday,
            "height_cm": height_cm,
            "target_weight_kg": target_weight_kg,
            "preferred_language": preferred_language
        }
    )
    assert reg_response.status_code == 201

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == email).first()
    code = user.verification_code
    db.close()

    verify_res = client.post(
        "/api/users/verify-code",
        json={"email": email, "code": code}
    )
    assert verify_res.status_code == 200

    login_res = client.post(
        "/api/users/login",
        data={"username": email, "password": password}
    )
    assert login_res.status_code == 200
    return login_res.json()["access_token"]


def test_user_registration_and_email_verification_flow(client: TestClient):
    # 1. Register user
    reg_response = client.post(
        "/api/users/register",
        json={
            "email": "verifytest@example.com",
            "password": "password123",
            "display_name": "Verify User",
            "gender": "male",
            "birthday": "1990-01-01",
            "height_cm": 175.0,
            "target_weight_kg": 70.0,
            "preferred_language": "en"
        }
    )
    assert reg_response.status_code == 201
    data = reg_response.json()
    assert data["email"] == "verifytest@example.com"
    assert data["email_confirmed"] is False
    assert "id" in data

    # 2. Duplicate registration with same email should fail
    dup_response = client.post(
        "/api/users/register",
        json={
            "email": "verifytest@example.com",
            "password": "password123",
            "display_name": "Another User",
            "gender": "female",
            "birthday": "1992-02-02",
            "height_cm": 165.0,
            "target_weight_kg": 60.0,
            "preferred_language": "en"
        }
    )
    assert dup_response.status_code == 400
    assert "already registered" in dup_response.json()["detail"]

    # 3. Login before confirmation should return 403 EMAIL_NOT_CONFIRMED
    unconfirmed_login = client.post(
        "/api/users/login",
        data={"username": "verifytest@example.com", "password": "password123"}
    )
    assert unconfirmed_login.status_code == 403
    assert unconfirmed_login.json()["detail"] == "EMAIL_NOT_CONFIRMED"

    # 4. Attempt verification with invalid code
    bad_verify = client.post(
        "/api/users/verify-code",
        json={"email": "verifytest@example.com", "code": "999999"}
    )
    assert bad_verify.status_code == 400
    assert "Invalid verification code" in bad_verify.json()["detail"]

    # 5. Fetch actual code from DB
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "verifytest@example.com").first()
    assert user is not None
    assert user.verification_code is not None
    assert len(user.verification_code) == 6
    actual_code = user.verification_code
    db.close()

    # 6. Verify code with valid code
    verify_response = client.post(
        "/api/users/verify-code",
        json={"email": "verifytest@example.com", "code": actual_code}
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["email_confirmed"] is True

    # 7. Login now succeeds
    login_response = client.post(
        "/api/users/login",
        data={"username": "verifytest@example.com", "password": "password123"}
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # 8. Profile query
    me_response = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "verifytest@example.com"
    assert me_response.json()["email_confirmed"] is True


def test_get_verify_email_endpoint(client: TestClient):
    """Test 1-click verification link endpoint GET /api/users/verify-email"""
    client.post(
        "/api/users/register",
        json={
            "email": "linkverify@example.com",
            "password": "password123",
            "display_name": "Link User",
            "gender": "female",
            "birthday": "1995-05-05",
            "height_cm": 165.0,
            "target_weight_kg": 55.0,
            "preferred_language": "es"
        }
    )
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "linkverify@example.com").first()
    code = user.verification_code
    db.close()

    # Verify via GET query parameters
    get_res = client.get(f"/api/users/verify-email?email=linkverify@example.com&code={code}")
    assert get_res.status_code == 200
    assert get_res.json()["email_confirmed"] is True

    # Login works
    login_res = client.post(
        "/api/users/login",
        data={"username": "linkverify@example.com", "password": "password123"}
    )
    assert login_res.status_code == 200


def test_resend_verification_and_code_expiration(client: TestClient):
    client.post(
        "/api/users/register",
        json={
            "email": "resendtest@example.com",
            "password": "password123",
            "display_name": "Resend User",
            "gender": "male",
            "birthday": "1990-01-01",
            "height_cm": 175.0,
            "target_weight_kg": 70.0,
            "preferred_language": "en"
        }
    )
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "resendtest@example.com").first()
    old_code = user.verification_code
    # Expire old code manually
    user.verification_code_expires_at = datetime.utcnow() - timedelta(hours=1)
    db.commit()
    db.close()

    # Attempting to verify expired code should fail
    exp_verify = client.post(
        "/api/users/verify-code",
        json={"email": "resendtest@example.com", "code": old_code}
    )
    assert exp_verify.status_code == 400
    assert "expired" in exp_verify.json()["detail"]

    # Resend verification
    resend_res = client.post(
        "/api/users/resend-verification",
        json={"email": "resendtest@example.com"}
    )
    assert resend_res.status_code == 200

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "resendtest@example.com").first()
    new_code = user.verification_code
    assert new_code is not None
    db.close()

    # Verifying with new code succeeds
    verify_res = client.post(
        "/api/users/verify-code",
        json={"email": "resendtest@example.com", "code": new_code}
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["email_confirmed"] is True


def test_profile_email_update_and_verification_flow(client: TestClient):
    token = register_and_verify_user(client, email="original@example.com", password="password123")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Update display name without changing email
    update_res = client.put(
        "/api/users/profile",
        json={"display_name": "Updated Original"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["display_name"] == "Updated Original"
    assert update_res.json()["email"] == "original@example.com"
    assert update_res.json()["pending_email"] is None

    # 2. Request email change to newemail@example.com
    change_res = client.put(
        "/api/users/profile",
        json={"email": "newemail@example.com"},
        headers=headers
    )
    assert change_res.status_code == 200
    # Active email is still original, pending_email is set
    assert change_res.json()["email"] == "original@example.com"
    assert change_res.json()["pending_email"] == "newemail@example.com"

    # User can still make authenticated requests with their existing session
    me_res = client.get("/api/users/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["pending_email"] == "newemail@example.com"

    # 3. Cancel email change
    cancel_res = client.post("/api/users/cancel-email-change", headers=headers)
    assert cancel_res.status_code == 200
    me_after_cancel = client.get("/api/users/me", headers=headers).json()
    assert me_after_cancel["pending_email"] is None

    # 4. Request email change again and verify
    client.put(
        "/api/users/profile",
        json={"email": "newemail@example.com"},
        headers=headers
    )
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "original@example.com").first()
    code = user.verification_code
    db.close()

    # Verify code for pending email
    verify_res = client.post(
        "/api/users/verify-code",
        json={"email": "newemail@example.com", "code": code}
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["email"] == "newemail@example.com"

    # 5. Login now works with new email
    new_login = client.post(
        "/api/users/login",
        data={"username": "newemail@example.com", "password": "password123"}
    )
    assert new_login.status_code == 200


def test_user_flow(client: TestClient):
    token = register_and_verify_user(client, email="testflow@example.com", password="testpassword123")
    headers = {"Authorization": f"Bearer {token}"}

    # Get current user profile
    profile_response = client.get("/api/users/me", headers=headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == "testflow@example.com"
    assert profile_response.json()["display_name"] == "Test User"

    # Update profile
    update_response = client.put(
        "/api/users/profile",
        json={
            "display_name": "Updated Name",
            "height_cm": 180.0
        },
        headers=headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["display_name"] == "Updated Name"
    assert update_response.json()["height_cm"] == 180.0

    # Upload profile picture
    from PIL import Image
    import io
    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)
    
    upload_response = client.post(
        "/api/users/profile-picture",
        files={"file": ("test.png", img_byte_arr, "image/png")},
        headers=headers
    )
    assert upload_response.status_code == 200
    assert upload_response.json()["profile_image_url"] is not None
    assert upload_response.json()["profile_image_url"].startswith("/uploads/profile_pics/")


def test_records_upload_and_summary(client: TestClient):
    token = register_and_verify_user(
        client,
        email="celso@example.com",
        password="celsopassword",
        display_name="Celso Fassoni",
        birthday="1985-05-15",
        height_cm=180.0,
        target_weight_kg=85.0,
        preferred_language="pt-br"
    )
    headers = {"Authorization": f"Bearer {token}"}

    # Verify upload is rejected if file is not provided
    bad_upload = client.post("/api/records/upload", headers=headers)
    assert bad_upload.status_code == 422

    # Check path of the CSV export file
    test_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(test_dir, "..", "..", "test-data", "Fitdays-test-data.csv"))
    assert os.path.exists(csv_path), f"Test CSV file does not exist at path: {csv_path}"

    # Upload the file
    with open(csv_path, "rb") as f:
        upload_response = client.post(
            "/api/records/upload",
            headers=headers,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )
    
    assert upload_response.status_code == 201
    res = upload_response.json()
    assert res["total_processed"] == 4
    assert res["inserted"] == 4
    assert res["updated"] == 0

    # Test uploading again (re-upload testing for upsert)
    with open(csv_path, "rb") as f:
        re_upload_response = client.post(
            "/api/records/upload",
            headers=headers,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )
    
    assert re_upload_response.status_code == 201
    re_res = re_upload_response.json()
    assert re_res["total_processed"] == 4
    assert re_res["inserted"] == 0
    assert re_res["updated"] == 4

    # Fetch records list
    records_response = client.get("/api/records", headers=headers)
    assert records_response.status_code == 200
    records = records_response.json()
    assert len(records) == 4
    
    # Check that keys are parsed correctly in the database response
    first_record = records[0]
    assert "date" in first_record
    assert first_record["weight"] == 118.1
    assert first_record["bmi"] == 34.1
    assert first_record["body_fat_pct"] == 39.8
    assert first_record["right_arm_fat_mass"] == 3.4
    assert first_record["right_arm_fat_level"] == "Alto"
    assert first_record["left_leg_impedance_low"] == 241.5

    # Fetch summary statistics
    summary_response = client.get("/api/records/summary", headers=headers)
    assert summary_response.status_code == 200
    summary = summary_response.json()
    assert summary["total_records"] == 4
    assert summary["starting_weight"] == 118.1
    assert len(summary["weight_history"]) == 4
    
    # Check weight change calculation
    last_record_weight = records[-1]["weight"]
    expected_change = round(last_record_weight - 118.1, 2)
    assert summary["weight_change"] == expected_change

    # Check skeletal muscle mass summary
    assert "starting_skeletal_muscle_mass" in summary
    assert "current_skeletal_muscle_mass" in summary
    assert "skeletal_muscle_mass_change" in summary
    
    first_record_smm = records[0]["skeletal_muscle_mass"]
    last_record_smm = records[-1]["skeletal_muscle_mass"]
    expected_smm_change = round(last_record_smm - first_record_smm, 2)
    
    assert summary["starting_skeletal_muscle_mass"] == first_record_smm
    assert summary["current_skeletal_muscle_mass"] == last_record_smm
    assert summary["skeletal_muscle_mass_change"] == expected_smm_change
    
    assert "skeletal_muscle_mass" in summary["weight_history"][0]
    assert summary["weight_history"][0]["skeletal_muscle_mass"] == first_record_smm

    # Check new body fat mass fields
    assert "starting_body_fat_mass" in summary
    assert "current_body_fat_mass" in summary
    assert "body_fat_mass_change" in summary
    
    first_record_bfm = records[0]["fat_mass"]
    last_record_bfm = records[-1]["fat_mass"]
    expected_bfm_change = round(last_record_bfm - first_record_bfm, 2)
    
    assert summary["starting_body_fat_mass"] == first_record_bfm
    assert summary["current_body_fat_mass"] == last_record_bfm
    assert summary["body_fat_mass_change"] == expected_bfm_change
    assert "body_fat_mass" in summary["weight_history"][0]
    assert summary["weight_history"][0]["body_fat_mass"] == first_record_bfm

    # Check new skeletal muscle percentage fields
    assert "starting_skeletal_muscle_mass_pct" in summary
    assert "current_skeletal_muscle_mass_pct" in summary
    assert "skeletal_muscle_mass_pct_change" in summary
    
    first_record_smmp = records[0]["skeletal_muscle_mass_pct"]
    last_record_smmp = records[-1]["skeletal_muscle_mass_pct"]
    expected_smmp_change = round(last_record_smmp - first_record_smmp, 2)
    
    assert summary["starting_skeletal_muscle_mass_pct"] == first_record_smmp
    assert summary["current_skeletal_muscle_mass_pct"] == last_record_smmp
    assert summary["skeletal_muscle_mass_pct_change"] == expected_smmp_change
    assert "skeletal_muscle_mass_pct" in summary["weight_history"][0]
    assert summary["weight_history"][0]["skeletal_muscle_mass_pct"] == first_record_smmp


def test_records_deletion(client: TestClient):
    token_a = register_and_verify_user(client, email="usera@example.com", password="password123", display_name="User A")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    token_b = register_and_verify_user(client, email="userb@example.com", password="password123", display_name="User B")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    test_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(test_dir, "..", "..", "test-data", "Fitdays-test-data.csv"))
    with open(csv_path, "rb") as f:
        client.post(
            "/api/records/upload",
            headers=headers_a,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )

    with open(csv_path, "rb") as f:
        client.post(
            "/api/records/upload",
            headers=headers_b,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )

    records_a = client.get("/api/records", headers=headers_a).json()
    records_b = client.get("/api/records", headers=headers_b).json()

    id_a1 = records_a[0]["id"]
    id_a2 = records_a[1]["id"]
    id_b = records_b[0]["id"]

    del_response = client.post(
        "/api/records/delete",
        headers=headers_a,
        json={"ids": [id_a1]}
    )
    assert del_response.status_code == 200
    res = del_response.json()
    assert id_a1 in res["deleted"]
    assert len(res["failed"]) == 0

    records_a_after = client.get("/api/records", headers=headers_a).json()
    assert len(records_a_after) == len(records_a) - 1
    assert all(r["id"] != id_a1 for r in records_a_after)

    del_unauth = client.post(
        "/api/records/delete",
        headers=headers_a,
        json={"ids": [id_b]}
    )
    assert del_unauth.status_code == 200
    res_unauth = del_unauth.json()
    assert len(res_unauth["deleted"]) == 0
    assert len(res_unauth["failed"]) == 1
    assert res_unauth["failed"][0]["id"] == id_b
    assert res_unauth["failed"][0]["reason"] == "unauthorized"

    non_existent_id = 99999
    mix_response = client.post(
        "/api/records/delete",
        headers=headers_a,
        json={"ids": [id_a2, id_b, non_existent_id]}
    )
    assert mix_response.status_code == 200
    res_mix = mix_response.json()
    
    assert id_a2 in res_mix["deleted"]
    failed_ids = {f["id"]: f["reason"] for f in res_mix["failed"]}
    assert failed_ids[id_b] == "unauthorized"
    assert failed_ids[non_existent_id] == "not_found"
    assert len(res_mix["deleted"]) == 1
    assert len(res_mix["failed"]) == 2


def test_reports_flow(client: TestClient):
    token_a = register_and_verify_user(client, email="reportuser@example.com", password="password123", display_name="Report User")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    test_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(test_dir, "..", "..", "test-data", "Fitdays-test-data.csv"))
    with open(csv_path, "rb") as f:
        client.post(
            "/api/records/upload",
            headers=headers_a,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )
    
    records = client.get("/api/records", headers=headers_a).json()
    assert len(records) > 0
    record_id = records[0]["id"]

    get_rep_none = client.get(f"/api/records/{record_id}/report", headers=headers_a)
    assert get_rep_none.status_code == 204

    pdf_content = b"%PDF-1.4 dummy pdf content"
    upload_res = client.post(
        f"/api/records/{record_id}/report",
        headers=headers_a,
        files={"file": ("report.pdf", pdf_content, "application/pdf")}
    )
    assert upload_res.status_code == 201
    rep_data = upload_res.json()
    assert rep_data["filename"] == "report.pdf"
    assert rep_data["mime_type"] == "application/pdf"
    assert "url" in rep_data
    assert rep_data["url"].startswith("/uploads/reports/")

    get_rep = client.get(f"/api/records/{record_id}/report", headers=headers_a)
    assert get_rep.status_code == 200
    assert get_rep.json()["filename"] == "report.pdf"

    records_with_report = client.get("/api/records", headers=headers_a).json()
    matching_record = next(r for r in records_with_report if r["id"] == record_id)
    assert matching_record["report"] is not None
    assert matching_record["report"]["filename"] == "report.pdf"

    large_content = b"a" * (5 * 1024 * 1024 + 1)
    upload_large = client.post(
        f"/api/records/{record_id}/report",
        headers=headers_a,
        files={"file": ("large.pdf", large_content, "application/pdf")}
    )
    assert upload_large.status_code == 400
    assert "exceeds" in upload_large.json()["detail"]

    txt_content = b"some text content"
    upload_invalid = client.post(
        f"/api/records/{record_id}/report",
        headers=headers_a,
        files={"file": ("report.txt", txt_content, "text/plain")}
    )
    assert upload_invalid.status_code == 400
    assert "file type" in upload_invalid.json()["detail"]

    del_res = client.delete(f"/api/records/{record_id}/report", headers=headers_a)
    assert del_res.status_code == 204

    get_rep_none2 = client.get(f"/api/records/{record_id}/report", headers=headers_a)
    assert get_rep_none2.status_code == 204

    upload_res2 = client.post(
        f"/api/records/{record_id}/report",
        headers=headers_a,
        files={"file": ("report2.pdf", pdf_content, "application/pdf")}
    )
    assert upload_res2.status_code == 201
    file_url = upload_res2.json()["url"]
    file_name = file_url.split("/")[-1]
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    reports_dir = os.path.join(backend_dir, "uploads", "reports")
    file_path = os.path.join(reports_dir, file_name)
    assert os.path.exists(file_path)

    del_rec_res = client.post(
        "/api/records/delete",
        headers=headers_a,
        json={"ids": [record_id]}
    )
    assert del_rec_res.status_code == 200
    assert not os.path.exists(file_path)

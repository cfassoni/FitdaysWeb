import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import User, FitdaysRecord

from sqlalchemy.pool import StaticPool

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
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    # Drop tables after test runs
    Base.metadata.drop_all(bind=engine)

def test_user_flow(client: TestClient):
    # 1. Register user
    reg_response = client.post(
        "/api/users/register",
        json={
            "login": "testuser",
            "email": "testuser@example.com",
            "password": "testpassword123",
            "display_name": "Test User",
            "gender": "male",
            "birthday": "1990-01-01",
            "height_cm": 175.0,
            "target_weight_kg": 70.0,
            "preferred_language": "en"
        }
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["login"] == "testuser"
    assert "id" in reg_response.json()

    # 2. Duplicate registration should fail
    dup_response = client.post(
        "/api/users/register",
        json={
            "login": "testuser",
            "email": "testuser2@example.com",
            "password": "testpassword123",
            "display_name": "Test User 2",
            "gender": "female",
            "birthday": "1992-02-02",
            "height_cm": 165.0,
            "target_weight_kg": 60.0,
            "preferred_language": "en"
        }
    )
    assert dup_response.status_code == 400

    # 3. Login
    login_response = client.post(
        "/api/users/login",
        data={
            "username": "testuser",
            "password": "testpassword123"
        }
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]

    # 4. Get current user profile
    profile_response = client.get(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_response.status_code == 200
    assert profile_response.json()["login"] == "testuser"
    assert profile_response.json()["display_name"] == "Test User"

    # 5. Update profile
    update_response = client.put(
        "/api/users/profile",
        json={
            "display_name": "Updated Name",
            "height_cm": 180.0
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_response.status_code == 200
    assert update_response.json()["display_name"] == "Updated Name"
    assert update_response.json()["height_cm"] == 180.0

    # 6. Upload profile picture
    from PIL import Image
    import io
    img = Image.new("RGB", (100, 100), color="red")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)
    
    upload_response = client.post(
        "/api/users/profile-picture",
        files={"file": ("test.png", img_byte_arr, "image/png")},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert upload_response.status_code == 200
    assert upload_response.json()["profile_image_url"] is not None
    assert upload_response.json()["profile_image_url"].startswith("/uploads/profile_pics/")


def test_records_upload_and_summary(client: TestClient):
    # Register and login first
    client.post(
        "/api/users/register",
        json={
            "login": "celso",
            "email": "celso@example.com",
            "password": "celsopassword",
            "display_name": "Celso Fassoni",
            "gender": "male",
            "birthday": "1985-05-15",
            "height_cm": 180.0,
            "target_weight_kg": 85.0,
            "preferred_language": "pt-br"
        }
    )
    login_response = client.post(
        "/api/users/login",
        data={"username": "celso", "password": "celsopassword"}
    )
    token = login_response.json()["access_token"]
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
    assert res["total_processed"] == 17
    assert res["inserted"] == 17
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
    assert re_res["total_processed"] == 17
    assert re_res["inserted"] == 0
    assert re_res["updated"] == 17

    # Fetch records list
    records_response = client.get("/api/records", headers=headers)
    assert records_response.status_code == 200
    records = records_response.json()
    assert len(records) == 17
    
    # Check that keys are parsed correctly in the database response
    first_record = records[0]
    assert "date" in first_record
    assert first_record["weight"] == 121.5
    assert first_record["bmi"] == 35.1
    assert first_record["body_fat_pct"] == 44.0
    assert first_record["right_arm_fat_mass"] == 4.0
    assert first_record["right_arm_fat_level"] == "Alto"
    assert first_record["left_leg_impedance_low"] == 256.3

    # Fetch summary statistics
    summary_response = client.get("/api/records/summary", headers=headers)
    assert summary_response.status_code == 200
    summary = summary_response.json()
    assert summary["total_records"] == 17
    assert summary["starting_weight"] == 121.5
    assert len(summary["weight_history"]) == 17
    
    # Check weight change calculation
    last_record_weight = records[-1]["weight"]
    expected_change = round(last_record_weight - 121.5, 2)
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
    # 1. Register and login User A
    client.post(
        "/api/users/register",
        json={
            "login": "usera",
            "email": "usera@example.com",
            "password": "password123",
            "display_name": "User A",
            "gender": "male",
            "birthday": "1990-01-01",
            "height_cm": 175.0,
            "target_weight_kg": 70.0,
            "preferred_language": "en"
        }
    )
    login_a = client.post(
        "/api/users/login",
        data={"username": "usera", "password": "password123"}
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register and login User B
    client.post(
        "/api/users/register",
        json={
            "login": "userb",
            "email": "userb@example.com",
            "password": "password123",
            "display_name": "User B",
            "gender": "female",
            "birthday": "1992-02-02",
            "height_cm": 165.0,
            "target_weight_kg": 60.0,
            "preferred_language": "en"
        }
    )
    login_b = client.post(
        "/api/users/login",
        data={"username": "userb", "password": "password123"}
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Upload data for User A
    test_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(test_dir, "..", "..", "test-data", "Fitdays-test-data.csv"))
    with open(csv_path, "rb") as f:
        client.post(
            "/api/records/upload",
            headers=headers_a,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )

    # 4. Upload data for User B
    with open(csv_path, "rb") as f:
        client.post(
            "/api/records/upload",
            headers=headers_b,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )

    # Get records of User A and User B to find their IDs
    records_a = client.get("/api/records", headers=headers_a).json()
    records_b = client.get("/api/records", headers=headers_b).json()

    id_a1 = records_a[0]["id"]
    id_a2 = records_a[1]["id"]
    id_b = records_b[0]["id"]

    # 5. Delete a single record of User A successfully
    del_response = client.post(
        "/api/records/delete",
        headers=headers_a,
        json={"ids": [id_a1]}
    )
    assert del_response.status_code == 200
    res = del_response.json()
    assert id_a1 in res["deleted"]
    assert len(res["failed"]) == 0

    # Verify record was deleted for User A
    records_a_after = client.get("/api/records", headers=headers_a).json()
    assert len(records_a_after) == len(records_a) - 1
    assert all(r["id"] != id_a1 for r in records_a_after)

    # 6. Attempt deleting User B's record using User A's token (unauthorized)
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

    # 7. Batch delete with mix of valid, unauthorized, and non-existent IDs
    non_existent_id = 99999
    mix_response = client.post(
        "/api/records/delete",
        headers=headers_a,
        json={"ids": [id_a2, id_b, non_existent_id]}
    )
    assert mix_response.status_code == 200
    res_mix = mix_response.json()
    
    # id_a2 should be deleted successfully
    assert id_a2 in res_mix["deleted"]
    
    # id_b and non_existent_id should be failed
    failed_ids = {f["id"]: f["reason"] for f in res_mix["failed"]}
    assert failed_ids[id_b] == "unauthorized"
    assert failed_ids[non_existent_id] == "not_found"
    assert len(res_mix["deleted"]) == 1
    assert len(res_mix["failed"]) == 2


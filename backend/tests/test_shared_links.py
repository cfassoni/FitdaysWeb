import os
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import jwt

from app.database import Base, get_db
from app.main import app
from app.models import User, FitdaysRecord, FitdaysReport, SharedLink, SharedLinkAuditLog
from app.auth import get_password_hash, SECRET_KEY, ALGORITHM

# In-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(name="client")
def client_fixture():
    # Set override locally inside the fixture
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)
    # Remove override to avoid leaking to other tests
    app.dependency_overrides.pop(get_db, None)


def test_shared_links_flow(client: TestClient):
    # 1. Register and login owner
    reg_res = client.post(
        "/api/users/register",
        json={
            "login": "owner",
            "email": "owner@example.com",
            "password": "password123",
            "display_name": "Owner User",
            "gender": "male",
            "birthday": "1990-01-01",
            "height_cm": 175.0,
            "target_weight_kg": 70.0,
            "preferred_language": "en"
        }
    )
    assert reg_res.status_code == 201
    
    login_res = client.post(
        "/api/users/login",
        data={"username": "owner", "password": "password123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Fitdays CSV data
    test_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(test_dir, "..", "..", "test-data", "Fitdays-test-data.csv"))
    assert os.path.exists(csv_path)

    with open(csv_path, "rb") as f:
        upload_res = client.post(
            "/api/records/upload",
            headers=headers,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )
    assert upload_res.status_code == 201

    # Fetch uploaded records to get IDs
    records_res = client.get("/api/records", headers=headers)
    assert records_res.status_code == 200
    records = records_res.json()
    assert len(records) == 4
    rec_ids = [r["id"] for r in records]

    # Upload report attachment for the first record
    report_file = {"file": ("report.pdf", b"%PDF-1.4 dummy", "application/pdf")}
    report_res = client.post(f"/api/records/{rec_ids[0]}/report", files=report_file, headers=headers)
    assert report_res.status_code == 201

    # 3. Create a Shared Link (no password, include attachments)
    share_res = client.post(
        "/api/shared-links",
        json={
            "description": "Sharing with doctor",
            "password": None,
            "include_attachments": True,
            "expires_at": None,
            "entry_ids": rec_ids
        },
        headers=headers
    )
    assert share_res.status_code == 201
    link_data = share_res.json()
    assert link_data["description"] == "Sharing with doctor"
    assert link_data["has_password"] is False
    assert link_data["include_attachments"] is True
    assert link_data["entry_count"] == 4
    token1 = link_data["token"]
    link_id = link_data["id"]

    # 4. Check guest public metadata endpoint (no password required)
    meta_res = client.get(f"/api/shared-links/public/{token1}")
    assert meta_res.status_code == 200
    meta_data = meta_res.json()
    assert meta_data["description"] == "Sharing with doctor"
    assert meta_data["has_password"] is False
    assert meta_data["owner_name"] == "Owner User"
    assert meta_data["owner_email"] == "owner@example.com"
    assert meta_data["latest_measurement_date"] is not None

    # 5. Fetch guest public data endpoint (no password required)
    data_res = client.get(f"/api/shared-links/public/{token1}/data")
    assert data_res.status_code == 200
    guest_data = data_res.json()
    assert guest_data["dashboard"]["total_records"] == 4
    
    # Verify entries list and attachments url
    entries = guest_data["entries"]
    assert len(entries) == 4
    # The first entry has a report, check overridden url
    assert entries[0]["report"] is not None
    assert entries[0]["report"]["url"].startswith(f"/api/shared-links/public/{token1}/attachments/")
    assert entries[1]["report"] is None

    # Serve guest attachment
    report_id = entries[0]["report"]["id"]
    attach_res = client.get(f"/api/shared-links/public/{token1}/attachments/{report_id}")
    assert attach_res.status_code == 200
    assert attach_res.content == b"%PDF-1.4 dummy"

    # 6. Create shared link WITH password
    pass_share_res = client.post(
        "/api/shared-links",
        json={
            "description": "Sharing with therapist",
            "password": "guestpassword",
            "include_attachments": False,
            "expires_at": None,
            "entry_ids": [rec_ids[0]]
        },
        headers=headers
    )
    assert pass_share_res.status_code == 201
    pass_link_data = pass_share_res.json()
    assert pass_link_data["has_password"] is True
    assert pass_link_data["include_attachments"] is False
    token2 = pass_link_data["token"]
    link2_id = pass_link_data["id"]

    # Check guest metadata for password link (does not leak password)
    meta2_res = client.get(f"/api/shared-links/public/{token2}")
    assert meta2_res.status_code == 200
    meta2_data = meta2_res.json()
    assert meta2_data["has_password"] is True

    # Try fetching guest data without verifying password -> 401
    data2_fail = client.get(f"/api/shared-links/public/{token2}/data")
    assert data2_fail.status_code == 401

    # Verify wrong password -> 401
    verify_fail = client.post(
        f"/api/shared-links/public/{token2}/verify",
        json={"password": "wrongpassword"}
    )
    assert verify_fail.status_code == 401

    # Verify correct password -> returns guest token
    verify_ok = client.post(
        f"/api/shared-links/public/{token2}/verify",
        json={"password": "guestpassword"}
    )
    assert verify_ok.status_code == 200
    guest_token = verify_ok.json()["guest_token"]

    # Fetch guest data with guest token -> 200
    guest_headers = {"Authorization": f"Bearer {guest_token}"}
    data2_ok = client.get(f"/api/shared-links/public/{token2}/data", headers=guest_headers)
    assert data2_ok.status_code == 200
    guest2_entries = data2_ok.json()["entries"]
    # Include attachments was False, so report is nullified
    assert guest2_entries[0]["report"] is None

    # 7. Edit shared link (clear password)
    patch_res = client.patch(
        f"/api/shared-links/{link2_id}",
        json={"clear_password": True},
        headers=headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["has_password"] is False

    # Guest data should now be accessible without password
    data2_nopass = client.get(f"/api/shared-links/public/{token2}/data")
    assert data2_nopass.status_code == 200

    # 8. Expiry check
    yesterday = datetime.utcnow() - timedelta(days=1)
    # Set expires_at to yesterday
    patch_expired = client.patch(
        f"/api/shared-links/{link2_id}",
        json={"expires_at": yesterday.isoformat()},
        headers=headers
    )
    assert patch_expired.status_code == 200

    # Try accessing expired link -> 410 Gone
    expired_meta = client.get(f"/api/shared-links/public/{token2}")
    assert expired_meta.status_code == 410
    expired_data = client.get(f"/api/shared-links/public/{token2}/data")
    assert expired_data.status_code == 410

    # 9. List and Delete/Revoke shared links
    list_res = client.get("/api/shared-links", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2

    # Revoke/Delete link1
    delete_res = client.delete(f"/api/shared-links/{link_id}", headers=headers)
    assert delete_res.status_code == 204

    # Access revoked link -> 404
    revoked_meta = client.get(f"/api/shared-links/public/{token1}")
    assert revoked_meta.status_code == 404


def test_shared_links_limit(client: TestClient):
    # Register and login
    client.post(
        "/api/users/register",
        json={
            "login": "limituser",
            "email": "limit@example.com",
            "password": "password123",
            "display_name": "Limit User",
            "gender": "male",
            "birthday": "1990-01-01",
            "height_cm": 175.0,
            "target_weight_kg": 70.0,
            "preferred_language": "en"
        }
    )
    login_res = client.post(
        "/api/users/login",
        data={"username": "limituser", "password": "password123"}
    )
    headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    # Upload records using actual test data
    test_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.abspath(os.path.join(test_dir, "..", "..", "test-data", "Fitdays-test-data.csv"))
    with open(csv_path, "rb") as f:
        client.post(
            "/api/records/upload",
            headers=headers,
            files={"file": ("Fitdays-test-data.csv", f, "application/octet-stream")}
        )
        
    records = client.get("/api/records", headers=headers).json()
    rec_id = records[0]["id"]

    # Temporarily set MAX_ACTIVE_SHARED_LINKS to 3 in environment
    os.environ["MAX_ACTIVE_SHARED_LINKS"] = "3"

    try:
        # Create 3 links -> should succeed
        for i in range(3):
            res = client.post(
                "/api/shared-links",
                json={
                    "description": f"Link {i}",
                    "password": None,
                    "include_attachments": True,
                    "expires_at": None,
                    "entry_ids": [rec_id]
                },
                headers=headers
            )
            assert res.status_code == 201

        # Create 4th link -> should fail with 400
        fail_res = client.post(
            "/api/shared-links",
            json={
                "description": "Link 4 (should fail)",
                "password": None,
                "include_attachments": True,
                "expires_at": None,
                "entry_ids": [rec_id]
            },
            headers=headers
        )
        assert fail_res.status_code == 400
        assert "maximum limit" in fail_res.json()["detail"]

        # Revoke one link, then try again -> should succeed
        links = client.get("/api/shared-links", headers=headers).json()
        revoke_res = client.delete(f"/api/shared-links/{links[0]['id']}", headers=headers)
        assert revoke_res.status_code == 204

        retry_res = client.post(
            "/api/shared-links",
            json={
                "description": "Retry after revoke",
                "password": None,
                "include_attachments": True,
                "expires_at": None,
                "entry_ids": [rec_id]
            },
            headers=headers
        )
        assert retry_res.status_code == 201

    finally:
        # Restore environment
        if "MAX_ACTIVE_SHARED_LINKS" in os.environ:
            del os.environ["MAX_ACTIVE_SHARED_LINKS"]

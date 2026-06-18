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
            "username": "testuser",
            "email": "testuser@example.com",
            "password": "testpassword123"
        }
    )
    assert reg_response.status_code == 201
    assert reg_response.json()["username"] == "testuser"
    assert "id" in reg_response.json()

    # 2. Duplicate registration should fail
    dup_response = client.post(
        "/api/users/register",
        json={
            "username": "testuser",
            "email": "testuser2@example.com",
            "password": "testpassword123"
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
    assert profile_response.json()["username"] == "testuser"


def test_records_upload_and_summary(client: TestClient):
    # Register and login first
    client.post(
        "/api/users/register",
        json={
            "username": "celso",
            "email": "celso@example.com",
            "password": "celsopassword"
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

import os
import json
import io
from datetime import datetime
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User, FitdaysRecord, FitdaysReport, SharedLink
from app.auth import get_password_hash

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
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


def create_user_with_data(email="testdelete@example.com", password="securepassword123"):
    db = TestingSessionLocal()
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        display_name="Delete Tester",
        gender="female",
        birthday="1995-05-15",
        height_cm=165.0,
        target_weight_kg=60.0,
        preferred_language="pt",
        email_confirmed=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Add a Fitdays record
    record = FitdaysRecord(
        user_id=user.id,
        date=datetime(2026, 1, 1, 8, 0, 0),
        weight=65.0,
        bmi=23.8,
        body_fat_pct=25.0,
        subcutaneous_fat_pct=20.0,
        visceral_fat=5.0,
        body_water_pct=55.0,
        skeletal_muscle_mass_pct=35.0,
        muscle_mass=45.0,
        bone_mass=2.5,
        protein_pct=18.0,
        bmr=1400.0,
        metabolic_age=28.0,
        fat_mass=16.25,
        moisture_content=35.75,
        skeletal_muscle_mass=22.75,
        muscle_rate_pct=69.2,
        protein_mass=11.7,
        obesity_score=0,
        fat_free_mass=48.75,
        smi=6.5,
        body_score=85.0,
        target_weight=60.0,
        weight_control=-5.0,
        fat_control=-3.0,
        muscle_control=0.0
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Add a Shared Link
    shared_link = SharedLink(
        id="test-link-id-1",
        owner_id=user.id,
        token="testtoken123",
        description="My Progress",
        snapshot_data=json.dumps([{"weight": 65.0}]),
        created_at=datetime.utcnow()
    )
    db.add(shared_link)
    db.commit()
    user_id = user.id
    db.close()
    return user_id


def test_delete_user_data_wrong_password(client: TestClient):
    create_user_with_data()

    # Login
    login_resp = client.post("/api/users/login", data={"username": "testdelete@example.com", "password": "securepassword123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt deletion with wrong password
    del_resp = client.post("/api/users/me/delete-data", json={"password": "wrongpassword"}, headers=headers)
    assert del_resp.status_code == 400
    assert "Incorrect password" in del_resp.json()["detail"]

    # Verify data still exists
    db = TestingSessionLocal()
    records = db.query(FitdaysRecord).all()
    assert len(records) == 1
    shared_links = db.query(SharedLink).all()
    assert len(shared_links) == 1
    db.close()


@patch("app.routers.users.send_data_deletion_confirmation_email")
def test_delete_user_data_success(mock_email, client: TestClient):
    create_user_with_data()

    # Login
    login_resp = client.post("/api/users/login", data={"username": "testdelete@example.com", "password": "securepassword123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request data deletion
    del_resp = client.post("/api/users/me/delete-data", json={"password": "securepassword123"}, headers=headers)
    assert del_resp.status_code == 200
    data = del_resp.json()
    assert data["deleted_records_count"] == 1
    assert data["deleted_shared_links_count"] == 1

    # Verify email was dispatched
    mock_email.assert_called_once_with(to_email="testdelete@example.com", language="pt")

    # Verify records and shared links are deleted from DB
    db = TestingSessionLocal()
    records = db.query(FitdaysRecord).all()
    assert len(records) == 0
    shared_links = db.query(SharedLink).all()
    assert len(shared_links) == 0

    # Verify user profile still exists and remains active
    user = db.query(User).filter(User.email == "testdelete@example.com").first()
    assert user is not None
    assert user.display_name == "Delete Tester"
    assert user.height_cm == 165.0
    db.close()

    # Verify user can still login
    relogin_resp = client.post("/api/users/login", data={"username": "testdelete@example.com", "password": "securepassword123"})
    assert relogin_resp.status_code == 200


def test_delete_account_wrong_password(client: TestClient):
    create_user_with_data()

    login_resp = client.post("/api/users/login", data={"username": "testdelete@example.com", "password": "securepassword123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt deletion with wrong password
    del_resp = client.request("DELETE", "/api/users/me", json={"password": "wrongpassword"}, headers=headers)
    assert del_resp.status_code == 400
    assert "Incorrect password" in del_resp.json()["detail"]

    # Verify user still exists
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "testdelete@example.com").first()
    assert user is not None
    db.close()


@patch("app.routers.users.send_account_deletion_confirmation_email")
def test_delete_account_success(mock_email, client: TestClient, tmp_path):
    user_id = create_user_with_data()

    # Create a mock avatar file
    avatar_file = tmp_path / "avatar.png"
    avatar_file.write_bytes(b"avatar-bytes")
    
    db = TestingSessionLocal()
    db_user = db.query(User).filter(User.id == user_id).first()
    db_user.profile_image_path = str(avatar_file)
    db.commit()
    db.close()

    assert os.path.exists(str(avatar_file))

    login_resp = client.post("/api/users/login", data={"username": "testdelete@example.com", "password": "securepassword123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Delete account
    del_resp = client.request("DELETE", "/api/users/me", json={"password": "securepassword123"}, headers=headers)
    assert del_resp.status_code == 200
    assert "permanently deleted" in del_resp.json()["message"]

    # Verify email notification was called
    mock_email.assert_called_once_with(to_email="testdelete@example.com", language="pt")

    # Verify avatar file was deleted from disk
    assert not os.path.exists(str(avatar_file))

    # Verify all records, shared links, and user are deleted
    db = TestingSessionLocal()
    assert db.query(User).count() == 0
    assert db.query(FitdaysRecord).count() == 0
    assert db.query(SharedLink).count() == 0
    db.close()

    # Verify login fails
    relogin_resp = client.post("/api/users/login", data={"username": "testdelete@example.com", "password": "securepassword123"})
    assert relogin_resp.status_code == 401

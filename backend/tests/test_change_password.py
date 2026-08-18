import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User
from app.auth import get_password_hash, verify_password

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


def create_test_user(email="pwduser@example.com", password="oldpassword123"):
    db = TestingSessionLocal()
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        display_name="Password Tester",
        gender="male",
        birthday="1992-04-20",
        height_cm=175.0,
        target_weight_kg=70.0,
        preferred_language="pt",
        email_confirmed=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user_id = user.id
    db.close()
    return user_id


@patch("app.routers.users.send_password_reset_confirmation_email")
def test_change_password_success(mock_email, client: TestClient):
    create_test_user()

    login_resp = client.post("/api/users/login", data={"username": "pwduser@example.com", "password": "oldpassword123"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change password
    resp = client.post(
        "/api/users/change-password",
        json={"current_password": "oldpassword123", "new_password": "newsecurepassword456"},
        headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Password changed successfully"

    # Verify confirmation email sent
    mock_email.assert_called_once_with(to_email="pwduser@example.com", language="pt")

    # Verify old password fails login
    old_login = client.post("/api/users/login", data={"username": "pwduser@example.com", "password": "oldpassword123"})
    assert old_login.status_code == 401

    # Verify new password succeeds login
    new_login = client.post("/api/users/login", data={"username": "pwduser@example.com", "password": "newsecurepassword456"})
    assert new_login.status_code == 200


def test_change_password_wrong_current_password(client: TestClient):
    create_test_user()

    login_resp = client.post("/api/users/login", data={"username": "pwduser@example.com", "password": "oldpassword123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/users/change-password",
        json={"current_password": "incorrectpassword", "new_password": "newsecurepassword456"},
        headers=headers
    )
    assert resp.status_code == 400
    assert "Current password is incorrect" in resp.json()["detail"]


def test_change_password_short_password(client: TestClient):
    create_test_user()

    login_resp = client.post("/api/users/login", data={"username": "pwduser@example.com", "password": "oldpassword123"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/users/change-password",
        json={"current_password": "oldpassword123", "new_password": "123"},
        headers=headers
    )
    assert resp.status_code == 422  # Pydantic validation error for min_length=6


def test_change_password_unauthenticated(client: TestClient):
    resp = client.post(
        "/api/users/change-password",
        json={"current_password": "oldpassword123", "new_password": "newsecurepassword456"}
    )
    assert resp.status_code == 401

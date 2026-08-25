import os
from datetime import datetime, timedelta
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


def create_test_user(email="user@example.com", password="originalpassword123"):
    db = TestingSessionLocal()
    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        display_name="Reset Tester",
        gender="male",
        birthday="1990-01-01",
        height_cm=180.0,
        target_weight_kg=75.0,
        preferred_language="pt",
        email_confirmed=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()
    return user


def test_forgot_password_success(client: TestClient):
    create_test_user("alice@example.com", "pass123456")

    with patch("app.routers.users.send_password_reset_email") as mock_send:
        resp = client.post("/api/users/forgot-password", json={"email": "alice@example.com"})
        assert resp.status_code == 200
        assert "password reset link" in resp.json()["message"]
        mock_send.assert_called_once()
        args, kwargs = mock_send.call_args
        assert kwargs["to_email"] == "alice@example.com"
        assert kwargs["language"] == "pt"
        assert len(kwargs["token"]) > 20
        assert len(kwargs["code"]) == 6

    # Verify DB state
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "alice@example.com").first()
    assert user.reset_password_token is not None
    assert user.reset_password_code is not None
    assert user.reset_password_expires_at is not None
    assert user.reset_password_attempts == 0
    db.close()


def test_forgot_password_nonexistent_email_anti_enumeration(client: TestClient):
    with patch("app.routers.users.send_password_reset_email") as mock_send:
        resp = client.post("/api/users/forgot-password", json={"email": "unknown@example.com"})
        assert resp.status_code == 200
        assert "password reset link" in resp.json()["message"]
        mock_send.assert_not_called()


def test_validate_reset_token_valid(client: TestClient):
    create_test_user("bob@example.com")
    client.post("/api/users/forgot-password", json={"email": "bob@example.com"})

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "bob@example.com").first()
    token = user.reset_password_token
    code = user.reset_password_code
    db.close()

    # Validate by token without email
    resp1 = client.post("/api/users/validate-reset-token", json={"token_or_code": token})
    assert resp1.status_code == 200
    assert resp1.json()["valid"] is True
    assert resp1.json()["email"] == "bob@example.com"

    # Validate by code with email
    resp2 = client.post("/api/users/validate-reset-token", json={"token_or_code": code, "email": "bob@example.com"})
    assert resp2.status_code == 200
    assert resp2.json()["valid"] is True

    # Validate with invalid token
    resp3 = client.post("/api/users/validate-reset-token", json={"token_or_code": "invalid-token-123"})
    assert resp3.status_code == 200
    assert resp3.json()["valid"] is False


def test_reset_password_with_token_and_auto_login(client: TestClient):
    create_test_user("carol@example.com", "oldpassword123")
    client.post("/api/users/forgot-password", json={"email": "carol@example.com"})

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "carol@example.com").first()
    token = user.reset_password_token
    db.close()

    with patch("app.routers.users.send_password_reset_confirmation_email") as mock_confirm:
        resp = client.post(
            "/api/users/reset-password",
            json={
                "token_or_code": token,
                "new_password": "newsecretpassword999"
            }
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "Password reset successfully" in data["message"]
        mock_confirm.assert_called_once_with(to_email="carol@example.com", language="pt")

    access_token = data["access_token"]

    # Verify auto-login access token gives access to /api/users/me
    me_resp = client.get("/api/users/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "carol@example.com"

    # Verify old password fails login and new password succeeds
    login_old = client.post("/api/users/login", data={"username": "carol@example.com", "password": "oldpassword123"})
    assert login_old.status_code == 401

    login_new = client.post("/api/users/login", data={"username": "carol@example.com", "password": "newsecretpassword999"})
    assert login_new.status_code == 200

    # Verify reset token is invalidated (single-use)
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "carol@example.com").first()
    assert user.reset_password_token is None
    assert user.reset_password_code is None
    assert user.reset_password_expires_at is None
    db.close()


def test_reset_password_with_code_and_email(client: TestClient):
    create_test_user("dan@example.com", "pass123")
    client.post("/api/users/forgot-password", json={"email": "dan@example.com"})

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "dan@example.com").first()
    code = user.reset_password_code
    db.close()

    resp = client.post(
        "/api/users/reset-password",
        json={
            "email": "dan@example.com",
            "token_or_code": code,
            "new_password": "brandnewpassword456"
        }
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_reset_password_lockout_after_max_attempts(client: TestClient):
    create_test_user("eve@example.com", "pass123")
    client.post("/api/users/forgot-password", json={"email": "eve@example.com"})

    # Send 5 incorrect attempts
    for attempt in range(1, 6):
        resp = client.post(
            "/api/users/reset-password",
            json={
                "email": "eve@example.com",
                "token_or_code": f"wrong{attempt}",
                "new_password": "somepassword123"
            }
        )
        assert resp.status_code == 400
        if attempt < 5:
            assert f"{5 - attempt} attempt(s) remaining" in resp.json()["detail"]
        else:
            assert "Too many failed attempts" in resp.json()["detail"]

    # Even with correct code now, it should reject because attempts reached limit
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "eve@example.com").first()
    correct_code = user.reset_password_code
    db.close()

    resp = client.post(
        "/api/users/reset-password",
        json={
            "email": "eve@example.com",
            "token_or_code": correct_code,
            "new_password": "somepassword123"
        }
    )
    assert resp.status_code == 400
    assert "Too many failed attempts" in resp.json()["detail"]


def test_reset_password_expired_token(client: TestClient):
    create_test_user("frank@example.com", "pass123")
    client.post("/api/users/forgot-password", json={"email": "frank@example.com"})

    # Expire the token manually
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "frank@example.com").first()
    user.reset_password_expires_at = datetime.utcnow() - timedelta(minutes=5)
    token = user.reset_password_token
    db.commit()
    db.close()

    resp = client.post(
        "/api/users/reset-password",
        json={
            "token_or_code": token,
            "new_password": "newpassword123"
        }
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"]

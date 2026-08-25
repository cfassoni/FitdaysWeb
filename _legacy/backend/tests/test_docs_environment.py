import os
import importlib
import pytest
from fastapi.testclient import TestClient

def test_docs_enabled_in_development():
    # Ensure environment is development
    os.environ["ENVIRONMENT"] = "development"
    import app.main
    importlib.reload(app.main)

    client = TestClient(app.main.app)

    # In development, docs and openapi should be accessible
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    assert "openapi" in openapi_resp.json()

    root_resp = client.get("/")
    assert root_resp.status_code == 200
    assert "Visit /docs" in root_resp.json()["message"]


def test_docs_disabled_in_production():
    # Set environment to production
    os.environ["ENVIRONMENT"] = "production"
    import app.main
    importlib.reload(app.main)

    client = TestClient(app.main.app)

    # In production, docs, redoc, and openapi should return 404
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 404

    redoc_resp = client.get("/redoc")
    assert redoc_resp.status_code == 404

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 404

    root_resp = client.get("/")
    assert root_resp.status_code == 200
    assert "Visit /docs" not in root_resp.json()["message"]
    assert root_resp.json()["message"] == "Welcome to FitdaysWeb API."

    # Restore environment to development
    os.environ["ENVIRONMENT"] = "development"
    importlib.reload(app.main)

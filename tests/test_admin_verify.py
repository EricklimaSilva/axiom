from backend.app import create_app
from config import TestingConfig


def setup_module():
    TestingConfig.ADMIN_API_KEY = "test-admin-key"


def test_admin_verify_success():
    app = create_app(TestingConfig)
    client = app.test_client()

    resp = client.post("/api/admin/verify", headers={"X-ErickOS-Admin-Key": "test-admin-key"})
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["success"] is True


def test_admin_verify_forbidden():
    app = create_app(TestingConfig)
    client = app.test_client()

    resp = client.post("/api/admin/verify", headers={"X-ErickOS-Admin-Key": "bad-key"})
    assert resp.status_code == 403
    payload = resp.get_json()
    assert payload["success"] is False

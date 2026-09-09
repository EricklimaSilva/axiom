from backend.app import create_app
from config import TestingConfig
from extensions import db


TestingConfig.ADMIN_API_KEY = "test-admin-key"


def setup_function():
    app = create_app(TestingConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()


def test_create_certificate_without_cover():
    app = create_app(TestingConfig)
    client = app.test_client()
    admin_headers = {"X-ErickOS-Admin-Key": "test-admin-key"}

    payload = {
        "name": "Cert Sem Capa",
        "description": "Descrição",
    }

    resp = client.post("/api/certificates", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["name"] == "Cert Sem Capa"
    assert data["cover_image_path"] == "/assets/certificates/placeholder-certificado.svg"


def test_create_certificate_with_cover():
    app = create_app(TestingConfig)
    client = app.test_client()
    admin_headers = {"X-ErickOS-Admin-Key": "test-admin-key"}

    payload = {
        "name": "Cert Com Capa",
        "description": "Descrição",
        "cover_image_path": "/assets/certificates/sqlite-alura.webp",
    }

    resp = client.post("/api/certificates", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["cover_image_path"] == "/assets/certificates/sqlite-alura.webp"


def test_update_certificate_cover():
    app = create_app(TestingConfig)
    client = app.test_client()
    admin_headers = {"X-ErickOS-Admin-Key": "test-admin-key"}

    # create
    payload = {
        "name": "Cert Para Editar",
        "description": "Descrição",
    }
    create_resp = client.post("/api/certificates", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201
    cert = create_resp.get_json()["data"]
    cert_id = cert["id"]

    # update cover
    update_payload = {"cover_image_path": "/assets/certificates/new-cover.webp", "name": cert["name"]}
    update_resp = client.put(f"/api/certificates/{cert_id}", json=update_payload, headers=admin_headers)
    assert update_resp.status_code == 200
    updated = update_resp.get_json()["data"]
    assert updated["cover_image_path"] == "/assets/certificates/new-cover.webp"

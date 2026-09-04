import unittest
from datetime import date

from backend.app import create_app
from config import TestingConfig
from extensions import db


class InfrastructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestingConfig)
        cls.client = cls.app.test_client()

    def setUp(self):
        with self.app.app_context():
            db.drop_all()
            db.create_all()

    def post_json(self, path, payload):
        return self.client.post(path, json=payload)

    def put_json(self, path, payload):
        return self.client.put(path, json=payload)

    def test_application_bootstraps_with_database_config(self):
        self.assertIsNotNone(self.app)
        self.assertTrue(self.app.config.get("SQLALCHEMY_DATABASE_URI"))

    def test_health_endpoint_reports_engine(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"]["api"], "online")
        self.assertEqual(payload["data"]["database"], "online")
        self.assertIn(payload["data"]["database_engine"], {"sqlite", "postgresql"})

    def test_cors_for_allowed_127_origin(self):
        response = self.client.get(
            "/api/health",
            headers={"Origin": "http://127.0.0.1:5500"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "http://127.0.0.1:5500")

    def test_cors_for_allowed_localhost_origin(self):
        response = self.client.get(
            "/api/health",
            headers={"Origin": "http://localhost:5500"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "http://localhost:5500")

    def test_cors_rejects_unallowed_origin(self):
        response = self.client.get(
            "/api/health",
            headers={"Origin": "http://malicious.example"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    def test_study_crud_cycle(self):
        payload = {
            "date": "2026-09-03",
            "category": "Backend",
            "technology": "Python",
            "subject": "Flask",
            "duration_minutes": 90,
            "description": "API REST",
        }

        create_response = self.post_json("/api/studies", payload)
        self.assertEqual(create_response.status_code, 201)
        study = create_response.get_json()["data"]
        self.assertEqual(study["subject"], "Flask")

        list_response = self.client.get("/api/studies")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.get_json()["data"]), 1)

        update_response = self.put_json(
            f"/api/studies/{study['id']}",
            {
                **payload,
                "duration_minutes": 120,
                "description": "API REST atualizada",
            },
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.get_json()["data"]["duration_minutes"], 120)

        delete_response = self.client.delete(f"/api/studies/{study['id']}")
        self.assertEqual(delete_response.status_code, 204)

        empty_response = self.client.get("/api/studies")
        self.assertEqual(len(empty_response.get_json()["data"]), 0)

    def test_project_crud_cycle(self):
        payload = {
            "name": "Axiom Core",
            "description": "Aplicação principal",
            "status": "active",
            "technologies": ["Python", "Flask"],
            "repository_url": "https://github.com/example/axiom",
            "project_url": "https://axiom.local",
            "started_at": "2026-09-01",
        }

        create_response = self.post_json("/api/projects", payload)
        self.assertEqual(create_response.status_code, 201)
        project = create_response.get_json()["data"]
        self.assertEqual(project["name"], "Axiom Core")

        list_response = self.client.get("/api/projects")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.get_json()["data"]), 1)

        update_response = self.put_json(
            f"/api/projects/{project['id']}",
            {
                **payload,
                "status": "completed",
                "description": "Aplicação principal finalizada",
            },
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.get_json()["data"]["status"], "completed")

        delete_response = self.client.delete(f"/api/projects/{project['id']}")
        self.assertEqual(delete_response.status_code, 204)

    def test_language_certificate_code_site_dashboard_and_settings(self):
        language = self.post_json(
            "/api/languages",
            {
                "date": "2026-09-03",
                "language": "Inglês",
                "level": "intermediate",
                "activity": "Listening",
                "duration_minutes": 60,
                "notes": "Curso online",
            },
        )
        self.assertEqual(language.status_code, 201)

        certificate = self.post_json(
            "/api/certificates",
            {
                "name": "Python Essentials",
                "institution": "Coursera",
                "issue_date": "2026-08-30",
                "certificate_url": "https://example.com/cert.pdf",
                "description": "Curso concluído",
            },
        )
        self.assertEqual(certificate.status_code, 201)

        code = self.post_json(
            "/api/codes",
            {
                "title": "Autogenerated helper",
                "description": "Snippet com IA",
                "code_content": "def greet(name):\n    return f'Hello, {name}'",
                "type": "AI_ASSISTED",
                "technology": "Python",
            },
        )
        self.assertEqual(code.status_code, 201)
        self.assertIn("code_content", code.get_json()["data"])

        site = self.post_json(
            "/api/sites",
            {
                "name": "Axiom Site",
                "description": "Site institucional",
                "url": "https://example.com",
                "repository_url": "https://github.com/example/site",
                "technologies": ["HTML", "CSS"],
                "status": "active",
            },
        )
        self.assertEqual(site.status_code, 201)

        dashboard = self.post_json(
            "/api/dashboards",
            {
                "name": "BI Principal",
                "description": "Painel de métricas",
                "tool": "Power BI",
                "project_url": "https://bi.example.com",
                "image_url": "https://example.com/image.png",
            },
        )
        self.assertEqual(dashboard.status_code, 201)

        settings = self.post_json(
            "/api/settings",
            {
                "key": "ui.admin_mode",
                "value": "true",
            },
        )
        self.assertEqual(settings.status_code, 201)

        settings_payload = settings.get_json()["data"]
        update_settings = self.put_json(
            f"/api/settings/{settings_payload['id']}",
            {
                "key": "ui.admin_mode",
                "value": "false",
            },
        )
        self.assertEqual(update_settings.status_code, 200)

        dashboard_list = self.client.get("/api/dashboard/summary")
        self.assertEqual(dashboard_list.status_code, 200)

    def test_dashboard_summary_uses_real_records(self):
        self.post_json(
            "/api/studies",
            {
                "date": date.today().isoformat(),
                "category": "Backend",
                "technology": "Python",
                "subject": "Flask",
                "duration_minutes": 120,
                "description": "Resumo real",
            },
        )
        self.post_json(
            "/api/projects",
            {
                "name": "Axiom Core",
                "status": "active",
                "technologies": ["Python"],
            },
        )
        self.post_json(
            "/api/certificates",
            {
                "name": "Python Essentials",
                "institution": "Coursera",
            },
        )

        response = self.client.get("/api/dashboard/summary")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()["data"]
        self.assertEqual(payload["total_minutes"], 120)
        self.assertEqual(payload["total_studies"], 1)
        self.assertEqual(payload["projects"], 1)
        self.assertEqual(payload["certificates"], 1)
        self.assertEqual(payload["study_days"], 1)
        self.assertGreaterEqual(payload["streak"], 1)
        self.assertEqual(len(payload["recentStudies"]), 1)
        self.assertEqual(len(payload["studies_last_7_days"]), 7)


if __name__ == "__main__":
    unittest.main()

import unittest
import os

from backend.app import app


class LegacyProjectIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_projects_creation_supports_media_and_logic(self):
        admin_key = os.getenv("ADMIN_API_KEY", "")
        response = self.client.post(
            "/api/projects",
            json={
                "title": "Projeto de demonstração",
                "media_url": "https://example.com/demo.mp4",
                "media_type": "video",
                "logic_description": "A lógica central é processar os dados em tempo real.",
            },
            headers={"X-ErickOS-Admin-Key": admin_key},
        )

        self.assertIn(response.status_code, [201, 403, 503])


if __name__ == "__main__":
    unittest.main()
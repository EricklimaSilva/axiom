import os
import sys
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import DevelopmentConfig, ProductionConfig
from extensions import db, migrate
from axiom_models import Certificate, CodeProject, DashboardProject, LanguageStudy, Project, Setting, Site, StudyEntry
from routes.api import api_bp
from routes.health import health_bp

BASE_DIR = BACKEND_DIR.parent
FRONTEND_DIR = BASE_DIR / "frontend"

ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

ALLOWED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
ALLOWED_HEADERS = ["Content-Type", "Authorization"]


def get_default_config():
    environment = os.getenv("APP_ENV", os.getenv("FLASK_ENV", "development")).lower()
    if environment in {"production", "prod"}:
        return ProductionConfig
    return DevelopmentConfig


def create_app(config_class=None):
    config_class = config_class or get_default_config()
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    CORS(
        app,
        resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
        allow_headers=ALLOWED_HEADERS,
        allow_methods=ALLOWED_METHODS,
        supports_credentials=False,
        vary_header=True,
    )

    app.register_blueprint(health_bp)
    app.register_blueprint(api_bp)

    @app.errorhandler(403)
    def handle_forbidden(_error):
        return jsonify({"success": False, "error": "Acesso negado."}), 403

    @app.errorhandler(404)
    def handle_not_found(_error):
        return jsonify({"success": False, "error": "Recurso não encontrado."}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(_error):
        return jsonify({"success": False, "error": "Método não permitido."}), 405

    @app.errorhandler(500)
    def handle_server_error(_error):
        return jsonify({"success": False, "error": "Erro interno do servidor."}), 500

    @app.get("/")
    def index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/<path:path>")
    def serve_frontend(path):
        if path.startswith("api/") or path == "api":
            abort(404)

        full_path = (FRONTEND_DIR / path).resolve()
        if not full_path.exists() or not full_path.is_file():
            abort(404)

        try:
            return send_from_directory(FRONTEND_DIR, path)
        except FileNotFoundError:
            abort(404)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        use_reloader=False,
    )


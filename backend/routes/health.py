from flask import Blueprint, current_app, jsonify

from services.database_service import (
    DatabaseConnectionError,
    check_postgres_connection,
)


health_bp = Blueprint("health", __name__)


@health_bp.get("/api/health")
def health_check():
    try:
        database_status = check_postgres_connection()

        return jsonify(
            {
                "success": True,
                "data": {
                    "api": database_status["api"],
                    "database": database_status["database"],
                    "database_engine": database_status["database_engine"],
                },
                "message": "A API do Axiom está funcionando.",
            }
        ), 200
    except DatabaseConnectionError as exc:
        current_app.logger.exception("Falha ao conectar ao PostgreSQL no health check.")
        return jsonify(
            {
                "success": False,
                "error": str(exc),
            }
        ), 503
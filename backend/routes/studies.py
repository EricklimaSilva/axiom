from flask import Blueprint, jsonify, request

from admin_auth import require_admin_access
from services.study_service import (
    ValidationError,
    create_study_session_service,
    delete_study_session_service,
    get_study_session_service,
    list_study_sessions_service,
    update_study_session_service,
)

studies_bp = Blueprint("studies", __name__)


@studies_bp.get("/api/studies")
def list_study_route():
    sessions = list_study_sessions_service()

    return jsonify({
        "success": True,
        "data": [
            dict(session)
            for session in sessions
        ],
        "message": "Sessões de estudo carregadas com sucesso.",
    })


@studies_bp.get("/api/studies/<int:study_id>")
def get_study_route(study_id):
    try:
        session = get_study_session_service(study_id)

        return jsonify({
            "success": True,
            "data": session,
            "message": "Sessão de estudo carregada com sucesso.",
        })

    except ValidationError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "error": "Não foi possível carregar a sessão de estudo.",
        }), 500


@studies_bp.post("/api/studies")
def create_study_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        data = request.get_json(silent=True) or {}
        study_id = create_study_session_service(data)
        session = get_study_session_service(study_id)

        return jsonify({
            "success": True,
            "data": session,
            "message": "Sessão de estudo registrada com sucesso.",
        }), 201

    except ValidationError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "error": "Não foi possível salvar a sessão de estudo.",
        }), 500


@studies_bp.put("/api/studies/<int:study_id>")
def update_study_route(study_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        data = request.get_json(silent=True) or {}
        session = update_study_session_service(study_id, data)

        return jsonify({
            "success": True,
            "data": dict(session),
            "message": "Sessão de estudo atualizada com sucesso.",
        })

    except ValidationError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "error": "Não foi possível atualizar a sessão de estudo.",
        }), 500


@studies_bp.delete("/api/studies/<int:study_id>")
def delete_study_route(study_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        delete_study_session_service(study_id)

        return jsonify({
            "success": True,
            "message": "Sessão de estudo removida com sucesso.",
        }), 200

    except ValidationError as exc:
        return jsonify({
            "success": False,
            "error": str(exc),
        }), 400

    except Exception:
        return jsonify({
            "success": False,
            "error": "Não foi possível remover a sessão de estudo.",
        }), 500

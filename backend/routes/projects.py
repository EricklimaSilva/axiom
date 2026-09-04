from flask import Blueprint, jsonify, request

from admin_auth import require_admin_access
from services.project_service import (
    list_projects,
    add_project,
)

projects_bp = Blueprint("projects", __name__)


@projects_bp.get("/api/projects")
def get_projects():
    projects = list_projects()

    return jsonify([
        dict(project)
        for project in projects
    ])


@projects_bp.post("/api/projects")
def create_project_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    data = request.get_json(silent=True) or {}

    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "O título do projeto é obrigatório."}), 400

    project_id = add_project(
        title=title,
        description=data.get("description", "").strip() or None,
        technologies=data.get("technologies", "").strip() or None,
        project_url=data.get("project_url", "").strip() or None,
        repository_url=data.get("repository_url", "").strip() or None,
        media_url=data.get("media_url", "").strip() or None,
        media_type=data.get("media_type", "").strip() or None,
        logic_description=data.get("logic_description", "").strip() or None,
    )

    return jsonify({
        "message": "Projeto criado com sucesso.",
        "id": project_id,
    }), 201
from __future__ import annotations

from flask import Blueprint, jsonify, request
from admin_auth import require_admin_access

from services.api_service import (
    ValidationError,
    NotFoundError,
    create_certificate,
    create_code,
    create_dashboard_project,
    create_language,
    create_project,
    create_setting,
    create_site,
    create_study,
    delete_certificate,
    delete_code,
    delete_dashboard_project,
    delete_language,
    delete_project,
    delete_setting,
    delete_site,
    delete_study,
    get_certificate,
    get_code,
    get_dashboard_project,
    get_language,
    get_project,
    get_setting,
    get_site,
    get_study,
    get_dashboard_summary,
    list_certificates,
    list_codes,
    list_dashboard_projects,
    list_languages,
    list_projects,
    list_settings,
    list_sites,
    list_studies,
    update_certificate,
    update_code,
    update_dashboard_project,
    update_language,
    update_project,
    update_setting,
    update_site,
    update_study,
)

api_bp = Blueprint("api", __name__)


def _success(data=None, message: str | None = None, status: int = 200):
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    if message is not None:
        payload["message"] = message
    return jsonify(payload), status


def _error(message: str, status: int):
    return jsonify({"success": False, "error": message}), status


def _handle_not_found(resource_name: str):
    return _error(f"{resource_name} não encontrado.", 404)


# ---------------------------------------------------------------------------
# Admin verification
# ---------------------------------------------------------------------------


@api_bp.post("/api/admin/verify")
def verify_admin_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    return jsonify({"success": True}), 200


# ---------------------------------------------------------------------------
# Studies
# ---------------------------------------------------------------------------


@api_bp.get("/api/studies")
def get_studies():
    return _success(list_studies(), "Sessões de estudo carregadas com sucesso.")


@api_bp.get("/api/studies/<int:study_id>")
def get_study_route(study_id):
    study = get_study(study_id)
    if study is None:
        return _handle_not_found("Sessão de estudo")
    return _success(study, "Sessão de estudo carregada com sucesso.")


@api_bp.post("/api/studies")
def create_study_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        study = create_study(request.get_json(silent=True) or {})
        return _success(study, "Sessão de estudo registrada com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar a sessão de estudo.", 500)


@api_bp.put("/api/studies/<int:study_id>")
def update_study_route(study_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        study = update_study(study_id, request.get_json(silent=True) or {})
        if study is None:
            return _handle_not_found("Sessão de estudo")
        return _success(study, "Sessão de estudo atualizada com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar a sessão de estudo.", 500)


@api_bp.delete("/api/studies/<int:study_id>")
def delete_study_route(study_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_study(study_id)
        if not deleted:
            return _handle_not_found("Sessão de estudo")
        return "", 204
    except Exception:
        return _error("Não foi possível remover a sessão de estudo.", 500)


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------


@api_bp.get("/api/projects")
def get_projects():
    return _success(list_projects(), "Projetos carregados com sucesso.")


@api_bp.get("/api/projects/<int:project_id>")
def get_project_route(project_id):
    project = get_project(project_id)
    if project is None:
        return _handle_not_found("Projeto")
    return _success(project, "Projeto carregado com sucesso.")


@api_bp.post("/api/projects")
def create_project_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        project = create_project(request.get_json(silent=True) or {})
        return _success(project, "Projeto criado com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar o projeto.", 500)


@api_bp.put("/api/projects/<int:project_id>")
def update_project_route(project_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        project = update_project(project_id, request.get_json(silent=True) or {})
        if project is None:
            return _handle_not_found("Projeto")
        return _success(project, "Projeto atualizado com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar o projeto.", 500)


@api_bp.delete("/api/projects/<int:project_id>")
def delete_project_route(project_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_project(project_id)
        if not deleted:
            return _handle_not_found("Projeto")
        return "", 204
    except Exception:
        return _error("Não foi possível remover o projeto.", 500)


# ---------------------------------------------------------------------------
# Languages
# ---------------------------------------------------------------------------


@api_bp.get("/api/languages")
def get_languages():
    return _success(list_languages(), "Sessões de idioma carregadas com sucesso.")


@api_bp.get("/api/languages/<int:language_id>")
def get_language_route(language_id):
    language = get_language(language_id)
    if language is None:
        return _handle_not_found("Sessão de idioma")
    return _success(language, "Sessão de idioma carregada com sucesso.")


@api_bp.post("/api/languages")
def create_language_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        language = create_language(request.get_json(silent=True) or {})
        return _success(language, "Sessão de idioma registrada com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar a sessão de idioma.", 500)


@api_bp.put("/api/languages/<int:language_id>")
def update_language_route(language_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        language = update_language(language_id, request.get_json(silent=True) or {})
        if language is None:
            return _handle_not_found("Sessão de idioma")
        return _success(language, "Sessão de idioma atualizada com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar a sessão de idioma.", 500)


@api_bp.delete("/api/languages/<int:language_id>")
def delete_language_route(language_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_language(language_id)
        if not deleted:
            return _handle_not_found("Sessão de idioma")
        return "", 204
    except Exception:
        return _error("Não foi possível remover a sessão de idioma.", 500)


# ---------------------------------------------------------------------------
# Certificates
# ---------------------------------------------------------------------------


@api_bp.get("/api/certificates")
def get_certificates():
    return _success(list_certificates(), "Certificados carregados com sucesso.")


@api_bp.get("/api/certificates/<int:certificate_id>")
def get_certificate_route(certificate_id):
    certificate = get_certificate(certificate_id)
    if certificate is None:
        return _handle_not_found("Certificado")
    return _success(certificate, "Certificado carregado com sucesso.")


@api_bp.post("/api/certificates")
def create_certificate_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        certificate = create_certificate(request.get_json(silent=True) or {})
        return _success(certificate, "Certificado criado com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar o certificado.", 500)


@api_bp.put("/api/certificates/<int:certificate_id>")
def update_certificate_route(certificate_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        certificate = update_certificate(certificate_id, request.get_json(silent=True) or {})
        if certificate is None:
            return _handle_not_found("Certificado")
        return _success(certificate, "Certificado atualizado com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar o certificado.", 500)


@api_bp.delete("/api/certificates/<int:certificate_id>")
def delete_certificate_route(certificate_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_certificate(certificate_id)
        if not deleted:
            return _handle_not_found("Certificado")
        return "", 204
    except Exception:
        return _error("Não foi possível remover o certificado.", 500)


# ---------------------------------------------------------------------------
# Codes
# ---------------------------------------------------------------------------


@api_bp.get("/api/codes")
def get_codes():
    code_type = request.args.get("type")
    return _success(list_codes(code_type), "Códigos carregados com sucesso.")


@api_bp.get("/api/codes/<int:code_id>")
def get_code_route(code_id):
    code = get_code(code_id)
    if code is None:
        return _handle_not_found("Código")
    return _success(code, "Código carregado com sucesso.")


@api_bp.post("/api/codes")
def create_code_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        code = create_code(request.get_json(silent=True) or {})
        return _success(code, "Código criado com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar o código.", 500)


@api_bp.put("/api/codes/<int:code_id>")
def update_code_route(code_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        code = update_code(code_id, request.get_json(silent=True) or {})
        if code is None:
            return _handle_not_found("Código")
        return _success(code, "Código atualizado com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar o código.", 500)


@api_bp.delete("/api/codes/<int:code_id>")
def delete_code_route(code_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_code(code_id)
        if not deleted:
            return _handle_not_found("Código")
        return "", 204
    except Exception:
        return _error("Não foi possível remover o código.", 500)


# ---------------------------------------------------------------------------
# Sites
# ---------------------------------------------------------------------------


@api_bp.get("/api/sites")
def get_sites():
    return _success(list_sites(), "Sites carregados com sucesso.")


@api_bp.get("/api/sites/<int:site_id>")
def get_site_route(site_id):
    site = get_site(site_id)
    if site is None:
        return _handle_not_found("Site")
    return _success(site, "Site carregado com sucesso.")


@api_bp.post("/api/sites")
def create_site_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        site = create_site(request.get_json(silent=True) or {})
        return _success(site, "Site criado com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar o site.", 500)


@api_bp.put("/api/sites/<int:site_id>")
def update_site_route(site_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        site = update_site(site_id, request.get_json(silent=True) or {})
        if site is None:
            return _handle_not_found("Site")
        return _success(site, "Site atualizado com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar o site.", 500)


@api_bp.delete("/api/sites/<int:site_id>")
def delete_site_route(site_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_site(site_id)
        if not deleted:
            return _handle_not_found("Site")
        return "", 204
    except Exception:
        return _error("Não foi possível remover o site.", 500)


# ---------------------------------------------------------------------------
# Dashboards
# ---------------------------------------------------------------------------


@api_bp.get("/api/dashboards")
def get_dashboards():
    return _success(list_dashboard_projects(), "Dashboards carregados com sucesso.")


@api_bp.get("/api/dashboards/<int:dashboard_id>")
def get_dashboard_route(dashboard_id):
    dashboard = get_dashboard_project(dashboard_id)
    if dashboard is None:
        return _handle_not_found("Dashboard")
    return _success(dashboard, "Dashboard carregado com sucesso.")


@api_bp.post("/api/dashboards")
def create_dashboard_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        dashboard = create_dashboard_project(request.get_json(silent=True) or {})
        return _success(dashboard, "Dashboard criado com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar o dashboard.", 500)


@api_bp.put("/api/dashboards/<int:dashboard_id>")
def update_dashboard_route(dashboard_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        dashboard = update_dashboard_project(dashboard_id, request.get_json(silent=True) or {})
        if dashboard is None:
            return _handle_not_found("Dashboard")
        return _success(dashboard, "Dashboard atualizado com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar o dashboard.", 500)


@api_bp.delete("/api/dashboards/<int:dashboard_id>")
def delete_dashboard_route(dashboard_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_dashboard_project(dashboard_id)
        if not deleted:
            return _handle_not_found("Dashboard")
        return "", 204
    except Exception:
        return _error("Não foi possível remover o dashboard.", 500)


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


@api_bp.get("/api/settings")
def get_settings():
    return _success(list_settings(), "Configurações carregadas com sucesso.")


@api_bp.get("/api/settings/<int:setting_id>")
def get_setting_route(setting_id):
    setting = get_setting(setting_id)
    if setting is None:
        return _handle_not_found("Configuração")
    return _success(setting, "Configuração carregada com sucesso.")


@api_bp.post("/api/settings")
def create_setting_route():
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        setting = create_setting(request.get_json(silent=True) or {})
        return _success(setting, "Configuração criada com sucesso.", 201)
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível salvar a configuração.", 500)


@api_bp.put("/api/settings/<int:setting_id>")
def update_setting_route(setting_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        setting = update_setting(setting_id, request.get_json(silent=True) or {})
        if setting is None:
            return _handle_not_found("Configuração")
        return _success(setting, "Configuração atualizada com sucesso.")
    except ValidationError as exc:
        return _error(str(exc), 400)
    except Exception:
        return _error("Não foi possível atualizar a configuração.", 500)


@api_bp.delete("/api/settings/<int:setting_id>")
def delete_setting_route(setting_id):
    admin_error = require_admin_access()
    if admin_error is not None:
        return admin_error

    try:
        deleted = delete_setting(setting_id)
        if not deleted:
            return _handle_not_found("Configuração")
        return "", 204
    except Exception:
        return _error("Não foi possível remover a configuração.", 500)


# ---------------------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------------------


@api_bp.get("/api/dashboard/summary")
def get_dashboard_summary_route():
    try:
        return _success(get_dashboard_summary(), "Resumo do dashboard carregado com sucesso.")
    except Exception:
        return _error("Não foi possível carregar o resumo do dashboard.", 500)


@api_bp.get("/api/dashboard")
def get_dashboard_route_alias():
    return get_dashboard_summary_route()

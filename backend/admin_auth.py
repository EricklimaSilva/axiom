from flask import current_app, jsonify, request


def require_admin_access():
    configured_admin_key = current_app.config.get("ADMIN_API_KEY")

    if not configured_admin_key:
        return jsonify({"success": False, "error": "Chave administrativa não configurada no servidor."}), 503

    provided_token = request.headers.get("X-ErickOS-Admin-Key", "")
    if provided_token != configured_admin_key:
        return jsonify({"success": False, "error": "Acesso administrativo obrigatório para esta ação."}), 403

    return None

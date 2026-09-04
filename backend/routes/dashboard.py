from flask import Blueprint, jsonify

from services.dashboard_service import get_dashboard_data

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/api/dashboard")
def get_dashboard_route():
    try:
        data = get_dashboard_data()

        return jsonify({
            "success": True,
            "data": data,
            "message": "Dados do dashboard carregados com sucesso.",
        })

    except Exception:
        return jsonify({
            "success": False,
            "error": "Não foi possível carregar os dados do dashboard.",
        }), 500

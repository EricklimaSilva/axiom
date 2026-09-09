#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-5001}"

if [ ! -x ./.venv/bin/python ]; then
	echo "Erro: ambiente virtual não encontrado em ./.venv/bin/python"
	exit 1
fi

./.venv/bin/python backend/bootstrap_postgres.py
echo "Iniciando Axiom em http://${APP_HOST}:${APP_PORT}"
./.venv/bin/python -m flask --app backend.app run --host "$APP_HOST" --port "$APP_PORT" --no-debugger --no-reload

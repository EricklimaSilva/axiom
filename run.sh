#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x ./.venv/bin/python ]; then
	echo "Erro: ambiente virtual não encontrado em ./.venv/bin/python"
	exit 1
fi

./.venv/bin/python backend/bootstrap_postgres.py
./.venv/bin/python -m flask --app backend.app run --host 127.0.0.1 --port 5000 --no-debugger --no-reload

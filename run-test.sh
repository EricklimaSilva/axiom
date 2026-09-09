#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x ./.venv/bin/python ]; then
    echo "Erro: ambiente virtual não encontrado em ./.venv/bin/python"
    exit 1
fi

TEST_DB_NAME="${TEST_DB_NAME:-axiom_tabs_test}"
APP_HOST="${APP_HOST:-127.0.0.1}"
APP_PORT="${APP_PORT:-5001}"

if command -v lsof >/dev/null 2>&1; then
    original_port="$APP_PORT"
    while lsof -nP -iTCP:"$APP_PORT" -sTCP:LISTEN >/dev/null 2>&1; do
        APP_PORT="$((APP_PORT + 1))"
    done
    if [ "$APP_PORT" != "$original_port" ]; then
        echo "Porta ${original_port} ocupada; usando ${APP_PORT}."
    fi
fi

BASE_DATABASE_URL="$(./.venv/bin/python - <<'PY'
from dotenv import dotenv_values

cfg = dotenv_values('.env')
url = cfg.get('DATABASE_URL', '').strip()
print(url)
PY
)"

if [ -z "$BASE_DATABASE_URL" ]; then
    echo "Erro: DATABASE_URL não encontrada no arquivo .env"
    exit 1
fi

export BASE_DATABASE_URL TEST_DB_NAME
export DATABASE_URL="$(./.venv/bin/python - <<'PY'
from urllib.parse import urlparse, urlunparse
import os

base_url = os.environ['BASE_DATABASE_URL']
test_db_name = os.environ['TEST_DB_NAME']
parsed = urlparse(base_url)

if parsed.scheme not in {'postgresql', 'postgres'}:
    raise SystemExit('Erro: DATABASE_URL precisa usar PostgreSQL (postgresql://...)')

new_path = '/' + test_db_name.lstrip('/')
print(urlunparse((parsed.scheme, parsed.netloc, new_path, parsed.params, parsed.query, parsed.fragment)))
PY
)"

echo "Usando banco de teste: ${TEST_DB_NAME}"
echo "Subindo aplicação em: http://${APP_HOST}:${APP_PORT}"

APP_HOST="$APP_HOST" APP_PORT="$APP_PORT" ./run.sh

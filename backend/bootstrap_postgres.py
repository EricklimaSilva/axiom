from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse, urlunparse

import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class BootstrapError(RuntimeError):
    pass


def _get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise BootstrapError("DATABASE_URL não foi definida no ambiente.")
    return database_url


def _normalize_database_url(database_url: str) -> tuple[str, str, str, int | None, str | None, str | None, str]:
    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgresql", "postgres"}:
        raise BootstrapError("O bootstrap automático só funciona com PostgreSQL.")

    if not parsed.path or parsed.path == "/":
        raise BootstrapError("DATABASE_URL precisa apontar para um banco, por exemplo /axiom.")

    database_name = parsed.path.lstrip("/")
    maintenance_path = "/postgres"
    maintenance_url = urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            maintenance_path,
            parsed.params,
            parsed.query,
            parsed.fragment,
        )
    )

    return maintenance_url, database_name, parsed.hostname or "localhost", parsed.port, parsed.username, parsed.password, parsed.path


def ensure_database_exists() -> str:
    database_url = _get_database_url()
    maintenance_url, database_name, host, port, username, password, _ = _normalize_database_url(database_url)

    connect_kwargs = {
        "dbname": "postgres",
        "host": host,
        "user": username,
    }
    if port:
        connect_kwargs["port"] = port
    if password:
        connect_kwargs["password"] = password

    with psycopg2.connect(**connect_kwargs) as connection:
        connection.autocommit = True
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database_name,))
            exists = cursor.fetchone() is not None
            if not exists:
                cursor.execute(sql.SQL("CREATE DATABASE {} ENCODING 'UTF8'").format(sql.Identifier(database_name)))

    return maintenance_url


def _table_exists() -> bool:
    database_url = _get_database_url()
    parsed = urlparse(database_url)

    connect_kwargs = {
        "dbname": parsed.path.lstrip("/"),
        "host": parsed.hostname or "localhost",
        "user": parsed.username,
    }
    if parsed.port:
        connect_kwargs["port"] = parsed.port
    if parsed.password:
        connect_kwargs["password"] = parsed.password

    with psycopg2.connect(**connect_kwargs) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = %s)",
                ("study_sessions",),
            )
            return bool(cursor.fetchone()[0])


def _alembic_version_table_exists() -> bool:
    database_url = _get_database_url()
    parsed = urlparse(database_url)

    connect_kwargs = {
        "dbname": parsed.path.lstrip("/"),
        "host": parsed.hostname or "localhost",
        "user": parsed.username,
    }
    if parsed.port:
        connect_kwargs["port"] = parsed.port
    if parsed.password:
        connect_kwargs["password"] = parsed.password

    with psycopg2.connect(**connect_kwargs) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alembic_version')"
            )
            return bool(cursor.fetchone()[0])


def stamp_migrations_if_needed() -> None:
    if _table_exists() and not _alembic_version_table_exists():
        subprocess.run(
            [sys.executable, "-m", "flask", "--app", "backend.app", "db", "stamp", "head"],
            check=True,
        )


def run_migrations() -> None:
    subprocess.run(
        [sys.executable, "-m", "flask", "--app", "backend.app", "db", "upgrade"],
        check=True,
    )


def main() -> None:
    ensure_database_exists()
    stamp_migrations_if_needed()
    run_migrations()
    print("PostgreSQL pronto e migrations aplicadas com sucesso.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        raise SystemExit(str(exc)) from exc

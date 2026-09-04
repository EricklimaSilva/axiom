from backend.app import create_app
from backend.services.database_service import (
    DatabaseConnectionError,
    check_postgres_connection,
)


def main():
    app = create_app()

    with app.app_context():
        try:
            status = check_postgres_connection()
        except DatabaseConnectionError as exc:
            print(f"Falha na conexão com PostgreSQL: {exc}")
            raise SystemExit(1) from exc

    print("Conexão com PostgreSQL realizada com sucesso.")
    print(f"Banco: {status['database_name']}")
    print(f"Usuário: {status['database_user']}")
    print(f"Versão: {status['database_version'].splitlines()[0]}")


if __name__ == "__main__":
    main()
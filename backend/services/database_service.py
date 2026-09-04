from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from extensions import db


class DatabaseConnectionError(RuntimeError):
    pass


def check_postgres_connection():
    try:
        with db.engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "api": "online",
            "database": "online",
            "database_engine": db.engine.dialect.name,
            "database_name": getattr(db.engine.url, "database", None),
            "database_user": getattr(db.engine.url, "username", None),
            "database_version": None,
        }
    except SQLAlchemyError as exc:
        raise DatabaseConnectionError("Não foi possível conectar ao PostgreSQL.") from exc
import os
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _get_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError(
            "DATABASE_URL não foi definida. Configure o PostgreSQL no arquivo .env antes de iniciar o backend."
        )

    return database_url


class BaseConfig:
    """Configuração base compartilhada entre ambientes."""

    SECRET_KEY = os.getenv("SECRET_KEY", "axiom-dev-secret-key")
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = _get_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
    }
    ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
    UPLOAD_FOLDER = str(BASE_DIR / "backend" / "uploads")
    MAX_CONTENT_LENGTH = 64 * 1024 * 1024


class DevelopmentConfig(BaseConfig):
    """Configuração para desenvolvimento local."""

    DEBUG = True


class TestingConfig(BaseConfig):
    """Configuração para testes automatizados."""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{(BASE_DIR / 'database' / 'axiom-test.db').resolve()}"


class ProductionConfig(BaseConfig):
    """Configuração para produção."""

    DEBUG = False
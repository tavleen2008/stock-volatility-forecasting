"""Database engine, sessions, and connection helpers."""

from collections.abc import Iterator
from contextlib import contextmanager
import logging

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from ml.data.data_config import DataConfig

Base = declarative_base()
logger = logging.getLogger(__name__)
ENGINE: Engine | None = None
SessionFactory = None


def _normalize_database_url(database_url: str) -> str:
    """Ensure SQLAlchemy uses the psycopg driver when the URL omits it."""

    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    return database_url


def build_engine(config: DataConfig | None = None) -> Engine:
    """Build SQLAlchemy engine.

    Args:
        config: Optional injected config.

    Returns:
        Engine: SQLAlchemy engine.
    """

    cfg = config or DataConfig()
    try:
        database_url = _normalize_database_url(cfg.database_url)
        engine = create_engine(database_url, future=True, pool_pre_ping=True, pool_recycle=3600)
        logger.info("Database engine initialized")
        return engine
    except Exception as exc:
        logger.exception("Failed to initialize database engine")
        raise RuntimeError("Database engine initialization failed") from exc


def get_engine() -> Engine:
    """Return a lazily-initialized shared engine."""

    global ENGINE

    if ENGINE is None:
        ENGINE = build_engine()
    return ENGINE


def get_session_factory():
    """Return the shared SQLAlchemy session factory."""

    global SessionFactory

    if SessionFactory is None:
        SessionFactory = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, class_=Session)
    return SessionFactory


@contextmanager
def session_scope() -> Iterator[Session]:
    """Provide transactional session scope.

    Yields:
        Session: Open SQLAlchemy session.
    """

    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Session transaction failed and was rolled back")
        raise
    finally:
        session.close()


def test_connection(engine: Engine | None = None) -> bool:
    """Test connectivity to PostgreSQL.

    Args:
        engine: Optional engine override.

    Returns:
        bool: True when connection query succeeds.
    """

    eng = engine or get_engine()
    try:
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection test successful")
        return True
    except Exception as exc:
        logger.exception("Database connection test failed")
        raise RuntimeError("Database connection test failed") from exc


def init_db(engine: Engine | None = None) -> None:
    """Create all ORM tables."""

    try:
        Base.metadata.create_all(bind=engine or get_engine())
        logger.info("Database schema initialized")
    except Exception as exc:
        logger.exception("Database schema initialization failed")
        raise RuntimeError("Database schema initialization failed") from exc


if __name__ == "__main__":
    test_connection()
    init_db()
    logger.info("Database setup completed")

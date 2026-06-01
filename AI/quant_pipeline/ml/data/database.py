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


def build_engine(config: DataConfig | None = None) -> Engine:
    """Build SQLAlchemy engine.

    Args:
        config: Optional injected config.

    Returns:
        Engine: SQLAlchemy engine.
    """

    cfg = config or DataConfig()
    try:
        engine = create_engine(cfg.database_url, future=True, pool_pre_ping=True, pool_recycle=3600)
        logger.info("Database engine initialized")
        return engine
    except Exception as exc:
        logger.exception("Failed to initialize database engine")
        raise RuntimeError("Database engine initialization failed") from exc


ENGINE = build_engine()
SessionFactory = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False, class_=Session)


@contextmanager
def session_scope() -> Iterator[Session]:
    """Provide transactional session scope.

    Yields:
        Session: Open SQLAlchemy session.
    """

    session = SessionFactory()
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

    eng = engine or ENGINE
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
        Base.metadata.create_all(bind=engine or ENGINE)
        logger.info("Database schema initialized")
    except Exception as exc:
        logger.exception("Database schema initialization failed")
        raise RuntimeError("Database schema initialization failed") from exc


if __name__ == "__main__":
    test_connection()
    init_db()
    logger.info("Database setup completed")

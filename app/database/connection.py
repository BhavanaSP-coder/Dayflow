"""Synchronous database access for the leave/payroll/notifications/reports modules.

These modules are written against a sync SQLAlchemy `Session`, while the
auth/employee/attendance half of the app is async. Both now talk to the SAME
PostgreSQL database, and -- importantly -- share the SAME declarative Base, so
one MetaData holds every table and ForeignKey("employees.id") can resolve.

    async half : app/db/database.py   -> create_async_engine, asyncpg
    sync half  : this file            -> create_engine, psycopg2
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# One Base for the whole app. Re-exported here so the existing
# `from app.database.connection import Base` imports keep working unchanged.
from app.db.database import Base  # noqa: F401


def _sync_database_url() -> str:
    """Same database as the async half, via the sync psycopg2 driver.

    settings.DATABASE_URL is written for asyncpg
    (postgresql+asyncpg://...); a sync Engine cannot use that driver.
    """
    url = settings.DATABASE_URL
    if "+asyncpg" in url:
        return url.replace("+asyncpg", "+psycopg2")
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


DATABASE_URL = _sync_database_url()

engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """FastAPI dependency: hands a sync Session to an endpoint."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Kept for compatibility. Table creation now happens once, in the app
    lifespan in app/main.py, against the shared Base."""
    Base.metadata.create_all(bind=engine)

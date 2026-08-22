"""
Shared database connection for the whole Dayflow backend.

Every module (leave, payroll, notifications, reports) imports from this file.
There is exactly ONE engine and ONE Base for the whole app.
"""

import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Reads backend/.env and puts the values into os.environ.
load_dotenv()


def _build_database_url() -> str:
    """Build the MySQL connection string from environment variables."""
    # Escape hatch for local testing before MySQL is set up (e.g. sqlite).
    override = os.getenv("DATABASE_URL")
    if override:
        return override

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    name = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD", "")

    missing = [k for k, v in {"DB_NAME": name, "DB_USER": user}.items() if not v]
    if missing:
        raise RuntimeError(
            f"Missing required environment variable(s): {', '.join(missing)}. "
            "Copy backend/.env.example to backend/.env and fill it in."
        )

    # quote_plus escapes characters like @ # / in the password,
    # which would otherwise break the URL.
    return (
        f"mysql+pymysql://{quote_plus(user)}:{quote_plus(password)}"
        f"@{host}:{port}/{name}?charset=utf8mb4"
    )


DATABASE_URL = _build_database_url()

# The engine is the connection pool. Created once, reused for every request.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # checks a connection is alive before using it
    echo=False,           # set True to see every SQL statement in the terminal
)

# A factory that produces Session objects. A Session is one "conversation"
# with the database: you add/query objects, then commit or roll back.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Parent class for every table in Dayflow.

    SQLAlchemy collects each subclass into Base.metadata, which is how
    create_all() knows what tables to create.
    """


def get_db():
    """FastAPI dependency: gives an endpoint a database session.

    `yield` hands the session to the endpoint, and the `finally` block runs
    after the response is sent, so the connection always goes back to the pool.
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create any tables that don't exist yet.

    Fine for a college project. Real products use migrations (Alembic),
    because create_all() will NOT alter a table that already exists.
    """
    Base.metadata.create_all(bind=engine)

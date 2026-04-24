"""
Alembic migration environment — async-aware configuration.

Supports two execution modes:

  Offline  — generates SQL migration scripts without a live DB connection.
             Used by: alembic upgrade --sql head

  Online   — applies migrations against a live database.
             Supports both sync (psycopg2) and async (asyncpg) engines.
             The DATABASE_URL is normalised at runtime so either scheme works.

Environment variables:
  DATABASE_URL  — PostgreSQL connection string (required).
                  May use any of these schemes:
                    postgresql://          (psycopg2, used by Alembic sync path)
                    postgresql+asyncpg://  (asyncpg, used by the FastAPI app)
                    postgres://            (Heroku/Railway shorthand)
"""

import asyncio
import os
import sys
from logging.config import fileConfig
from urllib.parse import urlparse, urlunparse

from alembic import context
from sqlalchemy import engine_from_config, pool, text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

# ---------------------------------------------------------------------------
# Path setup — allow "from app.xxx import ..." to resolve
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.config import settings  # noqa: E402
from app.models import Base       # noqa: E402  (registers all ORM models)

# ---------------------------------------------------------------------------
# Alembic config object
# ---------------------------------------------------------------------------
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Expose the full SQLAlchemy metadata so Alembic can diff the schema
target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# URL helpers
# ---------------------------------------------------------------------------

def _raw_database_url() -> str:
    """Return the raw DATABASE_URL from the environment or settings."""
    return os.getenv("DATABASE_URL") or settings.DATABASE_URL or ""


def get_sync_url(raw: str = "") -> str:
    """
    Return a *synchronous* (psycopg2-compatible) PostgreSQL URL.

    Transformations applied:
      • postgres://        → postgresql://
      • postgresql+asyncpg:// → postgresql://
      • All query parameters are stripped (Alembic adds sslmode itself
        when needed via connect_args).
    """
    url = raw or _raw_database_url()
    parsed = urlparse(url)

    # Normalise scheme
    scheme = parsed.scheme
    if scheme in ("postgres", "postgresql+asyncpg"):
        scheme = "postgresql"
    parsed = parsed._replace(scheme=scheme, query="")

    return urlunparse(parsed)


def get_async_url(raw: str = "") -> str:
    """
    Return an *asynchronous* (asyncpg-compatible) PostgreSQL URL.

    Transformations applied:
      • postgres://   → postgresql+asyncpg://
      • postgresql:// → postgresql+asyncpg://
      • All query parameters are stripped (SSL is passed via connect_args).
    """
    url = raw or _raw_database_url()
    parsed = urlparse(url)

    scheme = parsed.scheme
    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"
    parsed = parsed._replace(scheme=scheme, query="")

    return urlunparse(parsed)


def _ssl_connect_args() -> dict:
    """
    Return SSL connect_args when the DATABASE_URL looks like a remote host.
    asyncpg requires ssl=True rather than a query-string sslmode parameter.
    """
    raw = _raw_database_url()
    # Use SSL for any non-localhost connection
    if "localhost" not in raw and "127.0.0.1" not in raw:
        return {"ssl": True}
    return {}


# ---------------------------------------------------------------------------
# Offline mode — emit SQL to stdout / file without a live connection
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    Alembic generates SQL statements and writes them to stdout (or a file
    when --output is specified).  No database connection is required.
    """
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        # Render ENUM types as native PostgreSQL enums
        include_schemas=False,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode — synchronous path (psycopg2)
# ---------------------------------------------------------------------------

def run_migrations_online_sync() -> None:
    """
    Apply migrations using a synchronous psycopg2 engine.

    This is the default online path.  It is simpler and more reliable than
    the async path for migration workloads (no event-loop management needed).
    """
    sync_url = get_sync_url()

    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = sync_url

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )
        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------------------------
# Online mode — asynchronous path (asyncpg)
# ---------------------------------------------------------------------------

def do_run_migrations(connection) -> None:
    """Inner function executed inside the async connection context."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online_async() -> None:
    """
    Apply migrations using an async asyncpg engine.

    Use this path when psycopg2 is not available (e.g. environments that
    only have asyncpg installed).  Set the environment variable
    ALEMBIC_USE_ASYNC=1 to activate this path.
    """
    async_url = get_async_url()
    connect_args = _ssl_connect_args()

    connectable = create_async_engine(
        async_url,
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if context.is_offline_mode():
    run_migrations_offline()
else:
    use_async = os.getenv("ALEMBIC_USE_ASYNC", "").lower() in ("1", "true", "yes")
    if use_async:
        asyncio.run(run_migrations_online_async())
    else:
        run_migrations_online_sync()

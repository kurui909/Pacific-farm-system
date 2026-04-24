import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# ------------------------------------------------------------------
# Database URL Configuration
# ------------------------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")

# Fallback for local development
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:FHQrVwNpuBlLawhyCMFHUeaVURFyHYXQ@postgres.railway.internal:5432/railway"

# ------------------------------------------------------------------
# FIX: Strip SSL query parameters (asyncpg compatibility)
# ------------------------------------------------------------------
# asyncpg does not accept SSL options as URL query parameters (e.g.
# sslmode, ssl, sslcert).  The correct approach is to remove them from
# the URL entirely and pass ssl=True via connect_args instead.

SSL_QUERY_PARAMS = {"sslmode", "ssl", "sslcert", "sslkey", "sslrootcert", "sslcrl"}

def fix_postgres_url(url: str) -> tuple[str, bool]:
    """Strip SSL query parameters and ensure the asyncpg driver is used.

    Returns:
        (clean_url, ssl_required) where ssl_required is True when any
        SSL-related query parameter was present in the original URL.
    """
    parsed = urlparse(url)

    # 1. Remove all SSL-related query parameters and track whether any existed
    ssl_required = False
    if parsed.query:
        query_params = parse_qs(parsed.query, keep_blank_values=True)
        found_ssl_params = SSL_QUERY_PARAMS & query_params.keys()
        if found_ssl_params:
            ssl_required = True
            for key in found_ssl_params:
                del query_params[key]
        new_query = urlencode({k: v[0] for k, v in query_params.items()})
        parsed = parsed._replace(query=new_query)

    # 2. Ensure asyncpg driver is used
    if parsed.scheme.startswith("postgresql") and "+asyncpg" not in parsed.scheme:
        parsed = parsed._replace(scheme="postgresql+asyncpg")

    return urlunparse(parsed), ssl_required

DATABASE_URL, _ssl_required = fix_postgres_url(DATABASE_URL)

print(f"Final DATABASE_URL: {DATABASE_URL} (ssl={_ssl_required})")

# ------------------------------------------------------------------
# SQLAlchemy Engine Configuration
# ------------------------------------------------------------------
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"ssl": True} if _ssl_required else {},
)

# ------------------------------------------------------------------
# Session Factory
# ------------------------------------------------------------------
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ------------------------------------------------------------------
# Base Class for ORM Models
# ------------------------------------------------------------------
Base = declarative_base()

# ------------------------------------------------------------------
# Dependency Function for Database Sessions
# ------------------------------------------------------------------
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
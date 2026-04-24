import os
from urllib.parse import urlparse, urlunparse
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
# FIX: Strip ALL query parameters and pass ssl=True to engine
# ------------------------------------------------------------------
def fix_postgres_url(url: str) -> str:
    """Remove ALL query parameters and ensure asyncpg driver."""
    parsed = urlparse(url)
    
    # Strip ALL query parameters
    parsed = parsed._replace(query="")
    
    # Ensure asyncpg driver is used
    if parsed.scheme.startswith("postgresql") and "+asyncpg" not in parsed.scheme:
        parsed = parsed._replace(scheme="postgresql+asyncpg")
    
    return urlunparse(parsed)

DATABASE_URL = fix_postgres_url(DATABASE_URL)

# Debug: remove after confirming fix
print(f"Final DATABASE_URL: {DATABASE_URL}")

# ------------------------------------------------------------------
# SQLAlchemy Engine Configuration
# ------------------------------------------------------------------
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={"ssl": True},
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
import os
from urllib.parse import urlparse, parse_qs, urlunparse, quote
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
# FIX: Convert sslmode → ssl for asyncpg compatibility
# ------------------------------------------------------------------
def fix_postgres_ssl(url: str) -> str:
    """Convert sslmode query parameter to ssl for asyncpg."""
    parsed = urlparse(url)
    if parsed.query:
        query_params = parse_qs(parsed.query)
        # Check if sslmode is present
        if "sslmode" in query_params:
            ssl_mode = query_params["sslmode"][0]
            # Remove sslmode and add ssl with the same value
            del query_params["sslmode"]
            query_params["ssl"] = [ssl_mode]
            # Rebuild query string
            new_query = "&".join(f"{k}={quote(v[0])}" for k, v in query_params.items())
            parsed = parsed._replace(query=new_query)
    # Ensure asyncpg driver is used
    if parsed.scheme.startswith("postgresql") and "+asyncpg" not in parsed.scheme:
        parsed = parsed._replace(scheme="postgresql+asyncpg")
    return urlunparse(parsed)

DATABASE_URL = fix_postgres_ssl(DATABASE_URL)

# Debug print (remove in production)
print(f"Connecting to: {DATABASE_URL}")

# ------------------------------------------------------------------
# SQLAlchemy Engine Configuration
# ------------------------------------------------------------------
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
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
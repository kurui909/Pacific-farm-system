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
# FIX: Convert sslmode → ssl (asyncpg compatibility)
# ------------------------------------------------------------------
def fix_postgres_url(url: str) -> str:
    """Replace sslmode query parameter with ssl, and ensure asyncpg driver."""
    parsed = urlparse(url)
    
    # 1. Convert sslmode → ssl in query string
    if parsed.query:
        query_params = parse_qs(parsed.query, keep_blank_values=True)
        if "sslmode" in query_params:
            ssl_value = query_params["sslmode"][0]
            # Remove sslmode and add ssl
            del query_params["sslmode"]
            # Only add ssl if value is truthy (e.g., 'require', 'prefer')
            if ssl_value:
                query_params["ssl"] = [ssl_value]
            # Rebuild query string (URL-encode values)
            new_query = "&".join(f"{k}={quote(v[0])}" for k, v in query_params.items())
            parsed = parsed._replace(query=new_query)
    
    # 2. Ensure asyncpg driver is used
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
)

# ...
# (rest of your code unchanged: AsyncSessionLocal, Base, get_db)

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
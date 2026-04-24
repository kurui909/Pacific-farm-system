import os
from urllib.parse import urlparse, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/smartpoultry"

def fix_postgres_url(url: str) -> str:
    """Remove ALL query parameters to prevent sslmode being passed to asyncpg."""
    parsed = urlparse(url)
    parsed = parsed._replace(query="")
    if parsed.scheme.startswith("postgresql") and "+asyncpg" not in parsed.scheme:
        parsed = parsed._replace(scheme="postgresql+asyncpg")
    return urlunparse(parsed)

DATABASE_URL = fix_postgres_url(DATABASE_URL)

# Engine with SSL enabled but certificate verification disabled
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args={
        "ssl": True,
        "ssl_verify_cert": False,      # ← disables certificate verification
        "ssl_verify_identity": False,  # ← also disables hostname check
    },
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
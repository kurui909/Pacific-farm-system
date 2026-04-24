from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from urllib.parse import urlparse, urlunparse
import os

# ------------------------------------------------------------------
# Database URL Configuration
# ------------------------------------------------------------------
# Get DATABASE_URL from environment (Railway auto-injects)
DATABASE_URL = os.environ.get("DATABASE_URL")

# Fallback for local development
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:FHQrVwNpuBlLawhyCMFHUeaVURFyHYXQ@postgres.railway.internal:5432/railway"

# ------------------------------------------------------------------
# Strip ALL query parameters (sslmode, etc.)
# ------------------------------------------------------------------
parsed = urlparse(DATABASE_URL)
DATABASE_URL = urlunparse((parsed.scheme, parsed.netloc, parsed.path, '', '', ''))

# Convert postgresql:// to postgresql+asyncpg:// for async support
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

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
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    # For Supabase pooler, remove pool_size / max_overflow
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    expire_on_commit=False,
)

Base = declarative_base()

# ✅ Add this dependency – used by auth.py and other routers
async def get_db() -> AsyncSession:
    """
    FastAPI dependency that provides an async database session.
    The session is automatically closed after the request finishes.
    """
    async with AsyncSessionLocal() as session:
        yield session
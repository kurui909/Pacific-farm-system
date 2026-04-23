from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Use asyncpg for PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,          # Set to True for SQL logging (development only)
    future=True,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    """Dependency to get a database session."""
    async with AsyncSessionLocal() as session:
        yield session
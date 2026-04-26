from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.config import settings
from urllib.parse import quote_plus
from uuid import uuid4

# Build asyncpg URL WITHOUT sslmode in URL
# ssl will be handled via connect_args
ASYNC_DATABASE_URL = (
    f"postgresql+asyncpg://{settings.DB_USER}:{quote_plus(settings.DB_PASSWORD)}"
    f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
)

# Create async engine with proper SSL configuration
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,
    future=True,
    poolclass=NullPool,
    connect_args={
        "ssl": "require",  # Use 'ssl' instead of 'sslmode' for asyncpg
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
        "server_settings": {
            "jit": "off",
        },
    },
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for SQLAlchemy models
Base = declarative_base()

# Dependency to get DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
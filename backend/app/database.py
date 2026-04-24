from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Railway injects a standard postgresql:// URL, but SQLAlchemy's async engine
# requires the asyncpg driver prefix. Convert it if necessary.
_db_url = settings.DATABASE_URL
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# asyncpg does not accept sslmode as a query parameter — it handles SSL
# internally. Strip it (and the leading '?' if it's the only parameter) to
# prevent a TypeError on connect.
if "?sslmode=" in _db_url:
    _db_url = _db_url[:_db_url.index("?sslmode=")]
elif "&sslmode=" in _db_url:
    _db_url = _db_url[:_db_url.index("&sslmode=")]

engine = create_async_engine(
    _db_url,
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
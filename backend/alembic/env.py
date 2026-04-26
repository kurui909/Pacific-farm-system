import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add your project's root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import your settings (which provides SYNC_DATABASE_URL)
from app.config import settings

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# Override the sqlalchemy.url from alembic.ini with the correct one
config.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL)

# Set target metadata (if you have Base metadata, import it)
try:
    from app.database import Base
    target_metadata = Base.metadata
except ImportError:
    target_metadata = None
    print("Warning: Could not import Base metadata. Run autogenerate without metadata.")

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
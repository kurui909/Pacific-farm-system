

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    # Project metadata
    PROJECT_NAME: str = "SmartPoultry API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database – must be set via environment variable on Render/Supabase
    # No default value! This forces configuration via DATABASE_URL env var.
    DATABASE_URL: str = "postgresql+asyncpg://postgres.rrspyevxqbjkvxpmtaju:Kipkurui156821BB@aws-1-eu-west-3.pooler.supabase.com:6543/postgres"

    
    # Connection pooling
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # JWT security
    SECRET_KEY: str = ""  # No default – must be set in environment
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Google OAuth (optional)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # File uploads directory
    UPLOAD_DIR: str = "uploads"
    
    # Configure Pydantic to read from .env file (for local dev) and environment variables
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

# Create singleton instance
settings = Settings()

# Optional: print a masked version of DATABASE_URL only in development
if os.getenv("ENVIRONMENT") != "production":
    # Mask password for logging safety
    db_url = settings.DATABASE_URL
    if "@" in db_url:
        parts = db_url.split("@")
        user_pass = parts[0].split("://")[-1]
        masked = "***"
        masked_url = db_url.replace(user_pass, masked)
        print(f"✓ Loaded DATABASE_URL: {masked_url}")
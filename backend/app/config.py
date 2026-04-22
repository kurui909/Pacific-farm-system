from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "SmartPoultry API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database (must be set in environment)
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Google OAuth (optional)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # File uploads
    UPLOAD_DIR: str = "uploads"

    # Email (optional – app will still work if not set)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

settings = Settings()

# Optional: masked logging for DATABASE_URL (only in development)
if os.getenv("ENVIRONMENT") != "production":
    db_url = settings.DATABASE_URL
    if "@" in db_url:
        parts = db_url.split("@")
        user_pass = parts[0].split("://")[-1]
        masked = "***"
        masked_url = db_url.replace(user_pass, masked)
        print(f"✓ Loaded DATABASE_URL: {masked_url}")
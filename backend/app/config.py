from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartPoultry"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./poultry.db"
    
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PRICE_ID: Optional[str] = None
    
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
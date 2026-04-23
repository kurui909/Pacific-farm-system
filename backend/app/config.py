import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartPoultry API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database - Railway provides DATABASE_URL automatically
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost/db")

    # Upload directory - use /tmp on Railway (ephemeral)
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/tmp/uploads")

    # CORS - read comma-separated origins from env, plus localhost defaults
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")
    
    @property
    def cors_origins(self) -> List[str]:
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://192.168.1.133:3000",
            "http://192.168.1.133",
            "http://192.168.1.133:8000",
        ]
        # Add origins from environment variable (e.g., your Railway frontend URL)
        if self.ALLOWED_ORIGINS:
            origins.extend([origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")])
        return origins

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # ------------------------------------------------------------------
    # App Info
    # ------------------------------------------------------------------
    PROJECT_NAME: str = "SmartPoultry API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # ------------------------------------------------------------------
    # Environment
    # ------------------------------------------------------------------
    ENVIRONMENT: str = "development"  # change via Railway env

    # ------------------------------------------------------------------
    # Database (Railway auto-injects DATABASE_URL)
    # ------------------------------------------------------------------
    DATABASE_URL: str = ""

    # ------------------------------------------------------------------
    # File Uploads
    # ------------------------------------------------------------------
    UPLOAD_DIR: str = "/tmp/uploads"

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    ALLOWED_ORIGINS: str = ""

    @property
    def cors_origins(self) -> List[str]:
        default_origins = [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            "http://192.168.1.133:3000",
            "http://192.168.1.133:8000",
            "http://192.168.1.170:3000",
            "http://192.168.1.170:8000",
        ]

        env_origins = []
        if self.ALLOWED_ORIGINS:
            env_origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

        # Remove duplicates
        return list(set(default_origins + env_origins))

    # ------------------------------------------------------------------
    # Pydantic Config
    # ------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra environment variables
    )

# Singleton
settings = Settings()
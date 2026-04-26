from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from urllib.parse import quote_plus

class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartPoultry API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    DB_HOST: str = ""
    DB_PORT: str = "5432"
    DB_NAME: str = "postgres"
    DB_USER: str = ""
    DB_PASSWORD: str = ""

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""

    UPLOAD_DIR: str = "/tmp/uploads"
    ALLOWED_ORIGINS: str = ""

    SECRET_KEY: str = "xK9mP2qR5tU8wY1zC4bF7jL0nQ3sV6aD"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def cors_origins(self) -> List[str]:
        default_origins = [
            "http://localhost:3000", "http://localhost:3001",
            "http://127.0.0.1:3000", "http://127.0.0.1:3001",
            "http://localhost:8000", "http://127.0.0.1:8000",
        ]
        env_origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",")] if self.ALLOWED_ORIGINS else []
        return list(set(default_origins + env_origins))

    @property
    def DATABASE_URL(self) -> str:
        """Async database URL (without sslmode - handled in connect_args)."""
        encoded_password = quote_plus(self.DB_PASSWORD)
        return f"postgresql+asyncpg://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Sync database URL for psycopg2."""
        encoded_password = quote_plus(self.DB_PASSWORD)
        return f"postgresql://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?sslmode=require"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
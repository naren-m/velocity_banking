"""Application configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    # Database
    database_url: str = "sqlite+aiosqlite:////app/data/velocity_banking.db"

    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Server
    port: int = 3001
    host: str = "0.0.0.0"
    debug: bool = False

    # CORS
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()

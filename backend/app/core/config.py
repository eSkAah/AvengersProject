from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    app_name: str = "Star-Eyes"
    version: str = "1.0.0-dev"
    debug: bool = False

    # Database - stored in data/ folder
    database_url: str = "sqlite+aiosqlite:///./data/star_eyes.db"

    # CORS
    cors_origins: List[str] = ["http://localhost:4200"]


settings = Settings()

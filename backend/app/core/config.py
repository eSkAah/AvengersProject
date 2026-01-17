from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    app_name: str = "Avengers Project"
    version: str = "1.0.0-dev"
    debug: bool = False

    # Database - stored in data/ folder
    database_url: str = "sqlite+aiosqlite:///./data/avengers_project.db"

    # CORS
    cors_origins: List[str] = ["http://localhost:4200"]

    # File Upload Settings (Story 4-1)
    upload_dir: str = "./uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: List[str] = ["xlsx", "xls", "pdf", "csv"]


settings = Settings()

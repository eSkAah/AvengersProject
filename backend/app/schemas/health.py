from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    app_name: str
    version: str
    database_status: str = Field(description="Database connection status")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

from fastapi import APIRouter

from app.core.config import settings
from app.core.database import check_database_connection
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint to verify the API and database are running."""
    db_ok = await check_database_connection()

    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        app_name=settings.app_name,
        version=settings.version,
        database_status="connected" if db_ok else "disconnected",
    )

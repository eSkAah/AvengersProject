"""Engagements API router for Star-Eyes platform."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.engagement import EngagementResponse, EngagementListResponse
from app.services.engagement_service import get_all_engagements, get_engagement_by_id

router = APIRouter(tags=["Engagements"])


@router.get(
    "/",
    response_model=EngagementListResponse,
    summary="List all engagements",
    description="Retrieve a list of all engagements with their current status, risk level, and financial data.",
    responses={
        200: {
            "description": "List of engagements retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "total": 5,
                        "engagements": [
                            {
                                "id": "ENG-FR-001",
                                "entity_name": "France SPV",
                                "country_code": "FR",
                                "country_name": "France",
                                "service_type": "Corporate Tax",
                                "status": "waiting",
                                "risk_level": "high",
                                "completion_percent": 67,
                                "due_date": "2026-03-01",
                                "predicted_completion": "2026-02-25",
                                "documents_required": ["General Ledger", "Trial Balance"],
                                "financial_data": {
                                    "total_assets": 15400000,
                                    "total_liabilities": 8200000,
                                    "equity": 7200000,
                                    "revenue": 12500000,
                                },
                                "ai_insights": [],
                                "created_at": "2026-01-17T10:00:00",
                                "updated_at": "2026-01-17T10:00:00",
                            }
                        ],
                    }
                }
            },
        }
    },
)
async def list_engagements(
    db: AsyncSession = Depends(get_db),
) -> EngagementListResponse:
    """
    Retrieve all engagements from the database.

    Returns a list of engagements sorted by due date, including:
    - Basic engagement information (entity, country, service type)
    - Current status and calculated risk level
    - Progress tracking (completion percentage, predicted completion)
    - Financial data and AI insights
    """
    engagements = await get_all_engagements(db)
    return EngagementListResponse(
        total=len(engagements),
        engagements=[EngagementResponse.model_validate(e) for e in engagements],
    )


@router.get(
    "/{engagement_id}",
    response_model=EngagementResponse,
    summary="Get engagement by ID",
    description="Retrieve detailed information for a specific engagement by its unique identifier.",
    responses={
        200: {
            "description": "Engagement found and returned successfully",
        },
        404: {
            "description": "Engagement not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Engagement not found: ENG-XX-999"}
                }
            },
        },
    },
)
async def get_engagement(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> EngagementResponse:
    """
    Retrieve a single engagement by its ID.

    Args:
        engagement_id: Unique engagement identifier (e.g., ENG-FR-001)

    Returns:
        Complete engagement data including financial information

    Raises:
        HTTPException: 404 if engagement is not found
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )
    return EngagementResponse.model_validate(engagement)

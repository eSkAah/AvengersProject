"""Engagements API router for Avengers Project platform."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.engagement import (
    EngagementResponse,
    EngagementListResponse,
    RiskDetailsResponse,
    PredictionResponse,
)
from app.services.engagement_service import (
    get_all_engagements,
    get_engagement_by_id,
    get_engagement_risk_details,
    get_engagement_prediction,
)

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


@router.get(
    "/{engagement_id}/risk",
    response_model=RiskDetailsResponse,
    summary="Get risk details",
    description="""
    Get detailed risk information for an engagement including:
    - Current risk level with reasons
    - Suggested actions to mitigate risk
    - Days remaining until deadline
    - List of missing documents
    """,
    responses={
        200: {
            "description": "Risk details retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "engagement_id": "ENG-FR-001",
                        "level": "high",
                        "reasons": [
                            "Seulement 5j restants avec 67% de completion",
                            "2 document(s) manquant(s) à J-5",
                        ],
                        "suggested_actions": [
                            "Priorisez l'upload des documents manquants immédiatement",
                            "Uploadez en priorité: General Ledger",
                        ],
                        "days_remaining": 5,
                        "completion_percent": 67,
                        "missing_documents": ["General Ledger", "Bank Statements"],
                    }
                }
            },
        },
        404: {"description": "Engagement not found"},
    },
)
async def get_risk_details(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> RiskDetailsResponse:
    """
    Get detailed risk information for an engagement.

    This endpoint provides actionable insights about the engagement's risk status,
    including specific reasons and recommended actions.
    """
    risk_details = await get_engagement_risk_details(db, engagement_id)
    if risk_details is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )

    return RiskDetailsResponse(
        engagement_id=engagement_id,
        level=risk_details.level,
        reasons=risk_details.reasons,
        suggested_actions=risk_details.suggested_actions,
        days_remaining=risk_details.days_remaining,
        completion_percent=risk_details.completion_percent,
        missing_documents=risk_details.missing_documents,
    )


@router.get(
    "/{engagement_id}/prediction",
    response_model=PredictionResponse,
    summary="Get completion prediction",
    description="""
    Get AI-powered completion prediction for an engagement based on current velocity.

    The prediction includes:
    - Estimated completion date
    - Comparison with deadline (early/late)
    - Current velocity (% per day)
    - Confidence level
    """,
    responses={
        200: {
            "description": "Prediction retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "engagement_id": "ENG-FR-001",
                        "predicted_date": "2026-03-05",
                        "days_difference": 4,
                        "velocity": 8.5,
                        "is_on_track": False,
                        "confidence": "medium",
                        "due_date": "2026-03-01",
                        "formatted_prediction": "Prévu le 5 mars (+4j)",
                    }
                }
            },
        },
        404: {"description": "Engagement not found"},
    },
)
async def get_prediction(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> PredictionResponse:
    """
    Get completion prediction for an engagement.

    The prediction is calculated based on:
    - Historical velocity (completion % / days elapsed)
    - Remaining work (100% - current completion)
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )

    prediction = await get_engagement_prediction(db, engagement_id)
    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )

    # Format the prediction for display
    if prediction.predicted_date:
        formatted_date = prediction.predicted_date.strftime("%d %B").lstrip("0")
        if prediction.days_difference > 0:
            formatted = f"Prévu le {formatted_date} (+{prediction.days_difference}j)"
        elif prediction.days_difference < 0:
            formatted = f"Prévu le {formatted_date} ({prediction.days_difference}j)"
        else:
            formatted = f"Prévu le {formatted_date} (dans les temps)"
    else:
        formatted = "Prédiction non disponible"

    return PredictionResponse(
        engagement_id=engagement_id,
        predicted_date=prediction.predicted_date,
        days_difference=prediction.days_difference,
        velocity=prediction.velocity,
        is_on_track=prediction.is_on_track,
        confidence=prediction.confidence,
        due_date=engagement.due_date,
        formatted_prediction=formatted,
    )

"""Engagements API router for Avengers Project platform."""

from datetime import date
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.engagement import (
    EngagementResponse,
    EngagementListResponse,
    RiskDetailsResponse,
    PredictionResponse,
    VarianceAlert as VarianceAlertSchema,
)
from app.services.engagement_service import (
    get_all_engagements,
    get_engagement_by_id,
    get_engagement_risk_details,
    get_engagement_prediction,
)
from app.services.variance_service import check_engagement_variances

router = APIRouter(tags=["Engagements"])


def enrich_with_variance(engagement) -> Dict[str, Any]:
    """
    Enrich engagement data with variance alerts.

    Args:
        engagement: Engagement model object

    Returns:
        Dictionary with engagement data and variance_alerts
    """
    data = {
        "id": engagement.id,
        "entity_name": engagement.entity_name,
        "country_code": engagement.country_code,
        "country_name": engagement.country_name,
        "service_type": engagement.service_type,
        "status": engagement.status,
        "risk_level": engagement.risk_level,
        "due_date": engagement.due_date,
        "predicted_completion": engagement.predicted_completion,
        "completion_percent": engagement.completion_percent,
        "documents_required": engagement.documents_required or [],
        "financial_data": engagement.financial_data or {},
        "ai_insights": engagement.ai_insights or [],
        "created_at": engagement.created_at,
        "updated_at": engagement.updated_at,
    }

    # Detect variances and add to response
    variances = check_engagement_variances(engagement.financial_data)
    data["variance_alerts"] = [
        VarianceAlertSchema(
            metric=v.metric,
            metric_label=v.metric_label,
            current_value=v.current_value,
            previous_value=v.previous_value,
            variance_percent=v.variance_percent,
            variance_type=v.variance_type.value,
            insight_message=v.insight_message,
        )
        for v in variances
    ]

    # Add variance insights to ai_insights if not already present
    for v in variances:
        if v.insight_message not in data["ai_insights"]:
            data["ai_insights"].append(v.insight_message)

    return data


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
    - Variance alerts for significant N vs N-1 changes (>15%)
    """
    engagements = await get_all_engagements(db)
    enriched = [enrich_with_variance(e) for e in engagements]
    return EngagementListResponse(
        total=len(engagements),
        engagements=[EngagementResponse.model_validate(e) for e in enriched],
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
        Complete engagement data including financial information and variance alerts

    Raises:
        HTTPException: 404 if engagement is not found
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )
    enriched = enrich_with_variance(engagement)
    return EngagementResponse.model_validate(enriched)


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
                            "Only 5 day(s) remaining with 67% completion",
                            "2 missing document(s) at D-5",
                        ],
                        "suggested_actions": [
                            "Prioritize uploading missing documents immediately",
                            "Upload as priority: General Ledger",
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
                        "formatted_prediction": "Predicted on March 5 (+4d)",
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
        formatted_date = prediction.predicted_date.strftime("%B %d").lstrip("0")
        if prediction.days_difference > 0:
            formatted = f"Predicted on {formatted_date} (+{prediction.days_difference}d)"
        elif prediction.days_difference < 0:
            formatted = f"Predicted on {formatted_date} ({prediction.days_difference}d)"
        else:
            formatted = f"Predicted on {formatted_date} (on track)"
    else:
        formatted = "Prediction not available"

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

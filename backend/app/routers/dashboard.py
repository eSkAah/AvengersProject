"""Dashboard API router for engagement statistics and KPIs."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import (
    AssetsChartResponse,
    BreakdownChartResponse,
    ComparisonChartResponse,
    EngagementStatsResponse,
    GanttChartResponse,
)
from app.services.dashboard_service import (
    get_assets_chart,
    get_breakdown_chart,
    get_comparison_chart,
    get_engagement_stats,
    get_gantt_data,
)

router = APIRouter(tags=["Dashboard"])


@router.get(
    "/{engagement_id}/stats",
    response_model=EngagementStatsResponse,
    summary="Get engagement statistics",
    description="Retrieve financial KPIs for a specific engagement with year-over-year comparison.",
    responses={
        200: {
            "description": "Statistics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "engagement_id": "ENG-FR-001",
                        "entity_name": "France SPV",
                        "current_year": {
                            "total_assets": 15400000,
                            "total_liabilities": 8200000,
                            "equity": 7200000,
                            "revenue": 12500000,
                            "expenses": 9800000,
                        },
                        "previous_year": {
                            "total_assets": 14200000,
                            "total_liabilities": 7800000,
                            "equity": 6400000,
                            "revenue": 11200000,
                            "expenses": 8900000,
                        },
                        "variance_percent": {
                            "total_assets": 8.45,
                            "total_liabilities": 5.13,
                            "equity": 12.50,
                            "revenue": 11.61,
                            "expenses": 10.11,
                        },
                    }
                }
            },
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
async def get_stats(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> EngagementStatsResponse:
    """
    Retrieve financial statistics for a specific engagement.

    This endpoint provides:
    - Current year financial metrics (assets, liabilities, equity, revenue, expenses)
    - Previous year metrics for comparison (if available)
    - Year-over-year variance percentages for each metric

    Args:
        engagement_id: Unique engagement identifier (e.g., ENG-FR-001)

    Returns:
        EngagementStatsResponse with financial KPIs and YoY comparison

    Raises:
        HTTPException: 404 if engagement is not found
    """
    stats = await get_engagement_stats(db, engagement_id)
    if stats is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )
    return stats


# =============================================================================
# Chart Endpoints
# =============================================================================


@router.get(
    "/{engagement_id}/charts/assets",
    response_model=AssetsChartResponse,
    summary="Get assets chart data",
    description="Retrieve assets breakdown chart data for Chart.js visualization.",
    responses={
        200: {"description": "Assets chart data retrieved successfully"},
        404: {"description": "Engagement not found"},
    },
)
async def get_assets_chart_data(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> AssetsChartResponse:
    """
    Get assets breakdown chart data for an engagement.

    Returns Chart.js compatible data with categories:
    - Fixed assets
    - Current assets
    - Cash
    """
    chart = await get_assets_chart(db, engagement_id)
    if chart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )
    return chart


@router.get(
    "/{engagement_id}/charts/comparison",
    response_model=ComparisonChartResponse,
    summary="Get N vs N-1 comparison chart data",
    description="Retrieve year-over-year comparison chart data for grouped bar visualization.",
    responses={
        200: {"description": "Comparison chart data retrieved successfully"},
        404: {"description": "Engagement not found"},
    },
)
async def get_comparison_chart_data(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> ComparisonChartResponse:
    """
    Get N vs N-1 comparison chart data for an engagement.

    Returns grouped bar chart data comparing:
    - Total Assets
    - Liabilities
    - Revenue
    - Expenses

    Includes variance percentages for each metric.
    """
    chart = await get_comparison_chart(db, engagement_id)
    if chart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )
    return chart


@router.get(
    "/{engagement_id}/charts/breakdown",
    response_model=BreakdownChartResponse,
    summary="Get breakdown pie chart data",
    description="Retrieve detailed breakdown chart data for pie/doughnut visualization.",
    responses={
        200: {"description": "Breakdown chart data retrieved successfully"},
        404: {"description": "Engagement not found"},
    },
)
async def get_breakdown_chart_data(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> BreakdownChartResponse:
    """
    Get detailed breakdown chart data for an engagement.

    Returns pie chart data with:
    - Category labels
    - Values and percentages
    - EY-compliant colors
    - Source document reference
    """
    chart = await get_breakdown_chart(db, engagement_id)
    if chart is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )
    return chart


# =============================================================================
# Gantt Chart Endpoint
# =============================================================================


@router.get(
    "/gantt",
    response_model=GanttChartResponse,
    summary="Get Gantt chart data for all engagements",
    description="Retrieve timeline data for all engagements to display in a Gantt chart visualization.",
    responses={
        200: {
            "description": "Gantt chart data retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "items": [
                            {
                                "engagement_id": "ENG-FR-001",
                                "entity_name": "France SPV",
                                "start_date": "2026-01-15",
                                "due_date": "2026-02-29",
                                "completion_percent": 67,
                                "risk_level": "high",
                                "status": "processing",
                                "color": "#EF4444",
                            }
                        ],
                        "min_date": "2026-01-08",
                        "max_date": "2026-03-22",
                        "total_engagements": 5,
                    }
                }
            },
        }
    },
)
async def get_gantt_chart_data(
    db: AsyncSession = Depends(get_db),
) -> GanttChartResponse:
    """
    Get Gantt chart data for all engagements.

    Returns timeline data including:
    - All engagement timelines with start/end dates
    - Risk level coloring (red=high, orange=medium, green=low)
    - Completion percentages
    - Timeline bounds for chart scaling

    This endpoint is used by Eve to generate planning visualizations
    when users request "Generate the obligation schedule".
    """
    return await get_gantt_data(db)

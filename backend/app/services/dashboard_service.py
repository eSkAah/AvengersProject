"""Dashboard service for calculating engagement statistics and KPIs."""

from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import (
    AssetsChartResponse,
    BreakdownChartResponse,
    BreakdownItem,
    ChartData,
    ChartDataset,
    ComparisonChartResponse,
    ComparisonDataset,
    EngagementStatsResponse,
    FinancialMetrics,
    GanttChartResponse,
    GanttItem,
    VariancePercent,
)
from app.services.engagement_service import get_all_engagements, get_engagement_by_id

# EY Brand Colors
EY_COLORS = {
    "yellow": "#FFE600",
    "yellow_hover": "#FFD000",
    "black": "#2E2E38",
    "gray_light": "#E5E5E5",
    "gray": "#6B7280",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
}


def calculate_variance(current: float, previous: float) -> float:
    """
    Calculate year-over-year variance percentage.

    Args:
        current: Current year value
        previous: Previous year value

    Returns:
        Variance percentage rounded to 2 decimal places.
        Returns 0.0 if both values are 0.
        Returns 100.0 if previous is 0 but current is not.
    """
    if previous == 0:
        return 0.0 if current == 0 else 100.0
    return round(((current - previous) / previous) * 100, 2)


def extract_financial_metrics(data: dict) -> FinancialMetrics:
    """
    Extract financial metrics from a dictionary.

    Args:
        data: Dictionary containing financial data

    Returns:
        FinancialMetrics object with extracted values
    """
    return FinancialMetrics(
        total_assets=data.get("total_assets", 0.0),
        total_liabilities=data.get("total_liabilities", 0.0),
        equity=data.get("equity", 0.0),
        revenue=data.get("revenue", 0.0),
        expenses=data.get("expenses", 0.0),
    )


def calculate_variance_percent(
    current: FinancialMetrics, previous: FinancialMetrics
) -> VariancePercent:
    """
    Calculate variance percentages between current and previous year metrics.

    Args:
        current: Current year financial metrics
        previous: Previous year financial metrics

    Returns:
        VariancePercent object with calculated variances
    """
    return VariancePercent(
        total_assets=calculate_variance(current.total_assets, previous.total_assets),
        total_liabilities=calculate_variance(
            current.total_liabilities, previous.total_liabilities
        ),
        equity=calculate_variance(current.equity, previous.equity),
        revenue=calculate_variance(current.revenue, previous.revenue),
        expenses=calculate_variance(current.expenses, previous.expenses),
    )


async def get_engagement_stats(
    db: AsyncSession, engagement_id: str
) -> Optional[EngagementStatsResponse]:
    """
    Get engagement statistics with year-over-year comparison.

    Args:
        db: Database session
        engagement_id: Unique engagement identifier

    Returns:
        EngagementStatsResponse with current year, previous year, and variance
        percentages. Returns None if engagement not found.

    Note:
        Supports two financial_data formats:
        1. Nested: {"current_year": {...}, "previous_year": {...}}
        2. Flat: {"total_assets": ..., ...} (treated as current year)
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        return None

    financial_data = engagement.financial_data or {}

    # Check if financial_data uses nested structure (current_year/previous_year)
    # or flat structure (direct values like total_assets at root level)
    if "current_year" in financial_data:
        # Nested structure
        current_year_data = financial_data.get("current_year", {})
        previous_year_data = financial_data.get("previous_year")
    else:
        # Flat structure - treat entire financial_data as current year
        current_year_data = financial_data
        previous_year_data = None

    current_year = extract_financial_metrics(current_year_data)

    # Extract previous year metrics (may not exist)
    previous_year = None
    variance_percent = None

    if previous_year_data:
        previous_year = extract_financial_metrics(previous_year_data)
        variance_percent = calculate_variance_percent(current_year, previous_year)

    return EngagementStatsResponse(
        engagement_id=engagement.id,
        entity_name=engagement.entity_name,
        current_year=current_year,
        previous_year=previous_year,
        variance_percent=variance_percent,
    )


# =============================================================================
# Chart Data Functions
# =============================================================================


async def get_assets_chart(
    db: AsyncSession, engagement_id: str
) -> Optional[AssetsChartResponse]:
    """
    Get assets breakdown chart data for an engagement.

    Args:
        db: Database session
        engagement_id: Unique engagement identifier

    Returns:
        AssetsChartResponse with Chart.js compatible data, or None if not found.
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        return None

    financial_data = engagement.financial_data or {}

    # Get current year data (handle both flat and nested structures)
    if "current_year" in financial_data:
        current_data = financial_data.get("current_year", {})
    else:
        current_data = financial_data

    total_assets = current_data.get("total_assets", 0)

    # Simulate breakdown (in real scenario, this would come from detailed data)
    # Using typical real estate fund asset distribution
    immobilisations = round(total_assets * 0.52, 2)  # Fixed assets ~52%
    actifs_circulants = round(total_assets * 0.32, 2)  # Current assets ~32%
    tresorerie = round(total_assets * 0.16, 2)  # Cash ~16%

    labels = ["Immobilisations", "Actifs circulants", "Trésorerie"]
    values = [immobilisations, actifs_circulants, tresorerie]

    # EY-compliant colors (Yellow as accent, neutrals for variety)
    colors = [EY_COLORS["yellow"], EY_COLORS["gray"], EY_COLORS["black"]]

    chart_data = ChartData(
        labels=labels,
        datasets=[
            ChartDataset(
                label="Répartition des Actifs",
                data=values,
                backgroundColor=colors,
                borderColor=colors,
                borderWidth=1,
            )
        ],
    )

    return AssetsChartResponse(
        engagement_id=engagement_id,
        chart_type="bar",
        data=chart_data,
        source_document=f"Grand_Livre_{engagement.country_code}_2025.xlsx",
    )


async def get_comparison_chart(
    db: AsyncSession, engagement_id: str
) -> Optional[ComparisonChartResponse]:
    """
    Get N vs N-1 comparison chart data for an engagement.

    Args:
        db: Database session
        engagement_id: Unique engagement identifier

    Returns:
        ComparisonChartResponse with grouped bar chart data, or None if not found.
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        return None

    financial_data = engagement.financial_data or {}

    # Get current and previous year data
    if "current_year" in financial_data:
        current_data = financial_data.get("current_year", {})
        previous_data = financial_data.get("previous_year")
    else:
        current_data = financial_data
        # Simulate previous year as 90% of current for demo purposes
        previous_data = {
            "total_assets": current_data.get("total_assets", 0) * 0.92,
            "total_liabilities": current_data.get("total_liabilities", 0) * 0.95,
            "revenue": current_data.get("revenue", 0) * 0.89,
            "expenses": current_data.get("expenses", 0) * 0.90,
        }

    labels = ["Total Assets", "Liabilities", "Revenue", "Expenses"]

    # Dynamic year labels based on current fiscal year
    current_fiscal_year = datetime.now().year
    previous_fiscal_year = current_fiscal_year - 1

    current_values = [
        current_data.get("total_assets", 0),
        current_data.get("total_liabilities", 0),
        current_data.get("revenue", 0),
        current_data.get("expenses", 0),
    ]

    current_dataset = ComparisonDataset(
        label=str(current_fiscal_year),
        data=current_values,
        backgroundColor=EY_COLORS["yellow"],
        borderColor=EY_COLORS["yellow_hover"],
    )

    previous_dataset = None
    variance_list = []

    if previous_data:
        previous_values = [
            previous_data.get("total_assets", 0),
            previous_data.get("total_liabilities", 0),
            previous_data.get("revenue", 0),
            previous_data.get("expenses", 0),
        ]

        previous_dataset = ComparisonDataset(
            label=str(previous_fiscal_year),
            data=previous_values,
            backgroundColor=EY_COLORS["gray_light"],
            borderColor=EY_COLORS["gray"],
        )

        # Calculate variances
        for curr, prev in zip(current_values, previous_values):
            variance_list.append(calculate_variance(curr, prev))

    return ComparisonChartResponse(
        engagement_id=engagement_id,
        chart_type="bar",
        labels=labels,
        current_year=current_dataset,
        previous_year=previous_dataset,
        variance_percent=variance_list,
    )


async def get_breakdown_chart(
    db: AsyncSession, engagement_id: str
) -> Optional[BreakdownChartResponse]:
    """
    Get breakdown/pie chart data for an engagement.

    Args:
        db: Database session
        engagement_id: Unique engagement identifier

    Returns:
        BreakdownChartResponse with pie chart data, or None if not found.
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        return None

    financial_data = engagement.financial_data or {}

    # Get current year data
    if "current_year" in financial_data:
        current_data = financial_data.get("current_year", {})
    else:
        current_data = financial_data

    total_assets = current_data.get("total_assets", 0)

    # Simulate breakdown categories
    categories = [
        ("Immobilisations corporelles", 0.35, EY_COLORS["yellow"]),
        ("Immobilisations financières", 0.17, EY_COLORS["yellow_hover"]),
        ("Créances clients", 0.18, EY_COLORS["info"]),
        ("Stocks", 0.14, EY_COLORS["gray"]),
        ("Trésorerie", 0.16, EY_COLORS["success"]),
    ]

    items = []
    for label, pct, color in categories:
        value = round(total_assets * pct, 2)
        items.append(
            BreakdownItem(
                label=label,
                value=value,
                percentage=round(pct * 100, 2),
                color=color,
            )
        )

    return BreakdownChartResponse(
        engagement_id=engagement_id,
        chart_type="pie",
        title="Répartition des Actifs",
        total=total_assets,
        items=items,
        source_document=f"Grand_Livre_{engagement.country_code}_2025.xlsx",
    )


# =============================================================================
# Gantt Chart Data Functions
# =============================================================================


def get_risk_color(risk_level: str) -> str:
    """
    Get the color code for a risk level.

    Args:
        risk_level: The risk level (high, medium, low)

    Returns:
        Hex color code for the risk level
    """
    colors = {
        "high": EY_COLORS["error"],  # Red
        "medium": EY_COLORS["warning"],  # Orange
        "low": EY_COLORS["success"],  # Green
    }
    return colors.get(risk_level, EY_COLORS["gray"])


async def get_gantt_data(db: AsyncSession) -> GanttChartResponse:
    """
    Get Gantt chart data for all engagements.

    Retrieves all engagements and formats them for Gantt chart display
    with timeline information, risk coloring, and completion status.

    Args:
        db: Database session

    Returns:
        GanttChartResponse with all engagement timeline data
    """
    engagements = await get_all_engagements(db)

    if not engagements:
        # Return empty response
        today = datetime.now().strftime("%Y-%m-%d")
        return GanttChartResponse(
            items=[],
            min_date=today,
            max_date=today,
            total_engagements=0,
        )

    items = []
    min_date = None
    max_date = None

    for engagement in engagements:
        # Calculate estimated start date
        # Use created_at as start date, or 30 days before due_date if not available
        if engagement.created_at:
            start_date = engagement.created_at.date()
        elif engagement.due_date:
            start_date = engagement.due_date - timedelta(days=30)
        else:
            start_date = datetime.now().date()

        due_date = engagement.due_date or (datetime.now().date() + timedelta(days=30))

        # Track min/max dates for timeline bounds
        if min_date is None or start_date < min_date:
            min_date = start_date
        if max_date is None or due_date > max_date:
            max_date = due_date

        # Get risk level as string
        risk_level_str = (
            engagement.risk_level.value
            if hasattr(engagement.risk_level, "value")
            else str(engagement.risk_level)
        )

        # Get status as string
        status_str = (
            engagement.status.value
            if hasattr(engagement.status, "value")
            else str(engagement.status)
        )

        items.append(
            GanttItem(
                engagement_id=engagement.id,
                entity_name=engagement.entity_name,
                start_date=start_date.strftime("%Y-%m-%d"),
                due_date=due_date.strftime("%Y-%m-%d"),
                completion_percent=engagement.completion_percent or 0,
                risk_level=risk_level_str,
                status=status_str,
                color=get_risk_color(risk_level_str),
            )
        )

    # Sort items by start_date
    items.sort(key=lambda x: x.start_date)

    # Add some padding to the timeline (7 days before and after)
    if min_date:
        min_date = min_date - timedelta(days=7)
    if max_date:
        max_date = max_date + timedelta(days=7)

    return GanttChartResponse(
        items=items,
        min_date=min_date.strftime("%Y-%m-%d") if min_date else datetime.now().strftime("%Y-%m-%d"),
        max_date=max_date.strftime("%Y-%m-%d") if max_date else datetime.now().strftime("%Y-%m-%d"),
        total_engagements=len(items),
    )

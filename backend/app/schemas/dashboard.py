"""Pydantic schemas for Dashboard API requests and responses."""

from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class FinancialMetrics(BaseModel):
    """Schema for financial metrics (current year or previous year)."""

    total_assets: float = Field(
        default=0.0,
        description="Total assets value in currency",
        examples=[15400000.0],
    )
    total_liabilities: float = Field(
        default=0.0,
        description="Total liabilities value in currency",
        examples=[8200000.0],
    )
    equity: float = Field(
        default=0.0,
        description="Net equity value (assets - liabilities)",
        examples=[7200000.0],
    )
    revenue: float = Field(
        default=0.0,
        description="Total revenue value in currency",
        examples=[12500000.0],
    )
    expenses: float = Field(
        default=0.0,
        description="Total expenses value in currency",
        examples=[9800000.0],
    )

    model_config = ConfigDict(extra="allow")


class VariancePercent(BaseModel):
    """Schema for year-over-year variance percentages."""

    total_assets: float = Field(
        default=0.0,
        description="YoY variance percentage for total assets",
        examples=[8.45],
    )
    total_liabilities: float = Field(
        default=0.0,
        description="YoY variance percentage for total liabilities",
        examples=[5.13],
    )
    equity: float = Field(
        default=0.0,
        description="YoY variance percentage for equity",
        examples=[12.50],
    )
    revenue: float = Field(
        default=0.0,
        description="YoY variance percentage for revenue",
        examples=[11.61],
    )
    expenses: float = Field(
        default=0.0,
        description="YoY variance percentage for expenses",
        examples=[10.11],
    )

    model_config = ConfigDict(extra="allow")


class EngagementStatsResponse(BaseModel):
    """Schema for engagement statistics API response with YoY comparison."""

    engagement_id: str = Field(
        ...,
        description="Unique engagement identifier",
        examples=["ENG-FR-001"],
    )
    entity_name: str = Field(
        ...,
        description="Name of the client entity",
        examples=["France SPV"],
    )
    current_year: FinancialMetrics = Field(
        ...,
        description="Financial metrics for the current year",
    )
    previous_year: Optional[FinancialMetrics] = Field(
        default=None,
        description="Financial metrics for the previous year (N-1)",
    )
    variance_percent: Optional[VariancePercent] = Field(
        default=None,
        description="Year-over-year variance percentages for each metric",
    )

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
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
        },
    )


# =============================================================================
# Chart Schemas (for Chart.js format)
# =============================================================================


class ChartDataset(BaseModel):
    """Schema for a Chart.js dataset."""

    label: str = Field(..., description="Dataset label")
    data: List[float] = Field(..., description="Data points")
    backgroundColor: Optional[List[str]] = Field(
        default=None, description="Background colors for each data point"
    )
    borderColor: Optional[List[str]] = Field(
        default=None, description="Border colors for each data point"
    )
    borderWidth: Optional[int] = Field(default=1, description="Border width")


class ChartData(BaseModel):
    """Schema for Chart.js data structure."""

    labels: List[str] = Field(..., description="Chart labels")
    datasets: List[ChartDataset] = Field(..., description="Chart datasets")


class AssetsChartResponse(BaseModel):
    """Schema for assets breakdown chart data."""

    engagement_id: str = Field(..., description="Engagement identifier")
    chart_type: str = Field(default="bar", description="Chart type (bar, pie, etc.)")
    data: ChartData = Field(..., description="Chart.js compatible data")
    source_document: Optional[str] = Field(
        default=None, description="Source document name"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "engagement_id": "ENG-FR-001",
                "chart_type": "bar",
                "data": {
                    "labels": ["Immobilisations", "Actifs circulants", "Trésorerie"],
                    "datasets": [
                        {
                            "label": "Assets Breakdown",
                            "data": [8000000, 5000000, 2400000],
                            "backgroundColor": ["#FFE600", "#FFD000", "#2E2E38"],
                        }
                    ],
                },
                "source_document": "Grand_Livre_FR_2025.xlsx",
            }
        }
    )


class ComparisonDataset(BaseModel):
    """Schema for comparison chart dataset with variance."""

    label: str = Field(..., description="Dataset label (e.g., 'Current Year')")
    data: List[float] = Field(..., description="Data points")
    backgroundColor: str = Field(..., description="Background color")
    borderColor: Optional[str] = Field(default=None, description="Border color")


class ComparisonChartResponse(BaseModel):
    """Schema for N vs N-1 comparison chart data."""

    engagement_id: str = Field(..., description="Engagement identifier")
    chart_type: str = Field(default="bar", description="Chart type")
    labels: List[str] = Field(..., description="Metric labels")
    current_year: ComparisonDataset = Field(..., description="Current year data")
    previous_year: Optional[ComparisonDataset] = Field(
        default=None, description="Previous year data"
    )
    variance_percent: List[float] = Field(
        default_factory=list, description="Variance percentages per metric"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "engagement_id": "ENG-FR-001",
                "chart_type": "bar",
                "labels": ["Assets", "Liabilities", "Revenue", "Expenses"],
                "current_year": {
                    "label": "2025",
                    "data": [15400000, 8200000, 12500000, 9800000],
                    "backgroundColor": "#FFE600",
                },
                "previous_year": {
                    "label": "2024",
                    "data": [14200000, 7800000, 11200000, 8900000],
                    "backgroundColor": "#E5E5E5",
                },
                "variance_percent": [8.45, 5.13, 11.61, 10.11],
            }
        }
    )


class BreakdownItem(BaseModel):
    """Schema for a breakdown item."""

    label: str = Field(..., description="Item label")
    value: float = Field(..., description="Item value")
    percentage: float = Field(..., description="Percentage of total")
    color: str = Field(..., description="Display color")


class BreakdownChartResponse(BaseModel):
    """Schema for breakdown/pie chart data."""

    engagement_id: str = Field(..., description="Engagement identifier")
    chart_type: str = Field(default="pie", description="Chart type")
    title: str = Field(..., description="Chart title")
    total: float = Field(..., description="Total value")
    items: List[BreakdownItem] = Field(..., description="Breakdown items")
    source_document: Optional[str] = Field(
        default=None, description="Source document name"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "engagement_id": "ENG-FR-001",
                "chart_type": "pie",
                "title": "Assets Breakdown",
                "total": 15400000,
                "items": [
                    {
                        "label": "Immobilisations",
                        "value": 8000000,
                        "percentage": 51.95,
                        "color": "#FFE600",
                    },
                    {
                        "label": "Actifs circulants",
                        "value": 5000000,
                        "percentage": 32.47,
                        "color": "#FFD000",
                    },
                    {
                        "label": "Trésorerie",
                        "value": 2400000,
                        "percentage": 15.58,
                        "color": "#2E2E38",
                    },
                ],
                "source_document": "Grand_Livre_FR_2025.xlsx",
            }
        }
    )

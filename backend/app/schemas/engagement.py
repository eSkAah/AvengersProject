"""Pydantic schemas for Engagement API requests and responses."""

from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, ConfigDict


class StatusEnum(str, Enum):
    """Engagement processing status."""

    waiting = "waiting"
    received = "received"
    processing = "processing"
    completed = "completed"


class RiskLevel(str, Enum):
    """Engagement risk level classification."""

    high = "high"
    medium = "medium"
    low = "low"


class FinancialData(BaseModel):
    """Nested schema for financial data."""

    total_assets: float = Field(default=0, description="Total assets value")
    total_liabilities: float = Field(default=0, description="Total liabilities value")
    equity: float = Field(default=0, description="Equity value")
    revenue: float = Field(default=0, description="Revenue value")
    expenses: float = Field(default=0, description="Expenses value")

    model_config = ConfigDict(extra="allow")


class EngagementBase(BaseModel):
    """Base schema with shared fields for Engagement."""

    entity_name: str = Field(..., min_length=1, max_length=100, description="Name of the client entity")
    country_code: str = Field(..., min_length=2, max_length=2, description="ISO 2-letter country code")
    country_name: str = Field(..., min_length=1, max_length=50, description="Full country name")
    service_type: str = Field(default="Corporate Tax", max_length=50, description="Type of service")
    due_date: date = Field(..., description="Deadline for engagement completion")


class EngagementCreate(EngagementBase):
    """Schema for creating a new engagement."""

    id: str = Field(..., min_length=1, max_length=20, description="Unique engagement identifier")
    status: StatusEnum = Field(default=StatusEnum.waiting, description="Initial processing status")
    risk_level: RiskLevel = Field(default=RiskLevel.medium, description="Initial risk level")
    completion_percent: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    predicted_completion: Optional[date] = Field(default=None, description="AI-predicted completion date")
    documents_required: List[str] = Field(default_factory=list, description="List of required document types")
    financial_data: Dict[str, Any] = Field(default_factory=dict, description="Financial metrics")
    ai_insights: List[str] = Field(default_factory=list, description="AI-generated insights")


class EngagementResponse(BaseModel):
    """Schema for engagement API response."""

    id: str = Field(..., description="Unique engagement identifier (e.g., ENG-FR-001)")
    entity_name: str = Field(..., description="Name of the client entity")
    country_code: str = Field(..., description="ISO 2-letter country code")
    country_name: str = Field(..., description="Full country name")
    service_type: str = Field(..., description="Type of service")
    status: StatusEnum = Field(..., description="Current processing status")
    risk_level: RiskLevel = Field(..., description="Calculated risk classification")
    due_date: date = Field(..., description="Deadline for engagement completion")
    predicted_completion: Optional[date] = Field(None, description="AI-predicted completion date")
    completion_percent: int = Field(..., ge=0, le=100, description="Progress percentage (0-100)")
    documents_required: List[str] = Field(default_factory=list, description="List of required document types")
    financial_data: Union[FinancialData, Dict[str, Any]] = Field(
        default_factory=dict, description="Financial metrics"
    )
    ai_insights: List[str] = Field(default_factory=list, description="AI-generated insights")
    variance_alerts: List["VarianceAlert"] = Field(default_factory=list, description="Significant N vs N-1 variances")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class EngagementListResponse(BaseModel):
    """Schema for list of engagements with metadata."""

    total: int = Field(..., description="Total number of engagements")
    engagements: List[EngagementResponse] = Field(..., description="List of engagements")


class EngagementUpdate(BaseModel):
    """Schema for updating an engagement (partial update)."""

    entity_name: Optional[str] = Field(None, min_length=1, max_length=100)
    country_code: Optional[str] = Field(None, min_length=2, max_length=2)
    country_name: Optional[str] = Field(None, min_length=1, max_length=50)
    service_type: Optional[str] = Field(None, max_length=50)
    status: Optional[StatusEnum] = None
    risk_level: Optional[RiskLevel] = None
    due_date: Optional[date] = None
    predicted_completion: Optional[date] = None
    completion_percent: Optional[int] = Field(None, ge=0, le=100)
    documents_required: Optional[List[str]] = None
    financial_data: Optional[Dict[str, Any]] = None
    ai_insights: Optional[List[str]] = None


class RiskDetailsResponse(BaseModel):
    """Schema for detailed risk information."""

    engagement_id: str = Field(..., description="Engagement identifier")
    level: RiskLevel = Field(..., description="Risk level classification")
    reasons: List[str] = Field(..., description="List of reasons for the risk level")
    suggested_actions: List[str] = Field(..., description="Suggested actions to mitigate risk")
    days_remaining: int = Field(..., description="Days until deadline")
    completion_percent: int = Field(..., description="Current completion percentage")
    missing_documents: List[str] = Field(..., description="List of missing document types")


class PredictionResponse(BaseModel):
    """Schema for completion prediction."""

    engagement_id: str = Field(..., description="Engagement identifier")
    predicted_date: Optional[date] = Field(None, description="Predicted completion date")
    days_difference: int = Field(
        ..., description="Days difference vs deadline (positive=late, negative=early)"
    )
    velocity: float = Field(..., description="Completion velocity (% per day)")
    is_on_track: bool = Field(..., description="Whether engagement is on track")
    confidence: str = Field(..., description="Prediction confidence: high, medium, low")
    due_date: date = Field(..., description="Original deadline")
    formatted_prediction: str = Field(..., description="Human-readable prediction")


class VarianceAlert(BaseModel):
    """Schema for significant N vs N-1 variance alerts."""

    metric: str = Field(..., description="Financial metric name (e.g., total_assets)")
    metric_label: str = Field(..., description="Human-readable metric label")
    current_value: float = Field(..., description="Current year value")
    previous_value: float = Field(..., description="Previous year value")
    variance_percent: float = Field(..., description="Variance percentage (e.g., 23.5 for +23.5%)")
    variance_type: str = Field(..., description="Type: increase or decrease")
    insight_message: str = Field(..., description="Human-readable insight message")

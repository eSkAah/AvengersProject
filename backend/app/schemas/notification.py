"""Pydantic schemas for Notification API."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NotificationResponse(BaseModel):
    """Schema for notification API response."""

    id: str = Field(..., description="Unique notification identifier")
    type: str = Field(..., description="Notification type: risk_escalation, deadline_approaching")
    priority: str = Field(..., description="Priority: high, medium, low")
    message: str = Field(..., description="Notification message")
    engagement_id: str = Field(..., description="Related engagement ID")
    engagement_name: str = Field(..., description="Related engagement name")
    created_at: datetime = Field(..., description="Creation timestamp")
    dismissed: bool = Field(..., description="Whether notification has been dismissed")
    dismissed_at: Optional[datetime] = Field(None, description="Dismissal timestamp")


class NotificationListResponse(BaseModel):
    """Schema for list of notifications."""

    notifications: List[NotificationResponse] = Field(..., description="List of notifications")
    total: int = Field(..., description="Total number of notifications")
    unread_count: int = Field(..., description="Number of unread (not dismissed) notifications")


class NotificationDismissResponse(BaseModel):
    """Response for dismiss notification operation."""

    success: bool = Field(..., description="Whether the operation was successful")
    notification_id: str = Field(..., description="Notification ID")


class NotificationCountResponse(BaseModel):
    """Response for notification count."""

    count: int = Field(..., description="Number of unread notifications")

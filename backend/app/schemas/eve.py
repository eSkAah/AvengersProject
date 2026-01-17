"""Pydantic schemas for Eve AI assistant endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# =============================================================================
# Request Schemas
# =============================================================================


class ChatRequest(BaseModel):
    """Request body for Eve chat endpoint."""

    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    engagement_id: Optional[str] = Field(
        None, description="Optional engagement ID for context"
    )
    context: Optional[dict] = Field(
        None, description="Additional context (e.g., current page, selected data)"
    )


class ExplainRequest(BaseModel):
    """Request body for Eve explain endpoint (CMD+Click)."""

    value: str = Field(..., description="The value to explain (e.g., '3,378,000 €')")
    label: str = Field(..., description="Label of the value (e.g., 'Total Assets')")
    engagement_id: str = Field(..., description="Engagement ID for context")
    context: Optional[dict] = Field(
        None,
        description="Additional context (e.g., chart type, data point index)",
    )


# =============================================================================
# Response Schemas
# =============================================================================


class SourceReference(BaseModel):
    """Reference to a source document."""

    document_name: str = Field(..., description="Name of the source document")
    document_id: Optional[str] = Field(None, description="Document ID if available")
    line_number: Optional[int] = Field(None, description="Line number in the document")
    sheet_name: Optional[str] = Field(None, description="Sheet name if Excel")


class ChatResponse(BaseModel):
    """Response from Eve chat endpoint."""

    message: str = Field(..., description="Eve's response message")
    sources: Optional[list[SourceReference]] = Field(
        None, description="Source references if applicable"
    )
    engagement_id: Optional[str] = Field(
        None, description="Engagement ID if context was used"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Response timestamp"
    )


class ExplainResponse(BaseModel):
    """Response from Eve explain endpoint."""

    explanation: str = Field(..., description="Explanation of the value")
    source_document: Optional[str] = Field(
        None, description="Source document name"
    )
    source_line: Optional[int] = Field(None, description="Source line number")
    breakdown: Optional[list[dict]] = Field(
        None, description="Breakdown of the value if applicable"
    )
    comparison: Optional[dict] = Field(
        None, description="Year-over-year comparison if available"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Response timestamp"
    )


# =============================================================================
# Conversation History Schemas
# =============================================================================


class Message(BaseModel):
    """A single message in a conversation."""

    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Message timestamp"
    )
    sources: Optional[list[SourceReference]] = Field(
        None, description="Sources if assistant message"
    )


class ConversationHistory(BaseModel):
    """Conversation history for an engagement."""

    engagement_id: str = Field(..., description="Engagement ID")
    messages: list[Message] = Field(
        default_factory=list, description="List of messages"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Conversation start time"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last message time"
    )

"""Engagement SQLAlchemy model for Avengers Project platform."""

from datetime import datetime, date
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from sqlalchemy import Column, String, Integer, Date, DateTime, Enum, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document import Document


class StatusEnum(str, PyEnum):
    """Engagement processing status."""

    waiting = "waiting"
    received = "received"
    processing = "processing"
    completed = "completed"


class RiskLevel(str, PyEnum):
    """Engagement risk level classification."""

    high = "high"
    medium = "medium"
    low = "low"


class Engagement(Base):
    """
    Engagement model representing a client engagement in the Avengers Project platform.

    Attributes:
        id: Unique engagement identifier (e.g., ENG-FR-001)
        entity_name: Name of the client entity
        country_code: ISO 2-letter country code
        country_name: Full country name
        service_type: Type of service (default: Corporate Tax)
        status: Current processing status
        risk_level: Calculated risk classification
        due_date: Deadline for engagement completion
        predicted_completion: AI-predicted completion date
        completion_percent: Progress percentage (0-100)
        documents_required: List of required document types
        financial_data: JSON with financial metrics
        ai_insights: List of AI-generated insights
        documents: Many-to-many relationship with documents
    """

    __tablename__ = "engagements"

    id = Column(String(20), primary_key=True, index=True)
    entity_name = Column(String(100), nullable=False)
    country_code = Column(String(2), nullable=False, index=True)
    country_name = Column(String(50), nullable=False)
    service_type = Column(String(50), default="Corporate Tax")
    status = Column(
        Enum(StatusEnum, native_enum=False),
        default=StatusEnum.waiting,
        nullable=False,
    )
    risk_level = Column(
        Enum(RiskLevel, native_enum=False),
        default=RiskLevel.medium,
        nullable=False,
    )
    due_date = Column(Date, nullable=False)
    predicted_completion = Column(Date, nullable=True)
    completion_percent = Column(Integer, default=0)
    documents_required = Column(JSON, default=list)
    financial_data = Column(JSON, default=dict)
    ai_insights = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Many-to-many relationship with documents
    documents = relationship(
        "Document",
        secondary="document_engagements",
        back_populates="engagements",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Engagement(id={self.id}, entity={self.entity_name}, status={self.status})>"

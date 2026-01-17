"""Document SQLAlchemy model for Star-Eyes platform."""

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class DocumentStatus(str, PyEnum):
    """Document processing status."""

    uploaded = "uploaded"
    analyzing = "analyzing"
    analyzed = "analyzed"
    error = "error"


class DocumentType(str, PyEnum):
    """Type of financial document."""

    general_ledger = "general_ledger"
    trial_balance = "trial_balance"
    tax_return = "tax_return"
    financial_statement = "financial_statement"


class Document(Base):
    """
    Document model representing an uploaded document.

    Attributes:
        id: Unique document identifier (UUID format)
        engagement_id: Foreign key to parent engagement
        name: Original filename
        type: Document type classification
        format: File extension (xlsx, pdf, csv)
        size_bytes: File size in bytes
        status: Processing status
        ai_summary: AI-generated summary of document content
        file_path: Relative path to stored file (uploads/{engagement_id}/{filename})
        uploaded_at: Timestamp of upload
    """

    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True)
    engagement_id = Column(
        String(20),
        ForeignKey("engagements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    type = Column(
        Enum(DocumentType, native_enum=False),
        nullable=True,
    )
    format = Column(String(10), nullable=False)  # xlsx, pdf, csv
    size_bytes = Column(Integer, default=0)
    status = Column(
        Enum(DocumentStatus, native_enum=False),
        default=DocumentStatus.uploaded,
    )
    ai_summary = Column(String(1000), nullable=True)
    file_path = Column(String(500), nullable=True)  # Relative path to stored file
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationship back to engagement
    engagement = relationship("Engagement", back_populates="documents")

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name={self.name}, status={self.status})>"

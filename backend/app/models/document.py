"""Document SQLAlchemy model for Avengers Project platform."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Table
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
    bank_statement = "bank_statement"


class DocumentCategory(str, PyEnum):
    """Category grouping for document types."""

    accounting = "accounting"  # Accounting: general_ledger, trial_balance
    tax = "tax"  # Tax: tax_return
    financial = "financial"  # Financial: financial_statement, bank_statement


# Document type to category mapping
DOCUMENT_TYPE_CATEGORIES = {
    DocumentType.general_ledger: DocumentCategory.accounting,
    DocumentType.trial_balance: DocumentCategory.accounting,
    DocumentType.tax_return: DocumentCategory.tax,
    DocumentType.financial_statement: DocumentCategory.financial,
    DocumentType.bank_statement: DocumentCategory.financial,
}


# Junction table for many-to-many relationship between documents and engagements
document_engagements = Table(
    "document_engagements",
    Base.metadata,
    Column(
        "document_id",
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "engagement_id",
        String(20),
        ForeignKey("engagements.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("linked_at", DateTime, default=lambda: datetime.now(timezone.utc)),
)


class Document(Base):
    """
    Document model representing an uploaded document.

    Attributes:
        id: Unique document identifier (UUID format)
        name: Original filename
        type: Document type classification
        category: Document category (derived from type)
        format: File extension (xlsx, pdf, csv)
        size_bytes: File size in bytes
        status: Processing status
        ai_summary: AI-generated summary of document content
        file_path: Relative path to stored file (uploads/{filename})
        uploaded_at: Timestamp of upload
        engagements: Many-to-many relationship with engagements
    """

    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True)
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
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Many-to-many relationship with engagements
    engagements = relationship(
        "Engagement",
        secondary=document_engagements,
        back_populates="documents",
        lazy="selectin",
    )

    @property
    def category(self) -> DocumentCategory | None:
        """Get the category for this document based on its type."""
        if self.type is None:
            return None
        return DOCUMENT_TYPE_CATEGORIES.get(self.type)

    @property
    def engagement_ids(self) -> list[str]:
        """Get list of engagement IDs this document is linked to."""
        return [eng.id for eng in self.engagements]

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name={self.name}, status={self.status})>"

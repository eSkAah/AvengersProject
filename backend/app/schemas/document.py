"""Pydantic schemas for Document API requests and responses."""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


class DocumentStatus(str, Enum):
    """Document processing status."""

    uploaded = "uploaded"
    analyzing = "analyzing"
    analyzed = "analyzed"
    error = "error"


class DocumentType(str, Enum):
    """Type of financial document."""

    general_ledger = "general_ledger"
    trial_balance = "trial_balance"
    tax_return = "tax_return"
    financial_statement = "financial_statement"


class DocumentBase(BaseModel):
    """Base schema with shared fields for Document."""

    name: str = Field(..., min_length=1, max_length=255, description="Original filename")
    engagement_id: str = Field(..., min_length=1, max_length=20, description="Parent engagement ID")
    format: str = Field(..., min_length=1, max_length=10, description="File extension (xlsx, pdf, csv)")


class DocumentCreate(DocumentBase):
    """Schema for creating a new document."""

    id: str = Field(..., min_length=1, max_length=36, description="Unique document identifier (UUID)")
    type: Optional[DocumentType] = Field(default=None, description="Document type classification")
    size_bytes: int = Field(default=0, ge=0, description="File size in bytes")
    status: DocumentStatus = Field(default=DocumentStatus.uploaded, description="Processing status")
    ai_summary: Optional[str] = Field(default=None, max_length=1000, description="AI-generated summary")
    file_path: Optional[str] = Field(default=None, max_length=500, description="Relative path to stored file")


class DocumentResponse(BaseModel):
    """Schema for document API response."""

    id: str = Field(..., description="Unique document identifier (UUID)")
    engagement_id: str = Field(..., description="Parent engagement ID")
    name: str = Field(..., description="Original filename")
    type: Optional[DocumentType] = Field(None, description="Document type classification")
    format: str = Field(..., description="File extension (xlsx, pdf, csv)")
    size_bytes: int = Field(..., description="File size in bytes")
    status: DocumentStatus = Field(..., description="Processing status")
    ai_summary: Optional[str] = Field(None, description="AI-generated summary of document content")
    file_path: Optional[str] = Field(None, description="Relative path to stored file")
    uploaded_at: datetime = Field(..., description="Upload timestamp")

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """Schema for list of documents with metadata."""

    total: int = Field(..., description="Total number of documents")
    documents: List[DocumentResponse] = Field(..., description="List of documents")


class DocumentUpdate(BaseModel):
    """Schema for updating a document (partial update)."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[DocumentType] = None
    status: Optional[DocumentStatus] = None
    ai_summary: Optional[str] = Field(None, max_length=1000)
    file_path: Optional[str] = Field(None, max_length=500)

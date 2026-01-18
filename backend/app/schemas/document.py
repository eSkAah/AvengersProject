"""Pydantic schemas for Document API requests and responses."""

from datetime import datetime
from typing import List, Optional, Dict

from pydantic import BaseModel, Field, ConfigDict

# Import enums from models to avoid duplication (DRY principle)
from app.models.document import DocumentStatus, DocumentType, DocumentCategory


class DocumentBase(BaseModel):
    """Base schema with shared fields for Document."""

    name: str = Field(..., min_length=1, max_length=255, description="Original filename")
    format: str = Field(..., min_length=1, max_length=10, description="File extension (xlsx, pdf, csv)")


class DocumentCreate(DocumentBase):
    """Schema for creating a new document."""

    id: str = Field(..., min_length=1, max_length=36, description="Unique document identifier (UUID)")
    type: Optional[DocumentType] = Field(default=None, description="Document type classification")
    size_bytes: int = Field(default=0, ge=0, description="File size in bytes")
    status: DocumentStatus = Field(default=DocumentStatus.uploaded, description="Processing status")
    ai_summary: Optional[str] = Field(default=None, max_length=1000, description="AI-generated summary")
    file_path: Optional[str] = Field(default=None, max_length=500, description="Relative path to stored file")
    engagement_ids: List[str] = Field(default_factory=list, description="List of linked engagement IDs")


class DocumentResponse(BaseModel):
    """Schema for document API response."""

    id: str = Field(..., description="Unique document identifier (UUID)")
    name: str = Field(..., description="Original filename")
    type: Optional[DocumentType] = Field(None, description="Document type classification")
    category: Optional[DocumentCategory] = Field(None, description="Document category")
    format: str = Field(..., description="File extension (xlsx, pdf, csv)")
    size_bytes: int = Field(..., description="File size in bytes")
    status: DocumentStatus = Field(..., description="Processing status")
    ai_summary: Optional[str] = Field(None, description="AI-generated summary of document content")
    file_path: Optional[str] = Field(None, description="Relative path to stored file")
    uploaded_at: datetime = Field(..., description="Upload timestamp")
    engagement_ids: List[str] = Field(default_factory=list, description="List of linked engagement IDs")

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """Schema for list of documents with metadata and pagination info."""

    total: int = Field(..., description="Total number of documents matching the filter")
    skip: int = Field(0, description="Number of documents skipped")
    limit: int = Field(100, description="Maximum number of documents returned")
    documents: List[DocumentResponse] = Field(..., description="List of documents")


class DocumentUpdate(BaseModel):
    """Schema for updating a document (partial update)."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[DocumentType] = None
    status: Optional[DocumentStatus] = None
    ai_summary: Optional[str] = Field(None, max_length=1000)
    file_path: Optional[str] = Field(None, max_length=500)


# =============================================================================
# Upload-specific schemas (Story 4-1)
# =============================================================================

# Note: Upload endpoint uses DocumentResponse directly since all fields are the same.
# file_path is Optional in DocumentResponse but will always be set for uploaded documents.


class UploadErrorDetail(BaseModel):
    """Schema for upload error response details."""

    error_type: str = Field(..., description="Type of error: invalid_format, size_exceeded, engagement_not_found")
    message: str = Field(..., description="Human-readable error message")
    allowed_formats: Optional[List[str]] = Field(None, description="List of allowed file formats")
    max_size_bytes: Optional[int] = Field(None, description="Maximum allowed file size in bytes")


class UploadValidationError(BaseModel):
    """Schema for upload validation error response."""

    detail: UploadErrorDetail = Field(..., description="Error details")


class EngagementStatusUpdate(BaseModel):
    """Schema for engagement status update after upload."""

    status: str = Field(..., description="Updated engagement status")
    completion_percent: int = Field(..., description="Updated completion percentage")
    risk_level: str = Field(..., description="Updated risk level")


class DocumentUploadResponse(DocumentResponse):
    """Extended response for document upload including engagement status update."""

    engagement_update: Optional[EngagementStatusUpdate] = Field(
        None, description="Updated engagement status after upload"
    )


# =============================================================================
# Document Library schemas (Document restructure)
# =============================================================================


class DocumentLinkRequest(BaseModel):
    """Schema for linking/unlinking a document to an engagement."""

    document_id: str = Field(..., min_length=1, max_length=36, description="Document ID to link/unlink")
    engagement_id: str = Field(..., min_length=1, max_length=20, description="Engagement ID to link/unlink")


class DocumentLinkResponse(BaseModel):
    """Response for link/unlink operations."""

    success: bool = Field(..., description="Whether the operation was successful")
    document_id: str = Field(..., description="Document ID")
    engagement_id: str = Field(..., description="Engagement ID")
    linked: bool = Field(..., description="Current link status after operation")


class DocumentTypeGroup(BaseModel):
    """Group of documents by type within a category."""

    type: DocumentType = Field(..., description="Document type")
    type_label: str = Field(..., description="Human-readable type label")
    documents: List[DocumentResponse] = Field(..., description="Documents of this type")
    count: int = Field(..., description="Number of documents in this group")


class DocumentCategoryGroup(BaseModel):
    """Group of document types within a category."""

    category: DocumentCategory = Field(..., description="Document category")
    category_label: str = Field(..., description="Human-readable category label")
    types: List[DocumentTypeGroup] = Field(..., description="Document types in this category")
    total_count: int = Field(..., description="Total documents in this category")


class DocumentLibraryResponse(BaseModel):
    """Response for document library grouped by category and type."""

    categories: List[DocumentCategoryGroup] = Field(..., description="Documents grouped by category")
    total_count: int = Field(..., description="Total number of documents in the library")


class AvailableDocumentsResponse(BaseModel):
    """Response for documents available to link to an engagement."""

    documents: List[DocumentResponse] = Field(..., description="Documents not yet linked to the engagement")
    total: int = Field(..., description="Total available documents")


# =============================================================================
# Document Preview schemas (Story 9-3)
# =============================================================================


class ExcelPreviewResponse(BaseModel):
    """Response for Excel file preview as JSON."""

    document_id: str = Field(..., description="Document ID")
    document_name: str = Field(..., description="Document name")
    sheet_name: str = Field(..., description="Name of the sheet being previewed")
    headers: List[str] = Field(..., description="Column headers")
    rows: List[Dict] = Field(..., description="Data rows as list of dictionaries")
    total_rows: int = Field(..., description="Total number of rows in the sheet")
    preview_rows: int = Field(..., description="Number of rows in this preview")
    truncated: bool = Field(..., description="Whether the preview was truncated")


class DocumentPreviewResponse(BaseModel):
    """Generic document preview response."""

    document_id: str = Field(..., description="Document ID")
    document_name: str = Field(..., description="Document name")
    format: str = Field(..., description="File format (xlsx, pdf, csv)")
    preview_type: str = Field(..., description="Type of preview: table, pdf, text")
    content_url: Optional[str] = Field(None, description="URL to fetch content for PDF viewer")
    table_data: Optional[ExcelPreviewResponse] = Field(None, description="Table data for Excel/CSV")

"""Documents API router for Avengers Project platform."""

from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, status, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.document import (
    DocumentResponse,
    DocumentListResponse,
    DocumentUploadResponse,
    EngagementStatusUpdate,
    UploadErrorDetail,
    DocumentLinkRequest,
    DocumentLinkResponse,
    DocumentLibraryResponse,
    DocumentCategoryGroup,
    DocumentTypeGroup,
    AvailableDocumentsResponse,
)
from app.services.document_service import (
    get_all_documents,
    get_documents_by_engagement,
    get_document_by_id,
    get_document_content,
    validate_file_format,
    validate_file_size,
    save_uploaded_file,
    create_document_from_upload,
    update_document_status,
    get_documents_grouped_by_category,
    link_document_to_engagement,
    unlink_document_from_engagement,
    get_available_documents_for_engagement,
    get_documents_for_engagement,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_CATEGORY_LABELS,
)
from app.services.engagement_service import (
    get_engagement_by_id,
    update_engagement_after_upload,
)
from app.services.classification_service import (
    classify_document,
    get_document_type_label,
)
from app.models.document import DocumentStatus, DocumentCategory

router = APIRouter(tags=["Documents"])


@router.get(
    "/",
    response_model=DocumentListResponse,
    summary="List all documents",
    description="Retrieve a list of all documents, optionally filtered by engagement ID.",
    responses={
        200: {
            "description": "List of documents retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "total": 2,
                        "documents": [
                            {
                                "id": "doc-001",
                                "engagement_id": "ENG-DE-001",
                                "name": "Grand_Livre_DE_2025.xlsx",
                                "type": "general_ledger",
                                "format": "xlsx",
                                "size_bytes": 245760,
                                "status": "analyzed",
                                "ai_summary": "General ledger with 1,234 transactions",
                                "file_path": "ENG-DE-001/Grand_Livre_DE_2025.xlsx",
                                "uploaded_at": "2026-01-15T10:30:00",
                            }
                        ],
                    }
                }
            },
        }
    },
)
async def list_documents(
    engagement: Optional[str] = Query(
        None,
        description="Filter by engagement ID (e.g., ENG-FR-001)",
    ),
    skip: int = Query(
        0,
        ge=0,
        description="Number of documents to skip (for pagination)",
    ),
    limit: int = Query(
        100,
        ge=1,
        le=1000,
        description="Maximum number of documents to return (1-1000)",
    ),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """
    Retrieve documents from the database with pagination.

    Optionally filter by engagement ID using the `engagement` query parameter.
    Use `skip` and `limit` for pagination.

    Returns a list of documents with metadata including:
    - Document identification (id, name, type)
    - Processing status and AI summary
    - File information (format, size, path)
    - Pagination info (total, skip, limit)
    """
    if engagement:
        documents, total = await get_documents_by_engagement(db, engagement, skip, limit)
    else:
        documents, total = await get_all_documents(db, skip, limit)

    return DocumentListResponse(
        total=total,
        skip=skip,
        limit=limit,
        documents=[DocumentResponse.model_validate(d) for d in documents],
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document by ID",
    description="Retrieve detailed information for a specific document by its unique identifier.",
    responses={
        200: {
            "description": "Document found and returned successfully",
        },
        404: {
            "description": "Document not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Document not found: doc-999"}
                }
            },
        },
    },
)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """
    Retrieve a single document by its ID.

    Args:
        document_id: Unique document identifier (UUID format)

    Returns:
        Complete document data including metadata and AI summary

    Raises:
        HTTPException: 404 if document is not found
    """
    document = await get_document_by_id(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document not found: {document_id}",
        )
    return DocumentResponse.model_validate(document)


@router.get(
    "/{document_id}/content",
    summary="Download document content",
    description="Download or preview the actual document file.",
    responses={
        200: {
            "description": "File returned successfully",
            "content": {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {},
                "application/pdf": {},
                "text/csv": {},
            },
        },
        404: {
            "description": "Document or file not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Document not found: doc-999"}
                }
            },
        },
    },
)
async def get_document_content_endpoint(
    document_id: str,
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    """
    Download or preview a document file.

    Args:
        document_id: Unique document identifier

    Returns:
        FileResponse with the document content for download/preview

    Raises:
        HTTPException: 404 if document or file is not found
    """
    document = await get_document_by_id(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document not found: {document_id}",
        )

    file_path, media_type = get_document_content(document)
    if file_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found for document: {document_id}",
        )

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=document.name,
    )


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document",
    description="Upload a new document file to an engagement with multipart/form-data.",
    responses={
        201: {
            "description": "Document uploaded successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": "doc-uuid-123",
                        "engagement_id": "ENG-DE-001",
                        "name": "Grand_Livre_2025.xlsx",
                        "type": None,
                        "format": "xlsx",
                        "size_bytes": 245760,
                        "status": "uploaded",
                        "ai_summary": None,
                        "file_path": "ENG-DE-001/Grand_Livre_2025_abc12345.xlsx",
                        "uploaded_at": "2026-01-17T10:30:00Z",
                    }
                }
            },
        },
        400: {
            "description": "Invalid file format or size exceeded",
            "content": {
                "application/json": {
                    "example": {
                        "detail": {
                            "error_type": "invalid_format",
                            "message": "File format 'exe' is not allowed",
                            "allowed_formats": ["xlsx", "xls", "pdf", "csv"],
                        }
                    }
                }
            },
        },
        404: {
            "description": "Engagement not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Engagement not found: ENG-XX-999"}
                }
            },
        },
    },
)
async def upload_document(
    file: UploadFile = File(..., description="Document file to upload (xlsx, xls, pdf, csv)"),
    engagement_id: str = Form(..., description="Target engagement ID"),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """
    Upload a new document to an engagement.

    Accepts multipart/form-data with:
    - file: The document file (xlsx, xls, pdf, csv only, max 10MB)
    - engagement_id: The ID of the target engagement

    The document will be:
    1. Validated for format and size
    2. Stored in ./uploads/{engagement_id}/
    3. Recorded in the database with status 'uploaded'

    Returns the created document record with all metadata.

    Raises:
        HTTPException: 400 if format is invalid or file exceeds size limit
        HTTPException: 404 if engagement does not exist
    """
    # Step 1: Validate engagement exists
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )

    # Step 2: Validate file format
    filename = file.filename or "document"
    if not validate_file_format(filename):
        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "unknown"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UploadErrorDetail(
                error_type="invalid_format",
                message=f"File format '{extension}' is not allowed. Allowed formats: {', '.join(settings.allowed_extensions)}",
                allowed_formats=settings.allowed_extensions,
            ).model_dump(),
        )

    # Step 3: Validate file size (also reads content once to avoid double-read)
    is_valid_size, file_size, file_content = await validate_file_size(file)
    if not is_valid_size:
        max_size_mb = settings.max_upload_size / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UploadErrorDetail(
                error_type="size_exceeded",
                message=f"File size ({file_size / (1024 * 1024):.2f}MB) exceeds maximum allowed size ({max_size_mb:.0f}MB)",
                max_size_bytes=settings.max_upload_size,
            ).model_dump(),
        )

    # Step 4: Save file to disk (reuses content already read)
    try:
        relative_path = await save_uploaded_file(filename, engagement_id, file_content)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UploadErrorDetail(
                error_type="invalid_path",
                message=str(e),
            ).model_dump(),
        )

    # Step 5: Create document record
    document = await create_document_from_upload(
        db=db,
        engagement_id=engagement_id,
        filename=filename,
        file_path=relative_path,
        file_size=file_size,
    )

    # Step 6: Classify the document
    classification_result = classify_document(
        filename=filename,
        file_content=file_content,
    )

    # Step 7: Update document with classification result
    classification_success = False
    if classification_result.document_type is not None:
        document.type = classification_result.document_type
        document.status = DocumentStatus.analyzed
        ai_summary = (
            f"Document classé automatiquement: {get_document_type_label(classification_result.document_type)} "
            f"(confiance: {classification_result.confidence:.0%}, méthode: {classification_result.method})"
        )
        document.ai_summary = ai_summary
        classification_success = True
        await db.commit()
        await db.refresh(document)
    else:
        # Mark as analyzing - will need manual classification or AI fallback
        document.status = DocumentStatus.analyzing
        await db.commit()
        await db.refresh(document)

    # Step 8: Update engagement status, completion percent, and risk level
    updated_engagement = await update_engagement_after_upload(
        db=db,
        engagement=engagement,
        classification_success=classification_success,
        commit=True,
    )

    # Build response with document and engagement status update
    doc_response = DocumentResponse.model_validate(document)
    engagement_update = EngagementStatusUpdate(
        status=updated_engagement.status.value,
        completion_percent=updated_engagement.completion_percent,
        risk_level=updated_engagement.risk_level.value,
    )

    return DocumentUploadResponse(
        **doc_response.model_dump(),
        engagement_update=engagement_update,
    )


# =============================================================================
# Document Library Endpoints (Document restructure)
# =============================================================================


def _build_document_response(doc) -> DocumentResponse:
    """Helper to build DocumentResponse from Document model."""
    return DocumentResponse(
        id=doc.id,
        name=doc.name,
        type=doc.type,
        category=doc.category,
        format=doc.format,
        size_bytes=doc.size_bytes,
        status=doc.status,
        ai_summary=doc.ai_summary,
        file_path=doc.file_path,
        uploaded_at=doc.uploaded_at,
        engagement_ids=doc.engagement_ids,
    )


@router.get(
    "/library",
    response_model=DocumentLibraryResponse,
    summary="Get document library",
    description="Retrieve all documents grouped by category and type.",
    responses={
        200: {
            "description": "Document library retrieved successfully",
        },
    },
)
async def get_document_library(
    db: AsyncSession = Depends(get_db),
) -> DocumentLibraryResponse:
    """
    Get all documents organized by category and type.

    Returns a hierarchical structure:
    - Categories (Comptabilité, Fiscal, Financier)
      - Types (Grand Livre, Balance Générale, etc.)
        - Documents
    """
    grouped, total = await get_documents_grouped_by_category(db)

    categories = []
    for category in DocumentCategory:
        if category not in grouped:
            continue

        types_in_category = grouped[category]
        type_groups = []
        category_total = 0

        for doc_type, docs in types_in_category.items():
            type_groups.append(
                DocumentTypeGroup(
                    type=doc_type,
                    type_label=DOCUMENT_TYPE_LABELS.get(doc_type, doc_type.value),
                    documents=[_build_document_response(d) for d in docs],
                    count=len(docs),
                )
            )
            category_total += len(docs)

        categories.append(
            DocumentCategoryGroup(
                category=category,
                category_label=DOCUMENT_CATEGORY_LABELS.get(category, category.value),
                types=type_groups,
                total_count=category_total,
            )
        )

    return DocumentLibraryResponse(
        categories=categories,
        total_count=total,
    )


@router.post(
    "/link",
    response_model=DocumentLinkResponse,
    summary="Link document to engagement",
    description="Create a link between a document and an engagement.",
    responses={
        200: {
            "description": "Document linked successfully",
        },
        404: {
            "description": "Document or engagement not found",
        },
    },
)
async def link_document(
    request: DocumentLinkRequest,
    db: AsyncSession = Depends(get_db),
) -> DocumentLinkResponse:
    """
    Link a document to an engagement.

    This creates a many-to-many relationship, allowing the same document
    to be associated with multiple engagements.
    """
    success, is_linked = await link_document_to_engagement(
        db, request.document_id, request.engagement_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document or engagement not found",
        )

    return DocumentLinkResponse(
        success=True,
        document_id=request.document_id,
        engagement_id=request.engagement_id,
        linked=is_linked,
    )


@router.delete(
    "/link",
    response_model=DocumentLinkResponse,
    summary="Unlink document from engagement",
    description="Remove the link between a document and an engagement.",
    responses={
        200: {
            "description": "Document unlinked successfully",
        },
        404: {
            "description": "Document or engagement not found",
        },
    },
)
async def unlink_document(
    request: DocumentLinkRequest,
    db: AsyncSession = Depends(get_db),
) -> DocumentLinkResponse:
    """
    Unlink a document from an engagement.

    This removes the many-to-many relationship. The document remains
    in the library and can still be linked to other engagements.
    """
    success, is_linked = await unlink_document_from_engagement(
        db, request.document_id, request.engagement_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document or engagement not found",
        )

    return DocumentLinkResponse(
        success=True,
        document_id=request.document_id,
        engagement_id=request.engagement_id,
        linked=is_linked,
    )


@router.get(
    "/available/{engagement_id}",
    response_model=AvailableDocumentsResponse,
    summary="Get available documents for engagement",
    description="Retrieve documents that are not yet linked to a specific engagement.",
    responses={
        200: {
            "description": "Available documents retrieved successfully",
        },
        404: {
            "description": "Engagement not found",
        },
    },
)
async def get_available_documents(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> AvailableDocumentsResponse:
    """
    Get documents that can be linked to an engagement.

    Returns all documents from the library that are not already
    linked to the specified engagement.
    """
    # Verify engagement exists
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )

    docs = await get_available_documents_for_engagement(db, engagement_id)

    return AvailableDocumentsResponse(
        documents=[_build_document_response(d) for d in docs],
        total=len(docs),
    )


@router.get(
    "/engagement/{engagement_id}",
    response_model=DocumentListResponse,
    summary="Get documents for engagement",
    description="Retrieve all documents linked to a specific engagement.",
    responses={
        200: {
            "description": "Documents retrieved successfully",
        },
        404: {
            "description": "Engagement not found",
        },
    },
)
async def get_engagement_documents(
    engagement_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """
    Get all documents linked to a specific engagement.
    """
    # Verify engagement exists
    engagement = await get_engagement_by_id(db, engagement_id)
    if engagement is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Engagement not found: {engagement_id}",
        )

    docs = await get_documents_for_engagement(db, engagement_id)

    return DocumentListResponse(
        total=len(docs),
        skip=0,
        limit=len(docs),
        documents=[_build_document_response(d) for d in docs],
    )

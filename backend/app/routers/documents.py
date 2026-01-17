"""Documents API router for Star-Eyes platform."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.document import DocumentResponse, DocumentListResponse
from app.services.document_service import (
    get_all_documents,
    get_documents_by_engagement,
    get_document_by_id,
    get_document_content,
)

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
        example="ENG-DE-001",
    ),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """
    Retrieve all documents from the database.

    Optionally filter by engagement ID using the `engagement` query parameter.

    Returns a list of documents with metadata including:
    - Document identification (id, name, type)
    - Processing status and AI summary
    - File information (format, size, path)
    """
    if engagement:
        documents = await get_documents_by_engagement(db, engagement)
    else:
        documents = await get_all_documents(db)

    return DocumentListResponse(
        total=len(documents),
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

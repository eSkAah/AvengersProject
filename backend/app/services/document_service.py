"""Document service with business logic for the Star-Eyes platform."""

import os
from pathlib import Path
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document


# Base upload directory for document storage
UPLOAD_DIR = Path("./uploads")


async def get_all_documents(db: AsyncSession) -> List[Document]:
    """
    Retrieve all documents from the database.

    Args:
        db: Async database session

    Returns:
        List of all Document objects ordered by upload date (newest first)
    """
    result = await db.execute(
        select(Document).order_by(Document.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_documents_by_engagement(
    db: AsyncSession, engagement_id: str
) -> List[Document]:
    """
    Retrieve all documents for a specific engagement.

    Args:
        db: Async database session
        engagement_id: Unique engagement identifier

    Returns:
        List of Document objects for the engagement
    """
    result = await db.execute(
        select(Document)
        .where(Document.engagement_id == engagement_id)
        .order_by(Document.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_document_by_id(
    db: AsyncSession, document_id: str
) -> Optional[Document]:
    """
    Retrieve a single document by its ID.

    Args:
        db: Async database session
        document_id: Unique document identifier

    Returns:
        Document object if found, None otherwise
    """
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    return result.scalar_one_or_none()


def get_document_file_path(document: Document) -> Optional[Path]:
    """
    Get the full file path for a document.

    Args:
        document: Document object

    Returns:
        Full Path to the file if file_path is set and file exists, None otherwise
    """
    if not document.file_path:
        return None

    full_path = UPLOAD_DIR / document.file_path
    if full_path.exists():
        return full_path

    return None


def get_document_content(document: Document) -> Tuple[Optional[Path], str]:
    """
    Get the file path and media type for document download/preview.

    Args:
        document: Document object

    Returns:
        Tuple of (file_path, media_type). file_path is None if file doesn't exist.
    """
    # Determine media type based on format
    media_types = {
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "pdf": "application/pdf",
        "csv": "text/csv",
    }
    media_type = media_types.get(document.format.lower(), "application/octet-stream")

    file_path = get_document_file_path(document)
    return file_path, media_type


async def create_document(
    db: AsyncSession,
    document: Document,
    commit: bool = True,
) -> Document:
    """
    Create a new document in the database.

    Args:
        db: Async database session
        document: Document object to create
        commit: Whether to commit the transaction

    Returns:
        Created Document object
    """
    db.add(document)
    if commit:
        await db.commit()
        await db.refresh(document)
    return document


async def update_document_status(
    db: AsyncSession,
    document: Document,
    status: str,
    ai_summary: Optional[str] = None,
    commit: bool = True,
) -> Document:
    """
    Update document status and optionally AI summary.

    Args:
        db: Async database session
        document: Document object to update
        status: New status value
        ai_summary: Optional AI-generated summary
        commit: Whether to commit the transaction

    Returns:
        Updated Document object
    """
    document.status = status
    if ai_summary is not None:
        document.ai_summary = ai_summary

    if commit:
        await db.commit()
        await db.refresh(document)

    return document

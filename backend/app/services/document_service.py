"""Document service with business logic for the Avengers Project platform."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple, Dict

import aiofiles
from fastapi import UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.document import (
    Document,
    DocumentStatus,
    DocumentType,
    DocumentCategory,
    DOCUMENT_TYPE_CATEGORIES,
    document_engagements,
)
from app.models.engagement import Engagement


# Base upload directory for document storage (use settings)
UPLOAD_DIR = Path(settings.upload_dir)


async def get_all_documents(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Document], int]:
    """
    Retrieve documents from the database with pagination.

    Args:
        db: Async database session
        skip: Number of documents to skip (offset)
        limit: Maximum number of documents to return

    Returns:
        Tuple of (List of Document objects, total count)
    """
    # Get total count
    count_result = await db.execute(select(func.count(Document.id)))
    total = count_result.scalar() or 0

    # Get paginated results
    result = await db.execute(
        select(Document)
        .order_by(Document.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all()), total


async def get_documents_by_engagement(
    db: AsyncSession,
    engagement_id: str,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Document], int]:
    """
    Retrieve documents for a specific engagement with pagination.

    Args:
        db: Async database session
        engagement_id: Unique engagement identifier
        skip: Number of documents to skip (offset)
        limit: Maximum number of documents to return

    Returns:
        Tuple of (List of Document objects, total count for this engagement)
    """
    # Get total count for this engagement using junction table
    count_result = await db.execute(
        select(func.count(Document.id))
        .join(document_engagements)
        .where(document_engagements.c.engagement_id == engagement_id)
    )
    total = count_result.scalar() or 0

    # Get paginated results using junction table
    result = await db.execute(
        select(Document)
        .join(document_engagements)
        .where(document_engagements.c.engagement_id == engagement_id)
        .options(selectinload(Document.engagements))
        .order_by(Document.uploaded_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all()), total


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

    Security:
        Validates that resolved path is within UPLOAD_DIR to prevent path traversal attacks.
    """
    if not document.file_path:
        return None

    # Resolve the full path and ensure it's within UPLOAD_DIR (prevent path traversal)
    full_path = (UPLOAD_DIR / document.file_path).resolve()
    upload_dir_resolved = UPLOAD_DIR.resolve()

    # Security check: ensure the file is within the upload directory
    if not str(full_path).startswith(str(upload_dir_resolved)):
        return None

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


# =============================================================================
# Upload Functions (Story 4-1)
# =============================================================================


def validate_file_format(filename: str) -> bool:
    """
    Check if file extension is in the allowed list.

    Args:
        filename: Name of the file to validate

    Returns:
        True if format is allowed, False otherwise
    """
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[-1].lower()
    return extension in settings.allowed_extensions


async def validate_file_size(file: UploadFile) -> Tuple[bool, int, bytes]:
    """
    Check if file size is within the maximum limit.

    Args:
        file: UploadFile object to validate

    Returns:
        Tuple of (is_valid, file_size_bytes, file_content)
        Returns content to avoid re-reading the file later.
    """
    content = await file.read()
    file_size = len(content)
    return file_size <= settings.max_upload_size, file_size, content


def get_file_extension(filename: str) -> str:
    """
    Extract file extension from filename.

    Args:
        filename: Name of the file

    Returns:
        Lowercase file extension without dot
    """
    if not filename or "." not in filename:
        return ""
    return filename.rsplit(".", 1)[-1].lower()


async def save_uploaded_file(
    filename: str,
    engagement_id: str,
    content: bytes,
) -> str:
    """
    Save uploaded file content to disk in engagement directory.

    Args:
        filename: Original filename from upload
        engagement_id: ID of the target engagement
        content: File content bytes (already read from UploadFile)

    Returns:
        Relative file path for database storage

    Security:
        Creates engagement-specific subdirectory within UPLOAD_DIR.
        Validates path stays within UPLOAD_DIR.
    """
    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    # Create engagement subdirectory
    engagement_dir = UPLOAD_DIR / engagement_id
    engagement_dir.mkdir(parents=True, exist_ok=True)

    # Security check: ensure engagement_dir is within UPLOAD_DIR
    upload_dir_resolved = UPLOAD_DIR.resolve()
    engagement_dir_resolved = engagement_dir.resolve()
    if not str(engagement_dir_resolved).startswith(str(upload_dir_resolved)):
        raise ValueError("Invalid engagement ID: path traversal detected")

    # Generate unique filename to prevent overwrites
    original_name = filename or "document"
    extension = get_file_extension(original_name)
    base_name = original_name.rsplit(".", 1)[0] if "." in original_name else original_name

    # Add UUID suffix to ensure uniqueness
    unique_suffix = str(uuid.uuid4())[:8]
    unique_filename = f"{base_name}_{unique_suffix}.{extension}" if extension else f"{base_name}_{unique_suffix}"

    file_path = engagement_dir / unique_filename

    # Security check: ensure file_path is within engagement_dir
    file_path_resolved = file_path.resolve()
    if not str(file_path_resolved).startswith(str(engagement_dir_resolved)):
        raise ValueError("Invalid filename: path traversal detected")

    # Write file asynchronously
    async with aiofiles.open(file_path, "wb") as out_file:
        await out_file.write(content)

    # Return relative path for database storage
    return f"{engagement_id}/{unique_filename}"


async def create_document_from_upload(
    db: AsyncSession,
    engagement_id: str | None,
    filename: str,
    file_path: str,
    file_size: int,
) -> Document:
    """
    Create a new document record from an uploaded file.

    Args:
        db: Async database session
        engagement_id: ID of the engagement to link (optional)
        filename: Original filename
        file_path: Relative path to stored file
        file_size: Size of file in bytes

    Returns:
        Created Document object with status 'uploaded'
    """
    document = Document(
        id=str(uuid.uuid4()),
        name=filename,
        type=None,  # Will be set by classification service later
        format=get_file_extension(filename),
        size_bytes=file_size,
        status=DocumentStatus.uploaded,
        ai_summary=None,
        file_path=file_path,
        uploaded_at=datetime.now(timezone.utc),
    )

    # Link to engagement if provided
    if engagement_id:
        eng_result = await db.execute(
            select(Engagement).where(Engagement.id == engagement_id)
        )
        engagement = eng_result.scalar_one_or_none()
        if engagement:
            document.engagements.append(engagement)

    return await create_document(db, document)


# =============================================================================
# Document Library Functions (Document restructure)
# =============================================================================


# Labels for document types and categories
DOCUMENT_TYPE_LABELS: Dict[DocumentType, str] = {
    DocumentType.general_ledger: "General Ledger",
    DocumentType.trial_balance: "Trial Balance",
    DocumentType.tax_return: "Tax Return",
    DocumentType.financial_statement: "Financial Statements",
    DocumentType.bank_statement: "Bank Statement",
}

DOCUMENT_CATEGORY_LABELS: Dict[DocumentCategory, str] = {
    DocumentCategory.accounting: "Accounting",
    DocumentCategory.tax: "Tax",
    DocumentCategory.financial: "Financial",
}


async def get_all_documents_with_engagements(
    db: AsyncSession,
) -> List[Document]:
    """
    Retrieve all documents with their engagement relationships.

    Args:
        db: Async database session

    Returns:
        List of Document objects with engagements loaded
    """
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.engagements))
        .order_by(Document.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_documents_grouped_by_category(
    db: AsyncSession,
) -> Tuple[Dict[DocumentCategory, Dict[DocumentType, List[Document]]], int]:
    """
    Get all documents grouped by category and type.

    Args:
        db: Async database session

    Returns:
        Tuple of (grouped documents dict, total count)
    """
    documents = await get_all_documents_with_engagements(db)

    # Group by category and type
    grouped: Dict[DocumentCategory, Dict[DocumentType, List[Document]]] = {}

    for doc in documents:
        if doc.type is None:
            continue

        category = DOCUMENT_TYPE_CATEGORIES.get(doc.type)
        if category is None:
            continue

        if category not in grouped:
            grouped[category] = {}

        if doc.type not in grouped[category]:
            grouped[category][doc.type] = []

        grouped[category][doc.type].append(doc)

    return grouped, len(documents)


async def link_document_to_engagement(
    db: AsyncSession,
    document_id: str,
    engagement_id: str,
) -> Tuple[bool, bool]:
    """
    Link a document to an engagement.

    Args:
        db: Async database session
        document_id: Document ID to link
        engagement_id: Engagement ID to link to

    Returns:
        Tuple of (success, is_linked) - success indicates operation completed,
        is_linked indicates final state
    """
    # Get document with engagements
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.engagements))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if document is None:
        return False, False

    # Get engagement
    eng_result = await db.execute(
        select(Engagement).where(Engagement.id == engagement_id)
    )
    engagement = eng_result.scalar_one_or_none()

    if engagement is None:
        return False, False

    # Check if already linked
    if engagement in document.engagements:
        return True, True  # Already linked

    # Add link
    document.engagements.append(engagement)
    await db.commit()

    return True, True


async def unlink_document_from_engagement(
    db: AsyncSession,
    document_id: str,
    engagement_id: str,
) -> Tuple[bool, bool]:
    """
    Unlink a document from an engagement.

    Args:
        db: Async database session
        document_id: Document ID to unlink
        engagement_id: Engagement ID to unlink from

    Returns:
        Tuple of (success, is_linked) - success indicates operation completed,
        is_linked indicates final state
    """
    # Get document with engagements
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.engagements))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if document is None:
        return False, False

    # Get engagement
    eng_result = await db.execute(
        select(Engagement).where(Engagement.id == engagement_id)
    )
    engagement = eng_result.scalar_one_or_none()

    if engagement is None:
        return False, False

    # Check if linked
    if engagement not in document.engagements:
        return True, False  # Already unlinked

    # Remove link
    document.engagements.remove(engagement)
    await db.commit()

    return True, False


async def get_available_documents_for_engagement(
    db: AsyncSession,
    engagement_id: str,
) -> List[Document]:
    """
    Get documents that are not linked to a specific engagement.

    Args:
        db: Async database session
        engagement_id: Engagement ID to exclude

    Returns:
        List of documents not linked to the engagement
    """
    # Get all documents with their engagements
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.engagements))
        .order_by(Document.uploaded_at.desc())
    )
    all_docs = list(result.scalars().all())

    # Filter out documents that are linked to this engagement
    available = [
        doc for doc in all_docs
        if engagement_id not in [eng.id for eng in doc.engagements]
    ]

    return available


async def get_documents_for_engagement(
    db: AsyncSession,
    engagement_id: str,
) -> List[Document]:
    """
    Get documents linked to a specific engagement.

    Args:
        db: Async database session
        engagement_id: Engagement ID

    Returns:
        List of documents linked to the engagement
    """
    result = await db.execute(
        select(Document)
        .join(document_engagements)
        .where(document_engagements.c.engagement_id == engagement_id)
        .options(selectinload(Document.engagements))
        .order_by(Document.uploaded_at.desc())
    )
    return list(result.scalars().all())

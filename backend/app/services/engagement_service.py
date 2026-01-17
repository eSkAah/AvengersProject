"""Engagement service with business logic for the Avengers Project platform."""

from datetime import date
from typing import List, Optional, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.engagement import Engagement, RiskLevel, StatusEnum


async def get_all_engagements(db: AsyncSession) -> List[Engagement]:
    """
    Retrieve all engagements from the database.

    Args:
        db: Async database session

    Returns:
        List of all Engagement objects
    """
    result = await db.execute(select(Engagement).order_by(Engagement.due_date))
    return list(result.scalars().all())


async def get_engagement_by_id(db: AsyncSession, engagement_id: str) -> Optional[Engagement]:
    """
    Retrieve a single engagement by its ID.

    Args:
        db: Async database session
        engagement_id: Unique engagement identifier

    Returns:
        Engagement object if found, None otherwise
    """
    result = await db.execute(select(Engagement).where(Engagement.id == engagement_id))
    return result.scalar_one_or_none()


def calculate_risk_level(
    due_date: date,
    completion_percent: int,
    status: Union[StatusEnum, str],
) -> RiskLevel:
    """
    Calculate the risk level for an engagement based on business rules.

    Risk calculation logic (from PRD Section 16.1):
    - HIGH: < 7 days remaining AND < 80% complete OR docs missing at J-7
    - MEDIUM: 7-14 days remaining AND < 90% complete OR analysis stuck > 48h
    - LOW: > 14 days remaining OR >= 90% complete OR completed

    Args:
        due_date: Deadline for engagement completion
        completion_percent: Current progress percentage (0-100)
        status: Current engagement status

    Returns:
        Calculated RiskLevel enum value
    """
    # Completed engagements are always low risk
    if status == StatusEnum.completed or status == "completed":
        return RiskLevel.low

    # Calculate days remaining until deadline
    today = date.today()
    days_remaining = (due_date - today).days

    # HIGH risk: < 7 days AND < 80% complete
    if days_remaining < 7 and completion_percent < 80:
        return RiskLevel.high

    # MEDIUM risk: 7-14 days AND < 90% complete
    if 7 <= days_remaining <= 14 and completion_percent < 90:
        return RiskLevel.medium

    # LOW risk: > 14 days OR >= 90% complete
    if days_remaining > 14 or completion_percent >= 90:
        return RiskLevel.low

    # Default to medium if no other condition matches
    return RiskLevel.medium


def calculate_completion_percent(
    documents_uploaded: int,
    documents_required: int,
    status: Union[StatusEnum, str],
) -> int:
    """
    Calculate the completion percentage for an engagement.

    The completion is based on:
    - Document upload progress (primary factor)
    - Processing status (bonus for completed processing)

    Args:
        documents_uploaded: Number of documents uploaded
        documents_required: Total number of required documents
        status: Current engagement status

    Returns:
        Completion percentage (0-100)
    """
    # If completed, always return 100%
    if status == StatusEnum.completed or status == "completed":
        return 100

    # If no documents required, base on status
    if documents_required == 0:
        status_progress = {
            StatusEnum.waiting: 0,
            StatusEnum.received: 25,
            StatusEnum.processing: 75,
            StatusEnum.completed: 100,
            "waiting": 0,
            "received": 25,
            "processing": 75,
            "completed": 100,
        }
        return status_progress.get(status, 0)

    # Calculate based on document upload progress
    base_percent = min(100, int((documents_uploaded / documents_required) * 100))

    # Add status bonus (up to 20% for processing status)
    status_bonus = {
        StatusEnum.waiting: 0,
        StatusEnum.received: 5,
        StatusEnum.processing: 10,
        StatusEnum.completed: 0,  # Already handled above
        "waiting": 0,
        "received": 5,
        "processing": 10,
        "completed": 0,
    }
    bonus = status_bonus.get(status, 0)

    return min(100, base_percent + bonus)


async def update_engagement_risk(
    db: AsyncSession,
    engagement: Engagement,
    commit: bool = True,
) -> Engagement:
    """
    Recalculate and update the risk level for an engagement.

    Args:
        db: Async database session
        engagement: Engagement object to update
        commit: Whether to commit the changes

    Returns:
        Updated Engagement object
    """
    new_risk = calculate_risk_level(
        due_date=engagement.due_date,
        completion_percent=engagement.completion_percent,
        status=engagement.status,
    )
    engagement.risk_level = new_risk

    if commit:
        await db.commit()
        await db.refresh(engagement)

    return engagement


async def count_engagement_documents(
    db: AsyncSession,
    engagement_id: str,
) -> int:
    """
    Count the number of documents uploaded for an engagement.

    Args:
        db: Async database session
        engagement_id: Engagement ID to count documents for

    Returns:
        Number of documents
    """
    from app.models.document import Document, document_engagements

    result = await db.execute(
        select(Document)
        .join(document_engagements)
        .where(document_engagements.c.engagement_id == engagement_id)
    )
    return len(list(result.scalars().all()))


async def update_engagement_after_upload(
    db: AsyncSession,
    engagement: Engagement,
    classification_success: bool = False,
    commit: bool = True,
) -> Engagement:
    """
    Update engagement status, completion percent, and risk level after a document upload.

    Status transitions:
    - waiting → received (first document received)
    - received → processing (classification completed successfully)

    Args:
        db: Async database session
        engagement: Engagement object to update
        classification_success: Whether classification was successful
        commit: Whether to commit the changes

    Returns:
        Updated Engagement object
    """
    # Count documents for this engagement
    documents_count = await count_engagement_documents(db, engagement.id)

    # Get required documents count
    documents_required = len(engagement.documents_required) if engagement.documents_required else 4

    # Status transitions
    old_status = engagement.status

    # First document received: waiting → received
    if old_status == StatusEnum.waiting and documents_count >= 1:
        engagement.status = StatusEnum.received

    # Classification success: received → processing
    if classification_success and engagement.status in (StatusEnum.waiting, StatusEnum.received):
        engagement.status = StatusEnum.processing

    # All required documents uploaded: → completed
    if documents_count >= documents_required:
        engagement.status = StatusEnum.completed

    # Recalculate completion percent
    engagement.completion_percent = calculate_completion_percent(
        documents_uploaded=documents_count,
        documents_required=documents_required,
        status=engagement.status,
    )

    # Recalculate risk level
    engagement.risk_level = calculate_risk_level(
        due_date=engagement.due_date,
        completion_percent=engagement.completion_percent,
        status=engagement.status,
    )

    if commit:
        await db.commit()
        await db.refresh(engagement)

    return engagement

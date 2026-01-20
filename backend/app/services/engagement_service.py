"""Engagement service with business logic for the Avengers Project platform."""

from dataclasses import dataclass
from datetime import date, timedelta
from typing import List, Optional, Tuple, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.engagement import Engagement, RiskLevel, StatusEnum


@dataclass
class RiskDetails:
    """Detailed risk information with reasons and actions."""

    level: RiskLevel
    reasons: List[str]
    suggested_actions: List[str]
    days_remaining: int
    completion_percent: int
    missing_documents: List[str]


@dataclass
class PredictionDetails:
    """Prediction information for completion date."""

    predicted_date: Optional[date]
    days_difference: int  # Positive = late, Negative = early
    velocity: float  # completion% per day
    is_on_track: bool
    confidence: str  # "high", "medium", "low"


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


def calculate_risk_with_details(
    due_date: date,
    completion_percent: int,
    status: Union[StatusEnum, str],
    documents_required: List[str],
    documents_uploaded: int,
    created_at: Optional[date] = None,
) -> RiskDetails:
    """
    Calculate risk level with detailed reasons and suggested actions.

    Args:
        due_date: Deadline for engagement completion
        completion_percent: Current progress percentage (0-100)
        status: Current engagement status
        documents_required: List of required document types
        documents_uploaded: Number of documents uploaded
        created_at: Creation date for velocity calculation

    Returns:
        RiskDetails with level, reasons, and suggested actions
    """
    today = date.today()
    days_remaining = (due_date - today).days
    missing_docs_count = max(0, len(documents_required) - documents_uploaded)
    missing_docs = documents_required[documents_uploaded:] if documents_required else []

    reasons: List[str] = []
    actions: List[str] = []

    # Completed engagements
    if status == StatusEnum.completed or status == "completed":
        return RiskDetails(
            level=RiskLevel.low,
            reasons=["Engagement completed successfully"],
            suggested_actions=[],
            days_remaining=days_remaining,
            completion_percent=completion_percent,
            missing_documents=[],
        )

    # HIGH risk conditions
    high_risk = False

    # Condition 1: < 7 days AND < 80% complete
    if days_remaining < 7 and completion_percent < 80:
        high_risk = True
        reasons.append(f"Only {days_remaining} day(s) remaining with {completion_percent}% completion")
        actions.append("Prioritize uploading missing documents immediately")

    # Condition 2: Missing documents at J-7
    if days_remaining <= 7 and missing_docs_count > 0:
        high_risk = True
        reasons.append(f"{missing_docs_count} missing document(s) at D-{abs(days_remaining) if days_remaining <= 0 else days_remaining}")
        if missing_docs:
            actions.append(f"Upload as priority: {missing_docs[0]}")

    # Condition 3: Overdue
    if days_remaining < 0:
        high_risk = True
        reasons.append(f"{abs(days_remaining)} day(s) overdue")
        actions.append("Contact the client to accelerate document collection")

    if high_risk:
        return RiskDetails(
            level=RiskLevel.high,
            reasons=reasons,
            suggested_actions=actions,
            days_remaining=days_remaining,
            completion_percent=completion_percent,
            missing_documents=missing_docs,
        )

    # MEDIUM risk conditions
    medium_risk = False

    # Condition 1: 7-14 days AND < 90% complete
    if 7 <= days_remaining <= 14 and completion_percent < 90:
        medium_risk = True
        reasons.append(f"{days_remaining} day(s) remaining with {completion_percent}% completion")
        actions.append("Plan to upload remaining documents this week")

    # Condition 2: Documents still missing
    if missing_docs_count > 0 and days_remaining <= 14:
        medium_risk = True
        if f"{missing_docs_count} document(s)" not in " ".join(reasons):
            reasons.append(f"{missing_docs_count} document(s) still required")
        if missing_docs:
            actions.append(f"Documents to provide: {', '.join(missing_docs[:2])}")

    if medium_risk:
        return RiskDetails(
            level=RiskLevel.medium,
            reasons=reasons if reasons else ["Monitoring recommended"],
            suggested_actions=actions if actions else ["Continue regular monitoring"],
            days_remaining=days_remaining,
            completion_percent=completion_percent,
            missing_documents=missing_docs,
        )

    # LOW risk - all good
    reasons = []
    if days_remaining > 14:
        reasons.append(f"Deadline in {days_remaining} days")
    if completion_percent >= 90:
        reasons.append(f"{completion_percent}% complete")
    if missing_docs_count == 0:
        reasons.append("All documents received")

    return RiskDetails(
        level=RiskLevel.low,
        reasons=reasons if reasons else ["Everything under control"],
        suggested_actions=[],
        days_remaining=days_remaining,
        completion_percent=completion_percent,
        missing_documents=missing_docs,
    )


def calculate_predicted_completion(
    created_at: date,
    due_date: date,
    completion_percent: int,
    status: Union[StatusEnum, str],
) -> PredictionDetails:
    """
    Calculate the predicted completion date based on velocity.

    Velocity = completion% / days elapsed
    Predicted = today + (remaining% / velocity)

    Args:
        created_at: When the engagement was created
        due_date: Deadline for engagement completion
        completion_percent: Current progress percentage (0-100)
        status: Current engagement status

    Returns:
        PredictionDetails with predicted date and analysis
    """
    today = date.today()

    # Completed engagements
    if status == StatusEnum.completed or status == "completed":
        return PredictionDetails(
            predicted_date=today,
            days_difference=0,
            velocity=100.0,
            is_on_track=True,
            confidence="high",
        )

    # Calculate days elapsed
    days_elapsed = (today - created_at).days
    if days_elapsed < 1:
        days_elapsed = 1  # Minimum 1 day to avoid division by zero

    # Calculate velocity (% per day)
    velocity = completion_percent / days_elapsed if days_elapsed > 0 else 0

    # Handle edge cases
    if velocity <= 0:
        # No progress yet - estimate based on typical velocity
        if completion_percent == 0:
            # New engagement - assume average velocity of 10% per day
            velocity = 10.0
            confidence = "low"
        else:
            # Very slow progress
            velocity = 0.5  # Minimal velocity assumption
            confidence = "low"
    elif velocity < 5:
        confidence = "medium"
    else:
        confidence = "high"

    # Calculate remaining work
    remaining_percent = 100 - completion_percent
    if remaining_percent <= 0:
        predicted_date = today
        days_to_complete = 0
    else:
        days_to_complete = int(remaining_percent / velocity) if velocity > 0 else 30
        days_to_complete = min(days_to_complete, 365)  # Cap at 1 year
        predicted_date = today + timedelta(days=days_to_complete)

    # Calculate difference vs deadline
    days_difference = (predicted_date - due_date).days

    return PredictionDetails(
        predicted_date=predicted_date,
        days_difference=days_difference,
        velocity=round(velocity, 2),
        is_on_track=days_difference <= 0,
        confidence=confidence,
    )


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

    # Update predicted completion
    prediction = calculate_predicted_completion(
        created_at=engagement.created_at.date() if engagement.created_at else date.today(),
        due_date=engagement.due_date,
        completion_percent=engagement.completion_percent,
        status=engagement.status,
    )
    engagement.predicted_completion = prediction.predicted_date

    if commit:
        await db.commit()
        await db.refresh(engagement)

    return engagement


async def get_engagement_risk_details(
    db: AsyncSession,
    engagement_id: str,
) -> Optional[RiskDetails]:
    """
    Get detailed risk information for an engagement.

    Args:
        db: Async database session
        engagement_id: Engagement ID

    Returns:
        RiskDetails if engagement found, None otherwise
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if not engagement:
        return None

    documents_count = await count_engagement_documents(db, engagement_id)
    documents_required = engagement.documents_required or []

    return calculate_risk_with_details(
        due_date=engagement.due_date,
        completion_percent=engagement.completion_percent,
        status=engagement.status,
        documents_required=documents_required,
        documents_uploaded=documents_count,
        created_at=engagement.created_at.date() if engagement.created_at else None,
    )


async def get_engagement_prediction(
    db: AsyncSession,
    engagement_id: str,
) -> Optional[PredictionDetails]:
    """
    Get prediction details for an engagement.

    Args:
        db: Async database session
        engagement_id: Engagement ID

    Returns:
        PredictionDetails if engagement found, None otherwise
    """
    engagement = await get_engagement_by_id(db, engagement_id)
    if not engagement:
        return None

    return calculate_predicted_completion(
        created_at=engagement.created_at.date() if engagement.created_at else date.today(),
        due_date=engagement.due_date,
        completion_percent=engagement.completion_percent,
        status=engagement.status,
    )

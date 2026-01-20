"""Proactive notification service for Eve assistant."""

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import uuid4


class NotificationType(str, Enum):
    """Type of notification."""

    RISK_ESCALATION = "risk_escalation"
    DEADLINE_APPROACHING = "deadline_approaching"
    DOCUMENT_REQUIRED = "document_required"


class NotificationPriority(str, Enum):
    """Notification priority level."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class Notification:
    """Represents a proactive notification."""

    id: str
    type: NotificationType
    priority: NotificationPriority
    message: str
    engagement_id: str
    engagement_name: str
    created_at: datetime
    dismissed: bool = False
    dismissed_at: Optional[datetime] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "type": self.type.value,
            "priority": self.priority.value,
            "message": self.message,
            "engagement_id": self.engagement_id,
            "engagement_name": self.engagement_name,
            "created_at": self.created_at.isoformat(),
            "dismissed": self.dismissed,
            "dismissed_at": self.dismissed_at.isoformat() if self.dismissed_at else None,
        }


# In-memory notification storage for POC
_notifications: Dict[str, Notification] = {}


def get_all_notifications(include_dismissed: bool = False) -> List[Notification]:
    """
    Get all notifications.

    Args:
        include_dismissed: Whether to include dismissed notifications

    Returns:
        List of Notification objects
    """
    if include_dismissed:
        return list(_notifications.values())
    return [n for n in _notifications.values() if not n.dismissed]


def get_notification_by_id(notification_id: str) -> Optional[Notification]:
    """Get a notification by ID."""
    return _notifications.get(notification_id)


def dismiss_notification(notification_id: str) -> bool:
    """
    Dismiss a notification.

    Args:
        notification_id: ID of notification to dismiss

    Returns:
        True if notification was found and dismissed
    """
    notification = _notifications.get(notification_id)
    if notification:
        notification.dismissed = True
        notification.dismissed_at = datetime.utcnow()
        return True
    return False


def clear_notifications() -> int:
    """
    Clear all notifications.

    Returns:
        Number of notifications cleared
    """
    count = len(_notifications)
    _notifications.clear()
    return count


def create_notification(
    notification_type: NotificationType,
    priority: NotificationPriority,
    message: str,
    engagement_id: str,
    engagement_name: str,
) -> Notification:
    """
    Create a new notification.

    Args:
        notification_type: Type of notification
        priority: Priority level
        message: Notification message
        engagement_id: Related engagement ID
        engagement_name: Related engagement name

    Returns:
        Created Notification object
    """
    notification = Notification(
        id=str(uuid4()),
        type=notification_type,
        priority=priority,
        message=message,
        engagement_id=engagement_id,
        engagement_name=engagement_name,
        created_at=datetime.utcnow(),
    )
    _notifications[notification.id] = notification
    return notification


def check_risk_escalations(engagements: List) -> List[Notification]:
    """
    Check for engagements that have escalated to HIGH risk.

    For POC, we check if risk_level is 'high' and create notification
    if one doesn't already exist.

    Args:
        engagements: List of Engagement objects

    Returns:
        List of new notifications created
    """
    new_notifications = []

    for eng in engagements:
        if eng.risk_level.value == "high":
            # Check if we already have a notification for this
            existing = [
                n for n in _notifications.values()
                if n.engagement_id == eng.id
                and n.type == NotificationType.RISK_ESCALATION
                and not n.dismissed
            ]

            if not existing:
                notification = create_notification(
                    notification_type=NotificationType.RISK_ESCALATION,
                    priority=NotificationPriority.HIGH,
                    message=f"{eng.entity_name} has escalated to HIGH risk. Urgent action required.",
                    engagement_id=eng.id,
                    engagement_name=eng.entity_name,
                )
                new_notifications.append(notification)

    return new_notifications


def check_deadline_approaching(engagements: List, days_threshold: int = 7) -> List[Notification]:
    """
    Check for engagements with deadline approaching within threshold.

    Args:
        engagements: List of Engagement objects
        days_threshold: Days before deadline to trigger notification

    Returns:
        List of new notifications created
    """
    new_notifications = []
    today = date.today()

    for eng in engagements:
        if eng.due_date:
            days_remaining = (eng.due_date - today).days

            if 0 < days_remaining <= days_threshold:
                # Check if we already have a notification for this
                existing = [
                    n for n in _notifications.values()
                    if n.engagement_id == eng.id
                    and n.type == NotificationType.DEADLINE_APPROACHING
                    and not n.dismissed
                ]

                if not existing:
                    notification = create_notification(
                        notification_type=NotificationType.DEADLINE_APPROACHING,
                        priority=NotificationPriority.MEDIUM if days_remaining > 3 else NotificationPriority.HIGH,
                        message=f"{eng.entity_name}: deadline in {days_remaining} day(s). Completion at {eng.completion_percent}%.",
                        engagement_id=eng.id,
                        engagement_name=eng.entity_name,
                    )
                    new_notifications.append(notification)

    return new_notifications


async def check_all_notifications(db) -> List[Notification]:
    """
    Check all notification triggers and create notifications as needed.

    Args:
        db: Database session

    Returns:
        List of new notifications created
    """
    from app.services.engagement_service import get_all_engagements

    engagements = await get_all_engagements(db)

    new_notifications = []
    new_notifications.extend(check_risk_escalations(engagements))
    new_notifications.extend(check_deadline_approaching(engagements))

    return new_notifications


def get_notification_count() -> int:
    """Get count of unread (not dismissed) notifications."""
    return len([n for n in _notifications.values() if not n.dismissed])


def get_notifications_for_eve_context() -> str:
    """
    Get notifications formatted for Eve's context.

    Returns:
        Context string for Eve's system prompt
    """
    active_notifications = get_all_notifications(include_dismissed=False)

    if not active_notifications:
        return ""

    context_lines = ["\n🔔 ACTIVE ALERTS:"]

    for n in sorted(active_notifications, key=lambda x: x.created_at, reverse=True)[:5]:
        icon = "🔴" if n.priority == NotificationPriority.HIGH else "🟠"
        context_lines.append(f"  {icon} {n.message}")

    context_lines.append(
        "\nMention these alerts to the user if they ask general questions "
        "or about engagement status."
    )

    return "\n".join(context_lines)

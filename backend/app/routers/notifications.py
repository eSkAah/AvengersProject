"""Notifications API router for Eve proactive alerts."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    NotificationDismissResponse,
    NotificationCountResponse,
)
from app.services.notification_service import (
    get_all_notifications,
    get_notification_by_id,
    dismiss_notification,
    get_notification_count,
    check_all_notifications,
)

router = APIRouter(tags=["Notifications"])


@router.get(
    "/",
    response_model=NotificationListResponse,
    summary="Get all notifications",
    description="Retrieve all notifications with optional filter for dismissed items.",
    responses={
        200: {
            "description": "Notifications retrieved successfully",
        },
    },
)
async def list_notifications(
    include_dismissed: bool = Query(
        False,
        description="Whether to include dismissed notifications",
    ),
    db: AsyncSession = Depends(get_db),
) -> NotificationListResponse:
    """
    Get all notifications.

    Args:
        include_dismissed: Include already dismissed notifications

    Returns:
        List of notifications with count
    """
    # First, check for new notifications
    await check_all_notifications(db)

    notifications = get_all_notifications(include_dismissed=include_dismissed)

    return NotificationListResponse(
        notifications=[
            NotificationResponse(
                id=n.id,
                type=n.type.value,
                priority=n.priority.value,
                message=n.message,
                engagement_id=n.engagement_id,
                engagement_name=n.engagement_name,
                created_at=n.created_at,
                dismissed=n.dismissed,
                dismissed_at=n.dismissed_at,
            )
            for n in sorted(notifications, key=lambda x: x.created_at, reverse=True)
        ],
        total=len(notifications),
        unread_count=get_notification_count(),
    )


@router.get(
    "/count",
    response_model=NotificationCountResponse,
    summary="Get notification count",
    description="Get the count of unread (not dismissed) notifications.",
    responses={
        200: {
            "description": "Count retrieved successfully",
        },
    },
)
async def get_count(
    db: AsyncSession = Depends(get_db),
) -> NotificationCountResponse:
    """
    Get the count of unread notifications.

    This endpoint is useful for badge updates on the Eve FAB button.
    """
    # Check for new notifications
    await check_all_notifications(db)

    return NotificationCountResponse(count=get_notification_count())


@router.post(
    "/{notification_id}/dismiss",
    response_model=NotificationDismissResponse,
    summary="Dismiss a notification",
    description="Mark a notification as dismissed (read).",
    responses={
        200: {
            "description": "Notification dismissed successfully",
        },
        404: {
            "description": "Notification not found",
        },
    },
)
async def dismiss(
    notification_id: str,
) -> NotificationDismissResponse:
    """
    Dismiss a notification.

    Args:
        notification_id: ID of the notification to dismiss

    Returns:
        Success status
    """
    notification = get_notification_by_id(notification_id)
    if notification is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification not found: {notification_id}",
        )

    success = dismiss_notification(notification_id)

    return NotificationDismissResponse(
        success=success,
        notification_id=notification_id,
    )


@router.post(
    "/dismiss-all",
    response_model=NotificationDismissResponse,
    summary="Dismiss all notifications",
    description="Mark all notifications as dismissed.",
    responses={
        200: {
            "description": "All notifications dismissed",
        },
    },
)
async def dismiss_all() -> NotificationDismissResponse:
    """
    Dismiss all active notifications.

    Returns:
        Success status
    """
    notifications = get_all_notifications(include_dismissed=False)

    for n in notifications:
        dismiss_notification(n.id)

    return NotificationDismissResponse(
        success=True,
        notification_id="all",
    )

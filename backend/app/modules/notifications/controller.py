"""HTTP layer for Notifications: request in -> service -> response out."""

from sqlalchemy.orm import Session

from app.dependencies import CurrentUser
from app.modules.notifications import service as notification_service
from app.modules.notifications.schema import (
    MarkReadOut,
    NotificationListOut,
    NotificationOut,
)


def list_my_notifications(
    db: Session,
    current_user: CurrentUser,
    unread_only: bool,
    skip: int,
    limit: int,
) -> NotificationListOut:
    items, total, unread = notification_service.list_notifications(
        db, user_id=current_user.id, unread_only=unread_only, skip=skip, limit=limit
    )
    return NotificationListOut(
        total=total,
        unread=unread,
        items=[NotificationOut.model_validate(n) for n in items],
    )


def mark_notification_read(
    db: Session, current_user: CurrentUser, notification_id: int
) -> MarkReadOut:
    notification = notification_service.mark_as_read(
        db, notification_id=notification_id, user_id=current_user.id
    )
    return MarkReadOut(
        message="Notification marked as read.",
        notification=NotificationOut.model_validate(notification),
    )


def get_unread_count(db: Session, current_user: CurrentUser) -> dict:
    return {"unread": notification_service.count_unread(db, user_id=current_user.id)}

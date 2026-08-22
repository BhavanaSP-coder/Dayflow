"""
Business logic for Notifications.

DESIGNED TO BE REUSED. Any module can call create_notification() - it knows
nothing about leave, payroll or reports.

    leave/service.py    ->  notification_service.create_notification(...)
    payroll/service.py  ->  notification_service.create_notification(...)
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.modules.notifications.model import Notification, NotificationType


def create_notification(
    db: Session,
    *,
    user_id: int,
    message: str,
    type: NotificationType = NotificationType.GENERAL,
    commit: bool = True,
) -> Notification:
    """Create one notification.

    commit=False is important: when Leave creates a request AND a notification,
    both must be saved together. The caller passes commit=False and commits once
    at the end, so a failure halfway leaves NO half-finished data.
    """
    notification = Notification(user_id=user_id, message=message, type=type)
    db.add(notification)

    if commit:
        db.commit()
        db.refresh(notification)
    else:
        db.flush()  # sends the INSERT so it gets an id, but doesn't finalise

    return notification


def create_notifications(
    db: Session,
    *,
    user_ids: list[int],
    message: str,
    type: NotificationType = NotificationType.GENERAL,
    commit: bool = True,
) -> list[Notification]:
    """Same as above, for several recipients (e.g. notify every HR user)."""
    created = [
        create_notification(db, user_id=uid, message=message, type=type, commit=False)
        for uid in dict.fromkeys(user_ids)  # de-duplicates, keeps order
    ]
    if commit and created:
        db.commit()
    return created


def list_notifications(
    db: Session,
    *,
    user_id: int,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Notification], int, int]:
    """Return (items, total_for_filter, unread_count) for one user."""
    conditions = [Notification.user_id == user_id]
    if unread_only:
        conditions.append(Notification.is_read.is_(False))

    total = db.scalar(select(func.count(Notification.id)).where(*conditions)) or 0
    unread = (
        db.scalar(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read.is_(False)
            )
        )
        or 0
    )

    items = (
        db.execute(
            select(Notification)
            .where(*conditions)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(items), total, unread


def mark_as_read(db: Session, *, notification_id: int, user_id: int) -> Notification:
    """Mark one notification read.

    SECURITY: the user_id is part of the lookup, so user 7 cannot mark user 8's
    notification as read - they simply get a 404.
    """
    notification = db.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )
    )
    if notification is None:
        raise NotFoundError(f"Notification {notification_id} not found.")

    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)

    return notification


def count_unread(db: Session, *, user_id: int) -> int:
    return (
        db.scalar(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.is_read.is_(False)
            )
        )
        or 0
    )

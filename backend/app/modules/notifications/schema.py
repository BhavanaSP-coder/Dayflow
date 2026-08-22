"""Pydantic schemas for the Notifications module."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.notifications.model import NotificationType


class NotificationOut(BaseModel):
    """One notification as returned by the API."""

    # from_attributes lets Pydantic read a SQLAlchemy object directly
    # (notification.id, notification.message, ...) instead of a dict.
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime


class NotificationListOut(BaseModel):
    """A page of notifications plus the counters the UI needs for a badge."""

    total: int
    unread: int
    items: list[NotificationOut]


class MarkReadOut(BaseModel):
    message: str
    notification: NotificationOut

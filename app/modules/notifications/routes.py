"""URL definitions for Notifications. Wiring only - no logic lives here."""

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies import CurrentUser, get_current_user
from app.modules.notifications import controller
from app.modules.notifications.schema import MarkReadOut, NotificationListOut

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListOut)
def list_my_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Notifications belonging to the logged-in user."""
    return controller.list_my_notifications(db, current_user, unread_only, skip, limit)


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Number for the bell badge in the UI."""
    return controller.get_unread_count(db, current_user)


@router.put("/{notification_id}/read", response_model=MarkReadOut)
def mark_read(
    notification_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Mark one of your own notifications as read."""
    return controller.mark_notification_read(db, current_user, notification_id)

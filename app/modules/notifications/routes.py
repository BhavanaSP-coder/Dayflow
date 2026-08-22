"""URL definitions for Notifications. Wiring only - no logic lives here."""

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies import CurrentUser, get_current_user
from app.modules.notifications import controller
from app.modules.notifications.schema import MarkReadOut, NotificationListOut

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("", response_model=NotificationListOut)
async def list_my_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Notifications belonging to the logged-in user."""
    return await controller.list_my_notifications(db, current_user, unread_only, skip, limit)


@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Number for the bell badge in the UI."""
    return await controller.get_unread_count(db, current_user)


@router.put("/{notification_id}/read", response_model=MarkReadOut)
async def mark_read(
    notification_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Mark one of your own notifications as read."""
    return await controller.mark_notification_read(db, current_user, notification_id)

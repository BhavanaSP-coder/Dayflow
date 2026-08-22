"""URL definitions for Leave Management."""

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies import CurrentUser, get_current_user, require_hr_admin
from app.modules.leave import controller
from app.modules.leave.model import LeaveStatus
from app.modules.leave.schema import (
    LeaveActionOut,
    LeaveCreate,
    LeaveDecision,
    LeaveListOut,
    LeaveOut,
)

router = APIRouter(prefix="/api/leaves", tags=["Leave"])


# ----------------------------- Employee ------------------------------------
@router.post("", response_model=LeaveActionOut, status_code=status.HTTP_201_CREATED)
async def apply_for_leave(
    payload: LeaveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Apply for leave. Created as PENDING."""
    return await controller.apply_for_leave(db, current_user, payload)


@router.get("/my", response_model=LeaveListOut)
async def list_my_leaves(
    status_filter: LeaveStatus | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Your own leave requests and their statuses."""
    return await controller.list_my_leaves(db, current_user, status_filter, skip, limit)


# ------------------------------ HR / Admin ---------------------------------
# NOTE: this must be declared BEFORE /{leave_id}, otherwise FastAPI would try
# to read "my" as a leave_id. Static paths first, dynamic paths after.
@router.get("", response_model=LeaveListOut)
async def list_all_leaves(
    status_filter: LeaveStatus | None = Query(None, alias="status"),
    employee_id: int | None = Query(None, ge=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(require_hr_admin),
):
    """All leave requests. HR/Admin only."""
    return await controller.list_all_leaves(db, status_filter, employee_id, skip, limit)


@router.get("/{leave_id}", response_model=LeaveOut)
async def get_leave(
    leave_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """One leave request. Employees may only open their own."""
    return await controller.get_leave(db, current_user, leave_id)


@router.put("/{leave_id}/approve", response_model=LeaveActionOut)
async def approve_leave(
    payload: LeaveDecision,
    leave_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_hr_admin),
):
    """Approve a PENDING request. HR/Admin only."""
    return await controller.approve_leave(db, current_user, leave_id, payload)


@router.put("/{leave_id}/reject", response_model=LeaveActionOut)
async def reject_leave(
    payload: LeaveDecision,
    leave_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_hr_admin),
):
    """Reject a PENDING request with a reason. HR/Admin only."""
    return await controller.reject_leave(db, current_user, leave_id, payload)

"""HTTP layer for Leave. Thin by design: no business rules here."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import CurrentUser
from app.modules.leave import service as leave_service
from app.modules.leave.model import LeaveStatus
from app.modules.leave.schema import (
    LeaveActionOut,
    LeaveCreate,
    LeaveDecision,
    LeaveListOut,
    LeaveOut,
)


async def apply_for_leave(
    db: AsyncSession, current_user: CurrentUser, payload: LeaveCreate
) -> LeaveActionOut:
    # The employee_id comes from the token, NEVER from the request body -
    # otherwise anyone could file leave in someone else's name.
    leave = await leave_service.create_leave(
        db, employee_id=current_user.id, payload=payload
    )
    return LeaveActionOut(
        message="Leave request submitted.", leave=LeaveOut.model_validate(leave)
    )


async def list_my_leaves(
    db: AsyncSession,
    current_user: CurrentUser,
    status: LeaveStatus | None,
    skip: int,
    limit: int,
) -> LeaveListOut:
    items, total = await leave_service.get_my_leaves(
        db, employee_id=current_user.id, status=status, skip=skip, limit=limit
    )
    return LeaveListOut(total=total, items=[LeaveOut.model_validate(i) for i in items])


async def get_leave(db: AsyncSession, current_user: CurrentUser, leave_id: int) -> LeaveOut:
    leave = await leave_service.get_leave_for_user(
        db, leave_id=leave_id, current_user=current_user
    )
    return LeaveOut.model_validate(leave)


async def list_all_leaves(
    db: AsyncSession,
    status: LeaveStatus | None,
    employee_id: int | None,
    skip: int,
    limit: int,
) -> LeaveListOut:
    items, total = await leave_service.list_all_leaves(
        db, status=status, employee_id=employee_id, skip=skip, limit=limit
    )
    return LeaveListOut(total=total, items=[LeaveOut.model_validate(i) for i in items])


async def approve_leave(
    db: AsyncSession, current_user: CurrentUser, leave_id: int, payload: LeaveDecision
) -> LeaveActionOut:
    leave = await leave_service.approve_leave(
        db, leave_id=leave_id, reviewer=current_user, admin_comment=payload.admin_comment
    )
    return LeaveActionOut(
        message="Leave request approved.", leave=LeaveOut.model_validate(leave)
    )


async def reject_leave(
    db: AsyncSession, current_user: CurrentUser, leave_id: int, payload: LeaveDecision
) -> LeaveActionOut:
    leave = await leave_service.reject_leave(
        db, leave_id=leave_id, reviewer=current_user, admin_comment=payload.admin_comment
    )
    return LeaveActionOut(
        message="Leave request rejected.", leave=LeaveOut.model_validate(leave)
    )

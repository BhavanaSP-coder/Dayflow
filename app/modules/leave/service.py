"""
Business logic for Leave Management.

This file holds every rule. If a rule is wrong, you fix it here - not in
routes.py, not in the frontend.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser
from app.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.modules.leave.model import LeaveRequest, LeaveStatus
from app.modules.leave.schema import LeaveCreate
from app.modules.notifications import service as notification_service
from app.modules.notifications.model import NotificationType

# Business rule: reject absurdly long requests early.
MAX_LEAVE_DAYS = 90


# ---------------------------------------------------------------------------
# INTEGRATION POINTS WITH PERSON 1 (both are the only stubs in this module)
# ---------------------------------------------------------------------------
def _user_id_for_employee(db: Session, employee_id: int) -> int:
    """Notifications are addressed to a USER id, but leave rows store an
    EMPLOYEE id. Person 1's employee table holds the link between them.

    TODO (Person 1): replace with a real lookup, e.g.
        from app.modules.employee.model import Employee
        return db.scalar(select(Employee.user_id).where(Employee.id == employee_id))
    """
    return employee_id  # assumes user_id == employee_id until then


def _hr_user_ids(db: Session) -> list[int]:
    """Everyone who should be told when a new leave request arrives.

    TODO (Person 1): replace with a real query, e.g.
        from app.modules.auth.model import User
        return list(db.scalars(select(User.id).where(User.role.in_(["HR", "ADMIN"]))))
    """
    return []  # returns nothing today, so no notification is sent to HR yet


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _validate_dates(start_date: date, end_date: date) -> None:
    if start_date > end_date:
        raise ValidationError("start_date cannot be after end_date.")

    total_days = (end_date - start_date).days + 1
    if total_days > MAX_LEAVE_DAYS:
        raise ValidationError(
            f"Leave cannot exceed {MAX_LEAVE_DAYS} days (requested {total_days})."
        )

    if start_date < date.today():
        raise ValidationError("Cannot apply for leave that starts in the past.")


def _assert_no_overlap(
    db: Session, employee_id: int, start_date: date, end_date: date
) -> None:
    """Two ranges overlap when A starts before B ends AND A ends after B starts.

    Only PENDING and APPROVED rows block a new request - a REJECTED one
    should not stop you re-applying for the same dates.
    """
    clash = db.scalar(
        select(LeaveRequest.id).where(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
    )
    if clash is not None:
        raise ConflictError(
            f"These dates overlap an existing leave request (id {clash})."
        )


def _get_or_404(db: Session, leave_id: int) -> LeaveRequest:
    leave = db.get(LeaveRequest, leave_id)
    if leave is None:
        raise NotFoundError(f"Leave request {leave_id} not found.")
    return leave


# ---------------------------------------------------------------------------
# Employee actions
# ---------------------------------------------------------------------------
def create_leave(
    db: Session, *, employee_id: int, payload: LeaveCreate
) -> LeaveRequest:
    """Apply for leave. Always starts as PENDING."""
    # Pydantic has already guaranteed leave_type is a valid LeaveType member,
    # so there is nothing left to check here.
    _validate_dates(payload.start_date, payload.end_date)
    _assert_no_overlap(db, employee_id, payload.start_date, payload.end_date)

    leave = LeaveRequest(
        employee_id=employee_id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        remarks=payload.remarks,
        status=LeaveStatus.PENDING,
    )
    db.add(leave)
    db.flush()  # assigns leave.id without committing yet

    # Tell HR. commit=False so the leave row and the notifications are saved
    # in ONE transaction - all of it, or none of it.
    hr_ids = _hr_user_ids(db)
    if hr_ids:
        notification_service.create_notifications(
            db,
            user_ids=hr_ids,
            message=(
                f"New {leave.leave_type.value} leave request from employee "
                f"{employee_id} ({leave.start_date} to {leave.end_date})."
            ),
            type=NotificationType.LEAVE_SUBMITTED,
            commit=False,
        )

    db.commit()
    db.refresh(leave)
    return leave


def get_my_leaves(
    db: Session,
    *,
    employee_id: int,
    status: LeaveStatus | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[LeaveRequest], int]:
    conditions = [LeaveRequest.employee_id == employee_id]
    if status is not None:
        conditions.append(LeaveRequest.status == status)

    total = db.scalar(select(func.count(LeaveRequest.id)).where(*conditions)) or 0
    items = (
        db.execute(
            select(LeaveRequest)
            .where(*conditions)
            .order_by(LeaveRequest.created_at.desc(), LeaveRequest.id.desc())
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(items), total


def get_leave_for_user(
    db: Session, *, leave_id: int, current_user: CurrentUser
) -> LeaveRequest:
    """One leave request, with an ownership check.

    An employee may only open their own; HR/Admin may open anyone's.
    """
    leave = _get_or_404(db, leave_id)

    if not current_user.is_hr_or_admin and leave.employee_id != current_user.employee_id:
        raise ForbiddenError("You can only view your own leave requests.")

    return leave


# ---------------------------------------------------------------------------
# HR / Admin actions
# ---------------------------------------------------------------------------
def list_all_leaves(
    db: Session,
    *,
    status: LeaveStatus | None = None,
    employee_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[LeaveRequest], int]:
    conditions = []
    if status is not None:
        conditions.append(LeaveRequest.status == status)
    if employee_id is not None:
        conditions.append(LeaveRequest.employee_id == employee_id)

    total = db.scalar(select(func.count(LeaveRequest.id)).where(*conditions)) or 0
    items = (
        db.execute(
            select(LeaveRequest)
            .where(*conditions)
            .order_by(LeaveRequest.created_at.desc(), LeaveRequest.id.desc())
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(items), total


def _decide(
    db: Session,
    *,
    leave_id: int,
    reviewer: CurrentUser,
    new_status: LeaveStatus,
    admin_comment: str | None,
) -> LeaveRequest:
    """Shared approve/reject logic - written once, used twice."""
    leave = _get_or_404(db, leave_id)

    if leave.status is not LeaveStatus.PENDING:
        raise ConflictError(
            f"Leave request {leave_id} is already {leave.status.value.lower()}."
        )

    if leave.employee_id == reviewer.employee_id:
        raise ForbiddenError("You cannot approve or reject your own leave request.")

    leave.status = new_status
    leave.admin_comment = admin_comment
    leave.reviewed_by = reviewer.id

    verb = "approved" if new_status is LeaveStatus.APPROVED else "rejected"
    notification_type = (
        NotificationType.LEAVE_APPROVED
        if new_status is LeaveStatus.APPROVED
        else NotificationType.LEAVE_REJECTED
    )
    message = (
        f"Your {leave.leave_type.value} leave ({leave.start_date} to "
        f"{leave.end_date}) was {verb}."
    )
    if admin_comment:
        message += f" Comment: {admin_comment}"

    notification_service.create_notification(
        db,
        user_id=_user_id_for_employee(db, leave.employee_id),
        message=message,
        type=notification_type,
        commit=False,
    )

    db.commit()
    db.refresh(leave)
    return leave


def approve_leave(
    db: Session, *, leave_id: int, reviewer: CurrentUser, admin_comment: str | None
) -> LeaveRequest:
    return _decide(
        db,
        leave_id=leave_id,
        reviewer=reviewer,
        new_status=LeaveStatus.APPROVED,
        admin_comment=admin_comment,
    )


def reject_leave(
    db: Session, *, leave_id: int, reviewer: CurrentUser, admin_comment: str | None
) -> LeaveRequest:
    if not admin_comment or not admin_comment.strip():
        raise ValidationError("A reason (admin_comment) is required when rejecting.")

    return _decide(
        db,
        leave_id=leave_id,
        reviewer=reviewer,
        new_status=LeaveStatus.REJECTED,
        admin_comment=admin_comment,
    )

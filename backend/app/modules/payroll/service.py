"""
Business logic for Payroll.

Core rule:  net_salary = basic_salary + allowances - deductions
Core security rule: an employee can READ their own payroll and nothing else.
"""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser
from app.exceptions import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.modules.notifications import service as notification_service
from app.modules.notifications.model import NotificationType
from app.modules.payroll.model import Payroll
from app.modules.payroll.schema import PayrollUpsert


def _calculate_net(basic: Decimal, allowances: Decimal, deductions: Decimal) -> Decimal:
    net = basic + allowances - deductions
    if net < 0:
        raise ValidationError(
            "Deductions cannot be larger than basic salary plus allowances."
        )
    return net.quantize(Decimal("0.01"))  # always exactly 2 decimal places


def _user_id_for_employee(db: Session, employee_id: int) -> int:
    """Same integration stub as in leave/service.py - see the TODO there."""
    return employee_id


def get_payroll_for_employee(
    db: Session,
    *,
    employee_id: int,
    month: int | None = None,
    year: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Payroll], int]:
    """Payroll history for one employee, newest period first."""
    conditions = [Payroll.employee_id == employee_id]
    if month is not None:
        conditions.append(Payroll.month == month)
    if year is not None:
        conditions.append(Payroll.year == year)

    total = db.scalar(select(func.count(Payroll.id)).where(*conditions)) or 0
    items = (
        db.execute(
            select(Payroll)
            .where(*conditions)
            .order_by(Payroll.year.desc(), Payroll.month.desc())
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(items), total


def get_payroll_as_user(
    db: Session,
    *,
    employee_id: int,
    current_user: CurrentUser,
    month: int | None = None,
    year: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Payroll], int]:
    """Read another employee's payroll - HR/Admin only.

    This check lives in the service as well as the route on purpose:
    defence in depth. Even if a route is wired up wrongly one day, the
    rule still holds.
    """
    if not current_user.is_hr_or_admin and employee_id != current_user.employee_id:
        raise ForbiddenError("You can only view your own payroll.")

    return get_payroll_for_employee(
        db, employee_id=employee_id, month=month, year=year, skip=skip, limit=limit
    )


def list_all_payroll(
    db: Session,
    *,
    month: int | None = None,
    year: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Payroll], int]:
    """Every payroll record. HR/Admin only (enforced at the route)."""
    conditions = []
    if month is not None:
        conditions.append(Payroll.month == month)
    if year is not None:
        conditions.append(Payroll.year == year)

    total = db.scalar(select(func.count(Payroll.id)).where(*conditions)) or 0
    items = (
        db.execute(
            select(Payroll)
            .where(*conditions)
            .order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.employee_id)
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(items), total


def upsert_payroll(
    db: Session, *, employee_id: int, payload: PayrollUpsert, actor: CurrentUser
) -> tuple[Payroll, bool]:
    """Create or update the payroll row for one employee + month + year.

    Returns (record, created) where `created` tells the controller whether to
    answer 201 (new) or 200 (updated).

    An employee can never reach this: the route requires HR/Admin, and this
    extra check stops the case where HR edits their own salary.
    """
    if not actor.is_hr_or_admin:
        raise ForbiddenError("Only HR or Admin can modify payroll.")

    if actor.employee_id == employee_id:
        raise ForbiddenError("You cannot modify your own payroll record.")

    net = _calculate_net(payload.basic_salary, payload.allowances, payload.deductions)

    # "Look, then insert" is not atomic: two HR users saving the same period at
    # the same moment would both see "no row" and both INSERT, and the second
    # one hits the UNIQUE(employee_id, month, year) constraint. So we catch
    # that, roll back, and go round again - the second attempt now finds the
    # row the other request created and UPDATEs it instead.
    for attempt in (1, 2):
        record = db.scalar(
            select(Payroll).where(
                Payroll.employee_id == employee_id,
                Payroll.month == payload.month,
                Payroll.year == payload.year,
            )
        )
        created = record is None

        try:
            if created:
                record = Payroll(
                    employee_id=employee_id,
                    basic_salary=payload.basic_salary,
                    allowances=payload.allowances,
                    deductions=payload.deductions,
                    net_salary=net,
                    month=payload.month,
                    year=payload.year,
                )
                db.add(record)
            else:
                record.basic_salary = payload.basic_salary
                record.allowances = payload.allowances
                record.deductions = payload.deductions
                record.net_salary = net

            db.flush()

            notification_service.create_notification(
                db,
                user_id=_user_id_for_employee(db, employee_id),
                message=(
                    f"Your payroll for {payload.month:02d}/{payload.year} was "
                    f"updated. Net salary: {net}."
                ),
                type=NotificationType.PAYROLL_UPDATED,
                commit=False,
            )

            db.commit()
        except IntegrityError:
            db.rollback()
            if attempt == 2:
                raise ConflictError(
                    "Payroll for this employee and period is being modified by "
                    "another request. Please try again."
                )
            continue

        db.refresh(record)
        return record, created


def get_payroll_record(db: Session, *, payroll_id: int) -> Payroll:
    record = db.get(Payroll, payroll_id)
    if record is None:
        raise NotFoundError(f"Payroll record {payroll_id} not found.")
    return record

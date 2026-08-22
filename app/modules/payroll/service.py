"""
Business logic for Payroll.

Core rule:  net_salary = basic_salary + allowances - deductions
Core security rule: an employee can READ their own payroll and nothing else.
"""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import CurrentUser, is_hr_or_admin
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


async def _user_id_for_employee(db: AsyncSession, employee_id: int) -> int:
    """An Employee row is the user account, so the PK serves both roles.
    See the matching helper in leave/service.py."""
    return employee_id


async def get_payroll_for_employee(
    db: AsyncSession,
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

    total = await db.scalar(select(func.count(Payroll.id)).where(*conditions)) or 0
    result = await db.execute(
            select(Payroll)
            .where(*conditions)
            .order_by(Payroll.year.desc(), Payroll.month.desc())
            .offset(skip)
            .limit(limit)
    )
    items = list(result.scalars().all())
    return list(items), total


async def get_payroll_as_user(
    db: AsyncSession,
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
    if not is_hr_or_admin(current_user) and employee_id != current_user.id:
        raise ForbiddenError("You can only view your own payroll.")

    return await get_payroll_for_employee(
        db, employee_id=employee_id, month=month, year=year, skip=skip, limit=limit
    )


async def list_all_payroll(
    db: AsyncSession,
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

    total = await db.scalar(select(func.count(Payroll.id)).where(*conditions)) or 0
    result = await db.execute(
            select(Payroll)
            .where(*conditions)
            .order_by(Payroll.year.desc(), Payroll.month.desc(), Payroll.employee_id)
            .offset(skip)
            .limit(limit)
    )
    items = list(result.scalars().all())
    return list(items), total


async def upsert_payroll(
    db: AsyncSession, *, employee_id: int, payload: PayrollUpsert, actor: CurrentUser
) -> tuple[Payroll, bool]:
    """Create or update the payroll row for one employee + month + year.

    Returns (record, created) where `created` tells the controller whether to
    answer 201 (new) or 200 (updated).

    An employee can never reach this: the route requires HR/Admin, and this
    extra check stops the case where HR edits their own salary.
    """
    if not is_hr_or_admin(actor):
        raise ForbiddenError("Only HR or Admin can modify payroll.")

    if actor.id == employee_id:
        raise ForbiddenError("You cannot modify your own payroll record.")

    net = _calculate_net(payload.basic_salary, payload.allowances, payload.deductions)

    # "Look, then insert" is not atomic: two HR users saving the same period at
    # the same moment would both see "no row" and both INSERT, and the second
    # one hits the UNIQUE(employee_id, month, year) constraint. So we catch
    # that, roll back, and go round again - the second attempt now finds the
    # row the other request created and UPDATEs it instead.
    for attempt in (1, 2):
        record = await db.scalar(
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

            await db.flush()

            await notification_service.create_notification(
                db,
                user_id=await _user_id_for_employee(db, employee_id),
                message=(
                    f"Your payroll for {payload.month:02d}/{payload.year} was "
                    f"updated. Net salary: {net}."
                ),
                type=NotificationType.PAYROLL_UPDATED,
                commit=False,
            )

            await db.commit()
        except IntegrityError:
            await db.rollback()
            if attempt == 2:
                raise ConflictError(
                    "Payroll for this employee and period is being modified by "
                    "another request. Please try again."
                )
            continue

        await db.refresh(record)
        return record, created


async def get_payroll_record(db: AsyncSession, *, payroll_id: int) -> Payroll:
    record = await db.get(Payroll, payroll_id)
    if record is None:
        raise NotFoundError(f"Payroll record {payroll_id} not found.")
    return record

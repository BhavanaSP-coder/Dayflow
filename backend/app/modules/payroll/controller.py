"""HTTP layer for Payroll."""

from sqlalchemy.orm import Session

from app.dependencies import CurrentUser
from app.modules.payroll import service as payroll_service
from app.modules.payroll.schema import (
    PayrollActionOut,
    PayrollListOut,
    PayrollOut,
    PayrollUpsert,
)


def _to_list_out(items, total: int) -> PayrollListOut:
    return PayrollListOut(
        total=total, items=[PayrollOut.model_validate(i) for i in items]
    )


def get_my_payroll(
    db: Session,
    current_user: CurrentUser,
    month: int | None,
    year: int | None,
    skip: int,
    limit: int,
) -> PayrollListOut:
    items, total = payroll_service.get_payroll_for_employee(
        db,
        employee_id=current_user.employee_id,
        month=month,
        year=year,
        skip=skip,
        limit=limit,
    )
    return _to_list_out(items, total)


def list_all_payroll(
    db: Session, month: int | None, year: int | None, skip: int, limit: int
) -> PayrollListOut:
    items, total = payroll_service.list_all_payroll(
        db, month=month, year=year, skip=skip, limit=limit
    )
    return _to_list_out(items, total)


def get_employee_payroll(
    db: Session,
    current_user: CurrentUser,
    employee_id: int,
    month: int | None,
    year: int | None,
    skip: int,
    limit: int,
) -> PayrollListOut:
    items, total = payroll_service.get_payroll_as_user(
        db,
        employee_id=employee_id,
        current_user=current_user,
        month=month,
        year=year,
        skip=skip,
        limit=limit,
    )
    return _to_list_out(items, total)


def upsert_payroll(
    db: Session, current_user: CurrentUser, employee_id: int, payload: PayrollUpsert
) -> tuple[PayrollActionOut, bool]:
    record, created = payroll_service.upsert_payroll(
        db, employee_id=employee_id, payload=payload, actor=current_user
    )
    message = "Payroll record created." if created else "Payroll record updated."
    return (
        PayrollActionOut(message=message, payroll=PayrollOut.model_validate(record)),
        created,
    )

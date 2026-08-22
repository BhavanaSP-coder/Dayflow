"""HTTP layer for Reports. Pure pass-through: the service does the work."""

from sqlalchemy.orm import Session

from app.modules.reports import service as reports_service
from app.modules.reports.schema import (
    EmployeeReportOut,
    LeaveReportOut,
    PayrollReportOut,
)


def leave_report(
    db: Session, year: int | None, employee_id: int | None
) -> LeaveReportOut:
    return reports_service.leave_report(db, year=year, employee_id=employee_id)


def payroll_report(db: Session, month: int | None, year: int | None) -> PayrollReportOut:
    return reports_service.payroll_report(db, month=month, year=year)


def employee_report(db: Session) -> EmployeeReportOut:
    return reports_service.employee_report(db)


def attendance_report(db: Session, month: int | None, year: int | None):
    return reports_service.attendance_report(db, month=month, year=year)

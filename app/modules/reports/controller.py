"""HTTP layer for Reports. Pure pass-through: the service does the work."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.reports import service as reports_service
from app.modules.reports.schema import (
    EmployeeReportOut,
    LeaveReportOut,
    PayrollReportOut,
)


async def leave_report(
    db: AsyncSession, year: int | None, employee_id: int | None
) -> LeaveReportOut:
    return await reports_service.leave_report(db, year=year, employee_id=employee_id)


async def payroll_report(db: AsyncSession, month: int | None, year: int | None) -> PayrollReportOut:
    return await reports_service.payroll_report(db, month=month, year=year)


async def employee_report(db: AsyncSession) -> EmployeeReportOut:
    return await reports_service.employee_report(db)


async def attendance_report(db: AsyncSession, month: int | None, year: int | None):
    return await reports_service.attendance_report(db, month=month, year=year)

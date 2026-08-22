"""URL definitions for Reports. Every endpoint is HR/Admin only."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies import require_hr_admin
from app.modules.reports import controller
from app.modules.reports.schema import (
    AttendanceReportOut,
    EmployeeReportOut,
    LeaveReportOut,
    PayrollReportOut,
)

# One dependency on the router applies the HR/Admin guard to EVERY route
# below, so no endpoint can accidentally be left unprotected.
router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    dependencies=[Depends(require_hr_admin)],
)


@router.get("/leave", response_model=LeaveReportOut)
async def leave_report(
    year: int | None = Query(None, ge=2000, le=2100),
    employee_id: int | None = Query(None, ge=1),
    db: AsyncSession = Depends(get_db),
):
    """Leave statistics: pending/approved/rejected, by type, approval rate."""
    return await controller.leave_report(db, year, employee_id)


@router.get("/payroll", response_model=PayrollReportOut)
async def payroll_report(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
):
    """Payroll summary: totals, average, highest/lowest, per month."""
    return await controller.payroll_report(db, month, year)


@router.get("/employees", response_model=EmployeeReportOut)
async def employee_report(db: AsyncSession = Depends(get_db)):
    """Employee counts (limited until Person 1's employee module lands)."""
    return await controller.employee_report(db)


@router.get("/attendance", response_model=AttendanceReportOut)
async def attendance_report(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
):
    """Attendance summary. Returns 503 until Person 1's module is integrated."""
    return await controller.attendance_report(db, month, year)

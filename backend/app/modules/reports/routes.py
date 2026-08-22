"""URL definitions for Reports. Every endpoint is HR/Admin only."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
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
def leave_report(
    year: int | None = Query(None, ge=2000, le=2100),
    employee_id: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
):
    """Leave statistics: pending/approved/rejected, by type, approval rate."""
    return controller.leave_report(db, year, employee_id)


@router.get("/payroll", response_model=PayrollReportOut)
def payroll_report(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    """Payroll summary: totals, average, highest/lowest, per month."""
    return controller.payroll_report(db, month, year)


@router.get("/employees", response_model=EmployeeReportOut)
def employee_report(db: Session = Depends(get_db)):
    """Employee counts (limited until Person 1's employee module lands)."""
    return controller.employee_report(db)


@router.get("/attendance", response_model=AttendanceReportOut)
def attendance_report(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    db: Session = Depends(get_db),
):
    """Attendance summary. Returns 503 until Person 1's module is integrated."""
    return controller.attendance_report(db, month, year)

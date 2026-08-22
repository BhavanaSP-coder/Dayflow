"""
Aggregation logic for Reports.

Everything here is SELECT ... COUNT / SUM / GROUP BY. The database does the
arithmetic - we never pull thousands of rows into Python to add them up.
"""

from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.exceptions import NotIntegratedError
from app.modules.leave.model import LeaveRequest, LeaveStatus
from app.modules.payroll.model import Payroll
from app.modules.reports.schema import (
    EmployeeReportOut,
    LeaveReportOut,
    PayrollReportOut,
)

ZERO = Decimal("0.00")


def _count_if(condition) -> object:
    """SQL: SUM(CASE WHEN <condition> THEN 1 ELSE 0 END).

    One trip to the database gives every status count at once, instead of
    running a separate COUNT query per status.
    """
    return func.coalesce(func.sum(case((condition, 1), else_=0)), 0)


def leave_report(
    db: Session, *, year: int | None = None, employee_id: int | None = None
) -> LeaveReportOut:
    conditions = []
    if year is not None:
        conditions.append(func.extract("year", LeaveRequest.start_date) == year)
    if employee_id is not None:
        conditions.append(LeaveRequest.employee_id == employee_id)

    row = db.execute(
        select(
            func.count(LeaveRequest.id),
            _count_if(LeaveRequest.status == LeaveStatus.PENDING),
            _count_if(LeaveRequest.status == LeaveStatus.APPROVED),
            _count_if(LeaveRequest.status == LeaveStatus.REJECTED),
            func.count(func.distinct(LeaveRequest.employee_id)),
        ).where(*conditions)
    ).one()

    total, pending, approved, rejected, employees = row
    decided = approved + rejected
    approval_rate = round((approved / decided) * 100, 2) if decided else 0.0

    # Inclusive day count of approved leave: (end - start) + 1 per row.
    days_expr = func.sum(
        (
            func.julianday(LeaveRequest.end_date)
            - func.julianday(LeaveRequest.start_date)
            + 1
        )
        if db.get_bind().dialect.name == "sqlite"
        else (func.datediff(LeaveRequest.end_date, LeaveRequest.start_date) + 1)
    )
    total_days = (
        db.scalar(
            select(func.coalesce(days_expr, 0)).where(
                LeaveRequest.status == LeaveStatus.APPROVED, *conditions
            )
        )
        or 0
    )

    by_type_rows = db.execute(
        select(LeaveRequest.leave_type, func.count(LeaveRequest.id))
        .where(*conditions)
        .group_by(LeaveRequest.leave_type)
    ).all()

    return LeaveReportOut(
        total_requests=int(total),
        pending=int(pending),
        approved=int(approved),
        rejected=int(rejected),
        approval_rate=approval_rate,
        total_days_approved=int(total_days),
        by_type={t.value: int(c) for t, c in by_type_rows},
        employees_with_leave=int(employees),
    )


def payroll_report(
    db: Session, *, month: int | None = None, year: int | None = None
) -> PayrollReportOut:
    conditions = []
    if month is not None:
        conditions.append(Payroll.month == month)
    if year is not None:
        conditions.append(Payroll.year == year)

    row = db.execute(
        select(
            func.count(Payroll.id),
            func.count(func.distinct(Payroll.employee_id)),
            func.coalesce(func.sum(Payroll.net_salary), ZERO),
            func.coalesce(func.sum(Payroll.basic_salary), ZERO),
            func.coalesce(func.sum(Payroll.allowances), ZERO),
            func.coalesce(func.sum(Payroll.deductions), ZERO),
            func.coalesce(func.avg(Payroll.net_salary), ZERO),
            func.coalesce(func.max(Payroll.net_salary), ZERO),
            func.coalesce(func.min(Payroll.net_salary), ZERO),
        ).where(*conditions)
    ).one()

    (records, employees, net, basic, allow, deduct, avg, high, low) = row

    period_rows = db.execute(
        select(
            Payroll.year,
            Payroll.month,
            func.coalesce(func.sum(Payroll.net_salary), ZERO),
        )
        .where(*conditions)
        .group_by(Payroll.year, Payroll.month)
        .order_by(Payroll.year.desc(), Payroll.month.desc())
    ).all()

    def _money(value) -> Decimal:
        return Decimal(str(value or 0)).quantize(Decimal("0.01"))

    return PayrollReportOut(
        records=int(records),
        employees_paid=int(employees),
        total_net_salary=_money(net),
        total_basic_salary=_money(basic),
        total_allowances=_money(allow),
        total_deductions=_money(deduct),
        average_net_salary=_money(avg),
        highest_net_salary=_money(high),
        lowest_net_salary=_money(low),
        by_period={f"{y}-{m:02d}": _money(s) for y, m, s in period_rows},
    )


def employee_report(db: Session) -> EmployeeReportOut:
    """Employee statistics.

    Right now these are derived from YOUR tables only. Once Person 1's
    employee table exists, add headcount and per-department counts here:

        from app.modules.employee.model import Employee
        total = db.scalar(select(func.count(Employee.id)))
        by_dept = db.execute(
            select(Employee.department, func.count(Employee.id))
            .group_by(Employee.department)
        ).all()
    """
    with_payroll = (
        db.scalar(select(func.count(func.distinct(Payroll.employee_id)))) or 0
    )
    with_leave = (
        db.scalar(select(func.count(func.distinct(LeaveRequest.employee_id)))) or 0
    )

    seen = db.scalar(
        select(func.count()).select_from(
            select(Payroll.employee_id)
            .union(select(LeaveRequest.employee_id))
            .subquery()
        )
    ) or 0

    return EmployeeReportOut(
        source="derived from payroll + leave tables (employee module not yet integrated)",
        employees_with_payroll=int(with_payroll),
        employees_with_leave=int(with_leave),
        distinct_employees_seen=int(seen),
    )


def attendance_report(db: Session, *, month: int | None, year: int | None):
    """Attendance belongs to Person 1 and is not merged yet.

    Returning a clear 503 is more honest than inventing fake numbers.

    TO IMPLEMENT once their model exists:
        from app.modules.attendance.model import Attendance, AttendanceStatus
        row = db.execute(
            select(
                func.count(Attendance.id),
                _count_if(Attendance.status == AttendanceStatus.PRESENT),
                _count_if(Attendance.status == AttendanceStatus.ABSENT),
                _count_if(Attendance.status == AttendanceStatus.LATE),
            )
        ).one()
    """
    raise NotIntegratedError(
        "Attendance reporting needs Person 1's attendance module, "
        "which is not connected yet."
    )

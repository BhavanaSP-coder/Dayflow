"""
Aggregation logic for Reports.

Everything here is SELECT ... COUNT / SUM / GROUP BY. The database does the
arithmetic - we never pull thousands of rows into Python to add them up.
"""

from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import engine
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.modules.leave.model import LeaveRequest, LeaveStatus
from app.modules.payroll.model import Payroll
from app.modules.reports.schema import (
    AttendanceReportOut,
    EmployeeReportOut,
    LeaveReportOut,
    PayrollReportOut,
)

ZERO = Decimal("0.00")


def _inclusive_days():
    """(end_date - start_date) + 1, written for whichever database is attached.

    PostgreSQL subtracts two dates into an integer day count directly; SQLite
    needs julianday(); MySQL needs DATEDIFF(). The dialect is read from the
    engine rather than the session so this works on sync and async alike.
    """
    dialect = engine.dialect.name
    if dialect == "sqlite":
        return (
            func.julianday(LeaveRequest.end_date)
            - func.julianday(LeaveRequest.start_date)
            + 1
        )
    if dialect == "mysql":
        return func.datediff(LeaveRequest.end_date, LeaveRequest.start_date) + 1
    # postgresql and anything else ANSI-ish
    return LeaveRequest.end_date - LeaveRequest.start_date + 1


def _count_if(condition) -> object:
    """SQL: SUM(CASE WHEN <condition> THEN 1 ELSE 0 END).

    One trip to the database gives every status count at once, instead of
    running a separate COUNT query per status.
    """
    return func.coalesce(func.sum(case((condition, 1), else_=0)), 0)


async def leave_report(
    db: AsyncSession, *, year: int | None = None, employee_id: int | None = None
) -> LeaveReportOut:
    conditions = []
    if year is not None:
        conditions.append(func.extract("year", LeaveRequest.start_date) == year)
    if employee_id is not None:
        conditions.append(LeaveRequest.employee_id == employee_id)

    row = (
        await db.execute(
        select(
            func.count(LeaveRequest.id),
            _count_if(LeaveRequest.status == LeaveStatus.PENDING),
            _count_if(LeaveRequest.status == LeaveStatus.APPROVED),
            _count_if(LeaveRequest.status == LeaveStatus.REJECTED),
            func.count(func.distinct(LeaveRequest.employee_id)),
        ).where(*conditions)
    )
    ).one()

    total, pending, approved, rejected, employees = row
    decided = approved + rejected
    approval_rate = round((approved / decided) * 100, 2) if decided else 0.0

    days_expr = func.sum(_inclusive_days())
    total_days = (
        await db.scalar(
            select(func.coalesce(days_expr, 0)).where(
                LeaveRequest.status == LeaveStatus.APPROVED, *conditions
            )
        )
        or 0
    )

    by_type_rows = (
        await db.execute(
        select(LeaveRequest.leave_type, func.count(LeaveRequest.id))
        .where(*conditions)
        .group_by(LeaveRequest.leave_type)
    )
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


async def payroll_report(
    db: AsyncSession, *, month: int | None = None, year: int | None = None
) -> PayrollReportOut:
    conditions = []
    if month is not None:
        conditions.append(Payroll.month == month)
    if year is not None:
        conditions.append(Payroll.year == year)

    row = (
        await db.execute(
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
    )
    ).one()

    (records, employees, net, basic, allow, deduct, avg, high, low) = row

    period_rows = (
        await db.execute(
        select(
            Payroll.year,
            Payroll.month,
            func.coalesce(func.sum(Payroll.net_salary), ZERO),
        )
        .where(*conditions)
        .group_by(Payroll.year, Payroll.month)
        .order_by(Payroll.year.desc(), Payroll.month.desc())
    )
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


async def employee_report(db: AsyncSession) -> EmployeeReportOut:
    """Headcount and department split, straight from the employees table."""
    row = (
        await db.execute(
            select(
                func.count(Employee.id),
                _count_if(Employee.is_active.is_(True)),
            )
        )
    ).one()
    headcount, active = row

    dept_rows = (
        await db.execute(
            select(Employee.department, func.count(Employee.id))
            .group_by(Employee.department)
            .order_by(func.count(Employee.id).desc())
        )
    ).all()

    with_payroll = (
        await db.scalar(select(func.count(func.distinct(Payroll.employee_id)))) or 0
    )
    with_leave = (
        await db.scalar(select(func.count(func.distinct(LeaveRequest.employee_id)))) or 0
    )

    return EmployeeReportOut(
        headcount=int(headcount),
        active=int(active),
        inactive=int(headcount) - int(active),
        by_department={(d or "Unassigned"): int(c) for d, c in dept_rows},
        employees_with_payroll=int(with_payroll),
        employees_with_leave=int(with_leave),
    )


async def attendance_report(
    db: AsyncSession, *, month: int | None, year: int | None
) -> AttendanceReportOut:
    """Attendance summary over the attendances table.

    Was a 503 stub while the attendance module lived in a separate branch;
    it reads the real table now.
    """
    conditions = []
    if month is not None:
        conditions.append(func.extract("month", Attendance.record_date) == month)
    if year is not None:
        conditions.append(func.extract("year", Attendance.record_date) == year)

    row = (
        await db.execute(
            select(
                func.count(Attendance.id),
                _count_if(Attendance.status == AttendanceStatus.PRESENT),
                _count_if(Attendance.status == AttendanceStatus.ABSENT),
                _count_if(Attendance.status == AttendanceStatus.HALF_DAY),
                _count_if(Attendance.status == AttendanceStatus.LEAVE),
                func.count(func.distinct(Attendance.employee_id)),
            ).where(*conditions)
        )
    ).one()

    total, present, absent, half_day, on_leave, employees = row
    total = int(total)

    # Half-days count as half a day present, which is what HR expects to see.
    credited = int(present) + (int(half_day) / 2)
    rate = round((credited / total) * 100, 1) if total else 0.0

    return AttendanceReportOut(
        total_records=total,
        present=int(present),
        absent=int(absent),
        half_day=int(half_day),
        leave=int(on_leave),
        employees_tracked=int(employees),
        attendance_rate=rate,
    )

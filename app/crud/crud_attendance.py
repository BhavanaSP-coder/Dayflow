from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.time_utils import business_today, now_utc
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.attendance import CheckInRequest, CheckOutRequest


async def get_today_attendance(db: AsyncSession, employee_id: int, today: date) -> Attendance | None:
    query = select(Attendance).where(
        Attendance.employee_id == employee_id,
        Attendance.record_date == today
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_open_attendance(
    db: AsyncSession, employee_id: int, max_age_days: int = 1
) -> Attendance | None:
    """Most recent shift that was checked into but never checked out.

    A shift starting at 22:00 and ending at 02:00 spans two local dates, so
    check-out cannot assume the row is dated today. Rows older than
    `max_age_days` are ignored so a forgotten check-out from last week is not
    closed by today's tap.
    """
    earliest = business_today() - timedelta(days=max_age_days)
    query = (
        select(Attendance)
        .where(
            Attendance.employee_id == employee_id,
            Attendance.check_in.is_not(None),
            Attendance.check_out.is_(None),
            Attendance.record_date >= earliest,
        )
        .order_by(Attendance.record_date.desc())
        .limit(1)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def check_in_employee(db: AsyncSession, employee_id: int, data: CheckInRequest) -> Attendance:
    today = business_today()

    # A row may already exist for today (e.g. marked absent/leave ahead of time).
    # Reuse it instead of inserting a second row for the same employee and date.
    attendance = await get_today_attendance(db, employee_id, today)
    if attendance is None:
        attendance = Attendance(employee_id=employee_id, record_date=today)
        db.add(attendance)

    attendance.check_in = now_utc()
    attendance.status = AttendanceStatus.PRESENT
    if data.remarks:
        attendance.remarks = data.remarks

    await db.commit()
    await db.refresh(attendance)
    return attendance


async def check_out_employee(db: AsyncSession, attendance: Attendance, data: CheckOutRequest) -> Attendance:
    attendance.check_out = now_utc()
    if data.remarks:
        out_note = f"Out: {data.remarks}"
        attendance.remarks = f"{attendance.remarks} | {out_note}" if attendance.remarks else out_note

    await db.commit()
    await db.refresh(attendance)
    return attendance


async def get_employee_attendance(db: AsyncSession, employee_id: int) -> list[Attendance]:
    query = select(Attendance).where(
        Attendance.employee_id == employee_id
    ).order_by(Attendance.record_date.desc())

    result = await db.execute(query)
    return list(result.scalars().all())

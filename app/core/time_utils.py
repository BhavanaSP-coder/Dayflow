"""Time helpers for the single business timezone configured in settings.

Attendance is bucketed by the local calendar date, so an employee starting at
04:00 IST is recorded on that day rather than on the previous UTC day.
"""

from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.core.config import settings


def business_tz() -> ZoneInfo:
    return ZoneInfo(settings.TIMEZONE)


def now_local() -> datetime:
    """Current time as an aware datetime in the business timezone."""
    return datetime.now(business_tz())


def business_today() -> date:
    """Today's calendar date in the business timezone."""
    return now_local().date()


def now_utc() -> datetime:
    """Current instant, stored as UTC. Timestamps stay absolute; only the
    record_date bucket is timezone-local."""
    return datetime.now(timezone.utc)

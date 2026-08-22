import enum
from datetime import date, datetime
from typing import Optional

from sqlalchemy import ForeignKey, Date, DateTime, Enum, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.time_utils import business_today
from app.db.database import Base
from app.models.employee import Employee


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    HALF_DAY = "half-day"
    LEAVE = "leave"


class Attendance(Base):
    __tablename__ = "attendances"
    __table_args__ = (
        UniqueConstraint("employee_id", "record_date", name="uq_attendance_employee_date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Tracking
    record_date: Mapped[date] = mapped_column(Date, default=business_today, nullable=False)
    check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus), default=AttendanceStatus.ABSENT, nullable=False
    )
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    employee: Mapped["Employee"] = relationship("Employee", back_populates="attendances")
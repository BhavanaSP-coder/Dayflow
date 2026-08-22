"""
Database model for the Leave module.

Table: leave_requests
Owner: Person 2 (leave / payroll / notifications / reports)
"""

import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class LeaveType(str, enum.Enum):
    """The kinds of leave an employee may apply for."""

    SICK = "SICK"
    CASUAL = "CASUAL"
    ANNUAL = "ANNUAL"
    UNPAID = "UNPAID"
    MATERNITY = "MATERNITY"


class LeaveStatus(str, enum.Enum):
    """Lifecycle of a leave request: PENDING -> APPROVED or REJECTED."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )

    leave_type: Mapped[LeaveType] = mapped_column(
        Enum(LeaveType, length=20), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    remarks: Mapped[str | None] = mapped_column(String(500), nullable=True)

    status: Mapped[LeaveStatus] = mapped_column(
        Enum(LeaveStatus, length=20),
        nullable=False,
        default=LeaveStatus.PENDING,
        server_default=LeaveStatus.PENDING.value,
        index=True,
    )

    # Filled in by HR/Admin when they approve or reject (Phase 3).
    admin_comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<LeaveRequest id={self.id} employee_id={self.employee_id} "
            f"status={self.status.value}>"
        )

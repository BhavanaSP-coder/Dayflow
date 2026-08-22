"""Database model for the Notifications module.  Table: notifications"""

import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class NotificationType(str, enum.Enum):
    """What kind of event produced this notification.

    Adding a new type here is all another module needs to start using
    notifications - the service itself stays generic.
    """

    LEAVE_SUBMITTED = "LEAVE_SUBMITTED"
    LEAVE_APPROVED = "LEAVE_APPROVED"
    LEAVE_REJECTED = "LEAVE_REJECTED"
    PAYROLL_UPDATED = "PAYROLL_UPDATED"
    GENERAL = "GENERAL"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # INTEGRATION POINT (Person 1): becomes ForeignKey("users.id") once their
    # user table exists. This is the *user* id, not the employee id.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True
    )

    message: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, length=30),
        nullable=False,
        default=NotificationType.GENERAL,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="0", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<Notification id={self.id} user_id={self.user_id} read={self.is_read}>"

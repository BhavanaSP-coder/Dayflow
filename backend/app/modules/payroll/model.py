"""Database model for the Payroll module.  Table: payroll"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Payroll(Base):
    __tablename__ = "payroll"

    # One payroll row per employee per month. The database itself blocks
    # duplicates, so two HR users clicking Save at the same time cannot
    # create two rows for the same month.
    __table_args__ = (
        UniqueConstraint("employee_id", "month", "year", name="uq_payroll_period"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # INTEGRATION POINT (Person 1): becomes ForeignKey("employees.id").
    employee_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # Numeric, NOT Float. Floats lose pennies (0.1 + 0.2 != 0.3), which is
    # unacceptable for money. Numeric(12, 2) = up to 10 digits + 2 decimals.
    basic_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    allowances: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00"), server_default="0.00"
    )
    deductions: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0.00"), server_default="0.00"
    )
    # Stored (not recalculated on read) so a historic payslip never changes.
    net_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # 1-12
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return (
            f"<Payroll employee_id={self.employee_id} "
            f"{self.month}/{self.year} net={self.net_salary}>"
        )

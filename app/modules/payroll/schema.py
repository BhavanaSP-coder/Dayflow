"""Pydantic schemas for the Payroll module."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

# Money fields: never negative, max 2 decimal places.
Money = Field(default=Decimal("0.00"), ge=0, max_digits=12, decimal_places=2)


class PayrollUpsert(BaseModel):
    """Body of PUT /api/payroll/{employee_id} (HR/Admin only).

    net_salary is NOT accepted from the client - the server calculates it,
    so the stored figure can never disagree with the parts it's made of.
    """

    basic_salary: Decimal = Field(..., ge=0, max_digits=12, decimal_places=2)
    allowances: Decimal = Money
    deductions: Decimal = Money
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2100)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "basic_salary": "50000.00",
                "allowances": "5000.00",
                "deductions": "2000.00",
                "month": 8,
                "year": 2026,
            }
        }
    )


class PayrollOut(BaseModel):
    """One payroll record as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    net_salary: Decimal
    month: int
    year: int
    created_at: datetime
    updated_at: datetime


class PayrollListOut(BaseModel):
    total: int
    items: list[PayrollOut]


class PayrollActionOut(BaseModel):
    message: str
    payroll: PayrollOut

"""
Pydantic schemas for the Leave module.

WHERE VALIDATION LIVES
----------------------
schema.py = shape checks   (is it a date? is remarks under 500 chars?)
service.py = business rules (is start <= end? does it overlap existing leave?)

Notice LeaveCreate has no `status` field. That is deliberate: an employee
physically cannot send {"status": "APPROVED"} and approve their own leave,
because Pydantic ignores fields the schema doesn't declare.
"""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.modules.leave.model import LeaveStatus, LeaveType


class LeaveCreate(BaseModel):
    """Body of POST /api/leaves"""

    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str | None = Field(default=None, max_length=500)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "leave_type": "CASUAL",
                "start_date": "2026-09-01",
                "end_date": "2026-09-03",
                "remarks": "Family function",
            }
        }
    )


class LeaveDecision(BaseModel):
    """Body of the approve / reject endpoints (HR or Admin only)."""

    admin_comment: str | None = Field(default=None, max_length=500)


class LeaveOut(BaseModel):
    """One leave request as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str | None
    status: LeaveStatus
    admin_comment: str | None
    reviewed_by: int | None
    created_at: datetime
    updated_at: datetime

    @computed_field  # calculated on the way out; not stored in MySQL
    @property
    def total_days(self) -> int:
        """Inclusive day count: 1st to 3rd = 3 days, not 2."""
        return (self.end_date - self.start_date).days + 1


class LeaveListOut(BaseModel):
    """A page of leave requests."""

    total: int
    items: list[LeaveOut]


class LeaveActionOut(BaseModel):
    """Response after creating / approving / rejecting."""

    message: str
    leave: LeaveOut

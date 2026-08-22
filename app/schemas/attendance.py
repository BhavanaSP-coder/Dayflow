from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.models.attendance import AttendanceStatus


class CheckInRequest(BaseModel):
    remarks: str | None = None


class CheckOutRequest(BaseModel):
    remarks: str | None = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    record_date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: AttendanceStatus
    remarks: str | None = None

    model_config = ConfigDict(from_attributes=True)
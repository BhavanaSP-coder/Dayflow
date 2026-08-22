from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.employee import RoleEnum

# This is the class Python is looking for!
class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    email: EmailStr
    role: RoleEnum
    first_name: str
    last_name: str
    phone: str | None = None
    address: str | None = None
    profile_picture_url: str | None = None
    job_title: str | None = None
    department: str | None = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EmployeeSelfUpdate(BaseModel):
    phone: str | None = None
    address: str | None = None
    profile_picture_url: str | None = None

class EmployeeAdminUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    address: str | None = None
    profile_picture_url: str | None = None
    job_title: str | None = None
    department: str | None = None
    role: RoleEnum | None = None
    is_active: bool | None = None
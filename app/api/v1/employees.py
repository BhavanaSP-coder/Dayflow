from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.employee import EmployeeResponse, EmployeeAdminUpdate
from app.crud import crud_employee
from app.core.dependencies import require_admin_or_hr, require_admin
from app.models.employee import Employee

router = APIRouter()


# Path is "" rather than "/" so the URL is /api/v1/employees with no 307 redirect.
@router.get("", response_model=list[EmployeeResponse])
async def get_all_employees(
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_admin_or_hr)
):
    """
    Retrieve a list of all employees.
    Protected route: Only users with the Admin or HR role can access this.
    """
    employees = await crud_employee.get_all_employees(db)
    return employees


@router.patch("/{employee_pk}", response_model=EmployeeResponse)
async def update_employee(
    employee_pk: int,
    updates: EmployeeAdminUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Employee = Depends(require_admin)
):
    """
    Update an employee's profile, role, or active flag.
    Protected route: Admin only, since this is how roles are granted.
    """
    employee = await crud_employee.get_employee_by_id(db, employee_pk)
    if employee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    return await crud_employee.update_employee(db, employee, updates)

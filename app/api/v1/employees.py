from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.employee import EmployeeResponse
from app.crud import crud_employee
from app.core.dependencies import require_admin_or_hr
from app.models.employee import Employee

router = APIRouter()

@router.get("/", response_model=list[EmployeeResponse])
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
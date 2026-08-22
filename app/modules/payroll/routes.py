"""URL definitions for Payroll."""

from fastapi import APIRouter, Depends, Path, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.dependencies import CurrentUser, get_current_user, require_hr_admin
from app.modules.payroll import controller
from app.modules.payroll.schema import PayrollActionOut, PayrollListOut, PayrollUpsert

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


@router.get("/my", response_model=PayrollListOut)
async def get_my_payroll(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Your own payslips. Any logged-in role."""
    return await controller.get_my_payroll(db, current_user, month, year, skip, limit)


@router.get("", response_model=PayrollListOut)
async def list_all_payroll(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: CurrentUser = Depends(require_hr_admin),
):
    """All payroll records. HR/Admin only."""
    return await controller.list_all_payroll(db, month, year, skip, limit)


@router.get("/{employee_id}", response_model=PayrollListOut)
async def get_employee_payroll(
    employee_id: int = Path(..., ge=1),
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None, ge=2000, le=2100),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """One employee's payroll. HR/Admin, or the employee themselves."""
    return await controller.get_employee_payroll(
        db, current_user, employee_id, month, year, skip, limit
    )


@router.put("/{employee_id}", response_model=PayrollActionOut)
async def upsert_payroll(
    payload: PayrollUpsert,
    response: Response,
    employee_id: int = Path(..., ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_hr_admin),
):
    """Create or update payroll for an employee/month. HR/Admin only.

    An EMPLOYEE calling this gets 403 from require_hr_admin before a single
    line of payroll code runs.
    """
    result, created = await controller.upsert_payroll(
        db, current_user, employee_id, payload
    )
    if created:
        response.status_code = status.HTTP_201_CREATED
    return result

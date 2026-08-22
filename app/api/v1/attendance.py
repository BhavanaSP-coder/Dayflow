from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.time_utils import business_today
from app.db.database import get_db
from app.schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceResponse
from app.crud import crud_attendance
from app.core.dependencies import get_current_user
from app.models.employee import Employee

router = APIRouter()


@router.post("/check-in", response_model=AttendanceResponse)
async def check_in(
    data: CheckInRequest, 
    current_user: Employee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = business_today()
    existing_record = await crud_attendance.get_today_attendance(db, current_user.id, today)
    
    if existing_record and existing_record.check_in:
        raise HTTPException(status_code=400, detail="You have already checked in today.")
        
    return await crud_attendance.check_in_employee(db, current_user.id, data)


@router.post("/check-out", response_model=AttendanceResponse)
async def check_out(
    data: CheckOutRequest, 
    current_user: Employee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # An overnight shift is dated by its check-in day, so look for the open
    # shift rather than assuming it carries today's date.
    open_record = await crud_attendance.get_open_attendance(db, current_user.id)

    if open_record is None:
        today_record = await crud_attendance.get_today_attendance(
            db, current_user.id, business_today()
        )
        if today_record and today_record.check_out:
            raise HTTPException(status_code=400, detail="You have already checked out today.")
        raise HTTPException(status_code=400, detail="You must check in before you can check out.")

    return await crud_attendance.check_out_employee(db, open_record, data)


@router.get("/history", response_model=list[AttendanceResponse])
async def get_my_attendance_history(
    current_user: Employee = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await crud_attendance.get_employee_attendance(db, current_user.id)
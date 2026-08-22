from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.auth import UserRegister, Token
from app.schemas.employee import EmployeeResponse
from app.crud import crud_employee
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.employee import Employee

router = APIRouter()


@router.post("/register", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if email or employee ID already exists
    if await crud_employee.get_user_by_email(db, email=user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await crud_employee.get_user_by_employee_id(db, employee_id=user_in.employee_id):
        raise HTTPException(status_code=400, detail="Employee ID already registered")
    
    user = await crud_employee.create_user(db, user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], 
    db: AsyncSession = Depends(get_db)
):
    # OAuth2 specifies 'username', but we are passing the email into it
    user = await crud_employee.get_user_by_email(db, email=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=EmployeeResponse)
async def get_my_profile(current_user: Employee = Depends(get_current_user)):
    return current_user
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee, RoleEnum
from app.schemas.auth import UserRegister
from app.schemas.employee import EmployeeAdminUpdate
from app.core.security import get_password_hash


async def get_user_by_email(db: AsyncSession, email: str) -> Employee | None:
    result = await db.execute(select(Employee).where(Employee.email == email))
    return result.scalar_one_or_none()


async def get_user_by_employee_id(db: AsyncSession, employee_id: str) -> Employee | None:
    result = await db.execute(select(Employee).where(Employee.employee_id == employee_id))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: UserRegister) -> Employee:
    db_user = Employee(
        employee_id=user.employee_id,
        email=user.email,
        hashed_password=get_password_hash(user.password),
        role=RoleEnum.EMPLOYEE,  # public signup is always a plain employee
        first_name=user.first_name,
        last_name=user.last_name,
        job_title=user.job_title,
        department=user.department,
        is_active=True,  # Defaulting to True for hackathon speed
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def get_all_employees(db: AsyncSession) -> list[Employee]:
    result = await db.execute(select(Employee))
    return list(result.scalars().all())


async def get_employee_by_id(db: AsyncSession, employee_pk: int) -> Employee | None:
    result = await db.execute(select(Employee).where(Employee.id == employee_pk))
    return result.scalar_one_or_none()


async def update_employee(
    db: AsyncSession, employee: Employee, updates: EmployeeAdminUpdate
) -> Employee:
    # exclude_unset so an omitted field is left alone rather than set to None.
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    return employee

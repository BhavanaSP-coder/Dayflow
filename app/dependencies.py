"""
=============================================================================
AUTH ADAPTER  ---  formerly the temporary header-based shim
=============================================================================

This file used to fake authentication by reading X-User-Id / X-Role headers so
the Leave/Payroll/Notifications/Reports modules could be built before auth
existed. That shim is gone: get_current_user() now delegates to the real JWT
dependency in app/core/dependencies.py.

The public surface is unchanged on purpose -- CurrentUser, get_current_user,
require_roles and require_hr_admin all keep their old shapes, so none of the
four modules needed edits.

NAMING TRAP, worth knowing:
    CurrentUser.employee_id  is the employees table PRIMARY KEY (int).
    Employee.employee_id     is the human-facing staff code (str, "EMP004").
Those are different things that happen to share a name. leave_requests.
employee_id, payroll.employee_id and notifications.user_id all store the
PRIMARY KEY, so that is what this adapter puts in CurrentUser.employee_id.
=============================================================================
"""

import enum
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.core.dependencies import get_current_user as get_current_employee
from app.models.employee import Employee


class Role(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    HR = "HR"
    ADMIN = "ADMIN"


@dataclass
class CurrentUser:
    """The minimum the four modules need from the auth system."""

    id: int
    employee_id: int
    role: Role

    @property
    def is_hr_or_admin(self) -> bool:
        return self.role in (Role.HR, Role.ADMIN)


async def get_current_user(
    employee: Annotated[Employee, Depends(get_current_employee)],
) -> CurrentUser:
    """Adapt the authenticated Employee ORM object to CurrentUser.

    app.models.employee.RoleEnum is lower-case ("admin"); Role here is
    upper-case ("ADMIN"), hence the .upper().
    """
    try:
        role = Role(employee.role.value.upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unmapped role '{employee.role}'.",
        )

    return CurrentUser(
        id=employee.id,
        employee_id=employee.id,  # primary key, NOT employee.employee_id
        role=role,
    )


def require_roles(*allowed: Role):
    """Build a dependency that only lets certain roles through."""

    def dependency(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency


# Ready-made guard used by Leave approvals, Payroll updates and all Reports.
require_hr_admin = require_roles(Role.HR, Role.ADMIN)


def is_hr_or_admin(user: CurrentUser) -> bool:
    """Function form of CurrentUser.is_hr_or_admin.

    The service layer calls this as a plain function so a service can be unit
    tested with any object exposing `.role`, without constructing a CurrentUser.
    Kept as a thin delegate so there is still only one definition of the rule.
    """
    return user.is_hr_or_admin

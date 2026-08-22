"""
=============================================================================
TEMPORARY AUTH SHIM  ---  THIS IS THE ONE FILE PERSON 1 REPLACES
=============================================================================

Person 1 owns authentication/JWT. Until their code is merged, your modules
still need to know "who is calling?", so this file fakes it by reading three
HTTP headers. That lets you build and test Leave/Payroll/Notifications/Reports
today without duplicating anyone's work.

    X-User-Id: 5
    X-Employee-Id: 5
    X-Role: EMPLOYEE | HR | ADMIN

!! INSECURE !! Anyone could send those headers. This must NOT reach production.

WHEN PERSON 1 IS READY
----------------------
Replace the body of get_current_user() with their JWT dependency, e.g.:

    from app.modules.auth.dependencies import get_current_user   # their path

...and make sure the object they return exposes .id, .employee_id and .role.
If it does, NOTHING ELSE IN YOUR FOUR MODULES HAS TO CHANGE - they all import
get_current_user / require_hr_admin from this single file.
=============================================================================
"""

import enum
import os
from dataclasses import dataclass

from fastapi import Depends, Header, HTTPException, status


class Role(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    HR = "HR"
    ADMIN = "ADMIN"


@dataclass
class CurrentUser:
    """The minimum your modules need from Person 1's auth system."""

    id: int
    employee_id: int
    role: Role

    @property
    def is_hr_or_admin(self) -> bool:
        return self.role in (Role.HR, Role.ADMIN)


def get_current_user(
    x_user_id: int | None = Header(default=None),
    x_employee_id: int | None = Header(default=None),
    x_role: str | None = Header(default=None),
) -> CurrentUser:
    """Identify the caller. Swap this body for Person 1's JWT dependency."""
    if os.getenv("AUTH_MODE", "dev").lower() != "dev":
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Real authentication is not wired up yet.",
        )

    if x_user_id is None or x_role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-Id / X-Role headers (dev auth mode).",
        )

    try:
        role = Role(x_role.strip().upper())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unknown role '{x_role}'. Use EMPLOYEE, HR or ADMIN.",
        )

    return CurrentUser(
        id=x_user_id,
        employee_id=x_employee_id if x_employee_id is not None else x_user_id,
        role=role,
    )


def require_roles(*allowed: Role):
    """Build a dependency that only lets certain roles through.

    This is a function that RETURNS a function (a 'factory'). It exists so you
    can write require_roles(Role.HR) in one route and require_roles(Role.ADMIN)
    in another without copy-pasting the check.
    """

    def dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user

    return dependency


# Ready-made guard used by Leave approvals, Payroll updates and all Reports.
require_hr_admin = require_roles(Role.HR, Role.ADMIN)

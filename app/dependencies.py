"""
Auth integration for the leave / payroll / notifications / reports modules.

HISTORY
-------
This file used to be a development shim that trusted `X-User-Id` / `X-Role`
headers, because JWT auth was not built yet. That shim is GONE. Every export
below now resolves to the real JWT implementation in `app/core/dependencies.py`.

WHY THE FILE STILL EXISTS
-------------------------
It is the single seam between the two halves of the backend. The four modules
import `get_current_user`, `require_hr_admin`, `CurrentUser` and
`is_hr_or_admin` from here and nothing else, so if the auth implementation
moves again, only this file changes.

IDENTITY NOTE (important)
-------------------------
`Employee.id` is the integer primary key — that is what leave_requests,
payroll and notifications store in their `employee_id` / `user_id` columns.
`Employee.employee_id` is a human-readable STRING code such as "DF-EMP-1002".
They are not interchangeable. Always use `.id` for foreign keys.
"""

from app.core.dependencies import RoleChecker, get_current_user  # noqa: F401
from app.models.employee import Employee, RoleEnum

# The four modules type-hint the signed-in user as `CurrentUser`. Aliasing keeps
# those annotations accurate now that the real object is an Employee row.
CurrentUser = Employee

# Route guard for HR/Admin-only endpoints (leave approvals, payroll edits,
# every report). Raises 403 for anyone else.
require_hr_admin = RoleChecker([RoleEnum.HR, RoleEnum.ADMIN])


def is_hr_or_admin(user: Employee) -> bool:
    """Service-layer role check.

    A plain function rather than a property, because `Employee` belongs to the
    auth half of the app and this half does not modify it.
    """
    return user.role in (RoleEnum.HR, RoleEnum.ADMIN)

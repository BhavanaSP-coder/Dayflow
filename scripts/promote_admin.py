"""Grant a role to an existing employee from the command line.

Roles are granted through an admin-only endpoint, which leaves a chicken-and-egg
problem for the very first admin. Run this once against the database instead of
exposing a public role field.

    python scripts/promote_admin.py user@example.com admin
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

# Import app.db.base, not app.models.employee alone: SQLAlchemy needs every
# model registered before it can resolve the Employee <-> Attendance relationship.
import app.db.base  # noqa: F401
from app.db.database import SessionLocal, engine
from app.models.employee import Employee, RoleEnum


async def promote(email: str, role: RoleEnum) -> int:
    async with SessionLocal() as db:
        result = await db.execute(select(Employee).where(Employee.email == email))
        employee = result.scalar_one_or_none()
        if employee is None:
            print(f"No employee with email {email!r}")
            return 1
        employee.role = role
        employee.is_active = True
        await db.commit()
        print(f"{email} is now {role.value} (id={employee.id})")
    await engine.dispose()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Grant a role to an existing employee.")
    parser.add_argument("email")
    parser.add_argument("role", choices=[r.value for r in RoleEnum])
    args = parser.parse_args()
    return asyncio.run(promote(args.email, RoleEnum(args.role)))


if __name__ == "__main__":
    raise SystemExit(main())

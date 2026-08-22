from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.employee import RoleEnum

# bcrypt hashes at most 72 bytes and raises ValueError beyond that.
BCRYPT_MAX_PASSWORD_BYTES = 72


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str | None = None


class UserRegister(BaseModel):
    employee_id: str
    email: EmailStr
    password: str = Field(min_length=8)
    # No `role` field on purpose: /register is unauthenticated, so accepting a
    # role here would let anyone sign up as an admin. Roles are granted through
    # the admin-only PATCH /api/v1/employees/{id} endpoint.
    first_name: str
    last_name: str
    job_title: str | None = None
    department: str | None = None

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, v: str) -> str:
        if len(v.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError(
                f"password must be at most {BCRYPT_MAX_PASSWORD_BYTES} bytes "
                "when UTF-8 encoded"
            )
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
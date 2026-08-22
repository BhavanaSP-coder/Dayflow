"""
Shared error types for the service layer.

WHY THIS FILE EXISTS
--------------------
Rule: service.py must not know anything about HTTP. So instead of raising
FastAPI's HTTPException, a service raises one of these plain Python errors.
main.py has ONE handler that turns them into proper JSON + status codes,
so no controller needs a try/except block.
"""


class ServiceError(Exception):
    """Base class. Every error below carries the HTTP status it maps to."""

    status_code = 400

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code


class ValidationError(ServiceError):
    """The request made sense structurally, but breaks a business rule."""

    status_code = 400


class ForbiddenError(ServiceError):
    """Logged in, but not allowed to do this."""

    status_code = 403


class NotFoundError(ServiceError):
    """The requested row does not exist."""

    status_code = 404


class ConflictError(ServiceError):
    """Clashes with existing data (overlapping leave, already decided, ...)."""

    status_code = 409


class NotIntegratedError(ServiceError):
    """Depends on a teammate's module that isn't merged yet."""

    status_code = 503

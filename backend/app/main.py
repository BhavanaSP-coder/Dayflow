"""
Dayflow HRMS - FastAPI application entry point.

Run from the `backend` folder with:
    uvicorn app.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.database.connection import create_tables
from app.exceptions import ServiceError

# Importing each model registers its table on Base.metadata, which is how
# create_tables() knows what to create. Without these imports, no tables.
from app.modules.leave import model as leave_model  # noqa: F401
from app.modules.notifications import model as notification_model  # noqa: F401
from app.modules.payroll import model as payroll_model  # noqa: F401

from app.modules.leave.routes import router as leave_router
from app.modules.notifications.routes import router as notifications_router
from app.modules.payroll.routes import router as payroll_router
from app.modules.reports.routes import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Runs once at startup (before `yield`) and once at shutdown."""
    create_tables()
    yield


app = FastAPI(
    title="Dayflow HRMS API",
    description="Leave, Payroll, Notifications and Reports modules.",
    version="0.1.0",
    lifespan=lifespan,
)

# Lets the frontend (different port) call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Turns a service-layer error into the right HTTP status code.

    This single handler is why no controller needs a try/except block:
    NotFoundError -> 404, ForbiddenError -> 403, ConflictError -> 409, etc.
    """
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Safety net for database constraint violations.

    A duplicate row or a broken foreign key is the client's problem (409),
    not a server crash (500). Individual services still handle the cases they
    expect - this catches anything they miss.
    """
    return JSONResponse(
        status_code=409,
        content={"detail": "This operation conflicts with existing data."},
    )


@app.get("/health", tags=["system"])
def health_check():
    """Simple endpoint to confirm the API is alive."""
    return {"status": "ok", "service": "dayflow-backend"}


app.include_router(leave_router)
app.include_router(notifications_router)
app.include_router(payroll_router)
app.include_router(reports_router)

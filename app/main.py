from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.db.database import engine

# Importing app.db.base (not app.db.database) guarantees every model module has
# been imported, so Base.metadata knows about all tables before create_all runs.
from app.db.base import Base

from app.exceptions import ServiceError

# --- auth / employee / attendance half (async, AsyncSession) ---
from app.api.v1.auth import router as auth_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.employees import router as employee_router

# --- leave / payroll / notifications / reports half (sync, Session) ---
from app.modules.leave.routes import router as leave_router
from app.modules.notifications.routes import router as notifications_router
from app.modules.payroll.routes import router as payroll_router
from app.modules.reports.routes import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # One create_all for the whole app: both halves share Base.metadata, so
    # this creates employees, attendances, leave_requests, payroll and
    # notifications in a single pass.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Dayflow HRMS API",
    description="Backend API for the Dayflow Hackathon Project",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Allows your frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for hackathon speed
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)


@app.exception_handler(ServiceError)
async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Turns a service-layer error into the right HTTP status code, so no
    controller in the leave/payroll/reports modules needs a try/except."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """A duplicate row or broken foreign key is the client's problem (409),
    not a server crash (500)."""
    return JSONResponse(
        status_code=409,
        content={"detail": "This operation conflicts with existing data."},
    )


# Wire up the routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(employee_router, prefix="/api/v1/employees", tags=["Employees"])

# These four carry their own prefixes (/api/leaves, /api/payroll, ...)
app.include_router(leave_router)
app.include_router(notifications_router)
app.include_router(payroll_router)
app.include_router(reports_router)


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "service": "dayflow-backend"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Dayflow API!", 
        "docs_url": "Go to /docs to see the interactive API documentation."
    }

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine

# Importing app.db.base (not app.db.database) guarantees every model module has
# been imported, so Base.metadata knows about all tables before create_all runs.
from app.db.base import Base

from app.api.v1.auth import router as auth_router
from app.api.v1.attendance import router as attendance_router
from app.api.v1.employees import router as employee_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup: Create all database tables based on your models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # On shutdown: Close database connection gracefully
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

# Wire up the routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(employee_router, prefix="/api/v1/employees", tags=["Employees"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to the Dayflow API!", 
        "docs_url": "Go to /docs to see the interactive API documentation."
    }

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from alembic.config import Config
from alembic import command
from app.database import engine
from app.routers import users, records

# Run Alembic migrations on startup
def run_migrations():
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ini_path = os.path.join(current_dir, "alembic.ini")
    alembic_cfg = Config(ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(current_dir, "migrations"))
    command.upgrade(alembic_cfg, "head")

run_migrations()

# Ensure uploads directory exists
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(backend_dir, "uploads", "profile_pics"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

REPORTS_DIR = os.getenv("REPORTS_DIR", os.path.join(backend_dir, "uploads", "reports"))
os.makedirs(REPORTS_DIR, exist_ok=True)

app = FastAPI(
    title="FitdaysWeb API",
    description="Backend service for importing, analyzing, and serving Fitdays body composition data",
    version="0.1.0"
)

# Configure CORS for decoupled React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for profile pictures and reports
app.mount("/uploads/profile_pics", StaticFiles(directory=UPLOAD_DIR), name="profile_pics")
app.mount("/uploads/reports", StaticFiles(directory=REPORTS_DIR), name="reports")

# Include routers
app.include_router(users.router)
app.include_router(records.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FitdaysWeb API. Visit /docs for Swagger documentation."}

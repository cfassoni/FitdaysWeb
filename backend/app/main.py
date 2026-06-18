from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, records

# Initialize database tables
Base.metadata.create_all(bind=engine)

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

# Include routers
app.include_router(users.router)
app.include_router(records.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to FitdaysWeb API. Visit /docs for Swagger documentation."}

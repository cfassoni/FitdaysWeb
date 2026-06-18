from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Dict, Any

# User Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

# Fitdays Record Schemas
class FitdaysRecordResponse(BaseModel):
    id: int
    user_id: int
    date: datetime

    # Core Weight / Body Metrics
    weight: float
    bmi: float
    body_fat_pct: float
    subcutaneous_fat_pct: float
    heart_rate: float | None
    heart_index: float | None
    visceral_fat: float
    body_water_pct: float
    skeletal_muscle_mass_pct: float
    muscle_mass: float
    bone_mass: float
    protein_pct: float
    bmr: float
    metabolic_age: float
    fat_mass: float
    moisture_content: float
    skeletal_muscle_mass: float
    muscle_rate_pct: float
    protein_mass: float
    obesity_score: int
    fat_free_mass: float
    smi: float | None
    body_score: float
    target_weight: float
    weight_control: float
    fat_control: float
    muscle_control: float

    # Right Arm
    right_arm_fat_mass: float | None
    right_arm_fat_pct: float | None
    right_arm_fat_level: str | None
    right_arm_muscle_mass: float | None
    right_arm_muscle_pct: float | None
    right_arm_muscle_level: str | None
    right_arm_impedance_high: float | None
    right_arm_impedance_low: float | None

    # Left Arm
    left_arm_fat_mass: float | None
    left_arm_fat_pct: float | None
    left_arm_fat_level: str | None
    left_arm_muscle_mass: float | None
    left_arm_muscle_pct: float | None
    left_arm_muscle_level: str | None
    left_arm_impedance_high: float | None
    left_arm_impedance_low: float | None

    # Trunk
    trunk_fat_mass: float | None
    trunk_fat_pct: float | None
    trunk_fat_level: str | None
    trunk_muscle_mass: float | None
    trunk_muscle_pct: float | None
    trunk_muscle_level: str | None
    trunk_impedance_high: float | None
    trunk_impedance_low: float | None

    # Right Leg
    right_leg_fat_mass: float | None
    right_leg_fat_pct: float | None
    right_leg_fat_level: str | None
    right_leg_muscle_mass: float | None
    right_leg_muscle_pct: float | None
    right_leg_muscle_level: str | None
    right_leg_impedance_high: float | None
    right_leg_impedance_low: float | None

    # Left Leg
    left_leg_fat_mass: float | None
    left_leg_fat_pct: float | None
    left_leg_fat_level: str | None
    left_leg_muscle_mass: float | None
    left_leg_muscle_pct: float | None
    left_leg_muscle_level: str | None
    left_leg_impedance_high: float | None
    left_leg_impedance_low: float | None

    model_config = {
        "from_attributes": True
    }

# Dashboard Summary Schema
class WeightHistoryPoint(BaseModel):
    date: datetime
    weight: float
    body_fat_pct: float
    muscle_mass: float

class DashboardSummary(BaseModel):
    total_records: int
    
    first_record_date: datetime | None = None
    latest_record_date: datetime | None = None
    
    starting_weight: float | None = None
    current_weight: float | None = None
    weight_change: float | None = None
    
    starting_body_fat: float | None = None
    current_body_fat: float | None = None
    body_fat_change: float | None = None
    
    starting_muscle_mass: float | None = None
    current_muscle_mass: float | None = None
    muscle_mass_change: float | None = None

    weight_history: List[WeightHistoryPoint]

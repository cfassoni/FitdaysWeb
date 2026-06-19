from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    birthday = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    target_weight_kg = Column(Float, nullable=True)
    profile_image_path = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    records = relationship("FitdaysRecord", back_populates="user", cascade="all, delete-orphan")


class FitdaysRecord(Base):
    __tablename__ = "fitdays_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, index=True, nullable=False)

    # Core Weight / Body Metrics
    weight = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    body_fat_pct = Column(Float, nullable=False)
    subcutaneous_fat_pct = Column(Float, nullable=False)
    heart_rate = Column(Float, nullable=True)  # can be null
    heart_index = Column(Float, nullable=True)  # can be null
    visceral_fat = Column(Float, nullable=False)
    body_water_pct = Column(Float, nullable=False)
    skeletal_muscle_mass_pct = Column(Float, nullable=False)
    muscle_mass = Column(Float, nullable=False)
    bone_mass = Column(Float, nullable=False)
    protein_pct = Column(Float, nullable=False)
    bmr = Column(Float, nullable=False)
    metabolic_age = Column(Float, nullable=False)
    fat_mass = Column(Float, nullable=False)
    moisture_content = Column(Float, nullable=False)
    skeletal_muscle_mass = Column(Float, nullable=False)
    muscle_rate_pct = Column(Float, nullable=False)
    protein_mass = Column(Float, nullable=False)
    obesity_score = Column(Integer, nullable=False)
    fat_free_mass = Column(Float, nullable=False)
    smi = Column(Float, nullable=False)
    body_score = Column(Float, nullable=False)
    target_weight = Column(Float, nullable=False)
    weight_control = Column(Float, nullable=False)
    fat_control = Column(Float, nullable=False)
    muscle_control = Column(Float, nullable=False)

    # --- Right Arm Segmental Analysis ---
    right_arm_fat_mass = Column(Float, nullable=True)
    right_arm_fat_pct = Column(Float, nullable=True)
    right_arm_fat_level = Column(String, nullable=True)

    right_arm_muscle_mass = Column(Float, nullable=True)
    right_arm_muscle_pct = Column(Float, nullable=True)
    right_arm_muscle_level = Column(String, nullable=True)

    right_arm_impedance_high = Column(Float, nullable=True)
    right_arm_impedance_low = Column(Float, nullable=True)

    # --- Left Arm Segmental Analysis ---
    left_arm_fat_mass = Column(Float, nullable=True)
    left_arm_fat_pct = Column(Float, nullable=True)
    left_arm_fat_level = Column(String, nullable=True)

    left_arm_muscle_mass = Column(Float, nullable=True)
    left_arm_muscle_pct = Column(Float, nullable=True)
    left_arm_muscle_level = Column(String, nullable=True)

    left_arm_impedance_high = Column(Float, nullable=True)
    left_arm_impedance_low = Column(Float, nullable=True)

    # --- Trunk Segmental Analysis ---
    trunk_fat_mass = Column(Float, nullable=True)
    trunk_fat_pct = Column(Float, nullable=True)
    trunk_fat_level = Column(String, nullable=True)

    trunk_muscle_mass = Column(Float, nullable=True)
    trunk_muscle_pct = Column(Float, nullable=True)
    trunk_muscle_level = Column(String, nullable=True)

    trunk_impedance_high = Column(Float, nullable=True)
    trunk_impedance_low = Column(Float, nullable=True)

    # --- Right Leg Segmental Analysis ---
    right_leg_fat_mass = Column(Float, nullable=True)
    right_leg_fat_pct = Column(Float, nullable=True)
    right_leg_fat_level = Column(String, nullable=True)

    right_leg_muscle_mass = Column(Float, nullable=True)
    right_leg_muscle_pct = Column(Float, nullable=True)
    right_leg_muscle_level = Column(String, nullable=True)

    right_leg_impedance_high = Column(Float, nullable=True)
    right_leg_impedance_low = Column(Float, nullable=True)

    # --- Left Leg Segmental Analysis ---
    left_leg_fat_mass = Column(Float, nullable=True)
    left_leg_fat_pct = Column(Float, nullable=True)
    left_leg_fat_level = Column(String, nullable=True)

    left_leg_muscle_mass = Column(Float, nullable=True)
    left_leg_muscle_pct = Column(Float, nullable=True)
    left_leg_muscle_level = Column(String, nullable=True)

    left_leg_impedance_high = Column(Float, nullable=True)
    left_leg_impedance_low = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="records")

    # Constraints: Date must be unique per user
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="_user_date_uc"),
    )

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Boolean
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
    shared_links = relationship("SharedLink", back_populates="owner", cascade="all, delete-orphan")


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
    report = relationship("FitdaysReport", back_populates="record", uselist=False, cascade="all, delete-orphan", lazy="joined")

    # Constraints: Date must be unique per user
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="_user_date_uc"),
    )


class FitdaysReport(Base):
    __tablename__ = "fitdays_reports"

    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(Integer, ForeignKey("fitdays_records.id", ondelete="CASCADE"), unique=True, nullable=False)
    file_path = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    record = relationship("FitdaysRecord", back_populates="report")


from sqlalchemy import event
import os

@event.listens_for(FitdaysReport, 'after_delete')
def receive_after_delete(mapper, connection, target):
    if target.file_path and os.path.exists(target.file_path):
        try:
            os.remove(target.file_path)
        except Exception:
            pass


class SharedLink(Base):
    __tablename__ = "shared_links"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    include_attachments = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    snapshot_data = Column(String, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="shared_links")
    audit_logs = relationship("SharedLinkAuditLog", back_populates="shared_link", cascade="all, delete-orphan")


class SharedLinkAuditLog(Base):
    __tablename__ = "shared_link_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    shared_link_id = Column(String, ForeignKey("shared_links.id", ondelete="CASCADE"), nullable=False)
    accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    status = Column(String, nullable=False)

    # Relationships
    shared_link = relationship("SharedLink", back_populates="audit_logs")


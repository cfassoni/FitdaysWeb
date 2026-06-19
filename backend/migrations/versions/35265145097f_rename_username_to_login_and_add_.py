"""rename_username_to_login_and_add_profile_fields

Revision ID: 35265145097f
Revises: 
Create Date: 2026-06-19 10:42:20.140376

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '35265145097f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if the 'users' table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if "users" not in tables:
        # Create users table with latest fields
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('login', sa.String(), unique=True, index=True, nullable=False),
            sa.Column('email', sa.String(), unique=True, index=True, nullable=False),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('display_name', sa.String(), nullable=True),
            sa.Column('gender', sa.String(), nullable=True),
            sa.Column('birthday', sa.String(), nullable=True),
            sa.Column('height_cm', sa.Float(), nullable=True),
            sa.Column('target_weight_kg', sa.Float(), nullable=True),
            sa.Column('profile_image_path', sa.String(), nullable=True),
            sa.Column('preferred_language', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), default=sa.func.now())
        )
    else:
        # Tables exist, migrate username to login and add new columns
        columns = [c['name'] for c in inspector.get_columns('users')]
        
        # 1. Rename username to login if username exists
        if "username" in columns and "login" not in columns:
            with op.batch_alter_table('users') as batch_op:
                batch_op.alter_column('username', new_column_name='login', existing_type=sa.String(), existing_nullable=False)
                
        # 2. Add other columns if they don't exist
        for col_name, col_type in [
            ('display_name', sa.String()),
            ('gender', sa.String()),
            ('birthday', sa.String()),
            ('height_cm', sa.Float()),
            ('target_weight_kg', sa.Float()),
            ('profile_image_path', sa.String()),
            ('preferred_language', sa.String())
        ]:
            if col_name not in columns and col_name != 'login':
                with op.batch_alter_table('users') as batch_op:
                    batch_op.add_column(sa.Column(col_name, col_type, nullable=True))
                    
    if "fitdays_records" not in tables:
        # Create fitdays_records table
        op.create_table(
            'fitdays_records',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('date', sa.DateTime(), index=True, nullable=False),
            sa.Column('weight', sa.Float(), nullable=False),
            sa.Column('bmi', sa.Float(), nullable=False),
            sa.Column('body_fat_pct', sa.Float(), nullable=False),
            sa.Column('subcutaneous_fat_pct', sa.Float(), nullable=False),
            sa.Column('heart_rate', sa.Float(), nullable=True),
            sa.Column('heart_index', sa.Float(), nullable=True),
            sa.Column('visceral_fat', sa.Float(), nullable=False),
            sa.Column('body_water_pct', sa.Float(), nullable=False),
            sa.Column('skeletal_muscle_mass_pct', sa.Float(), nullable=False),
            sa.Column('muscle_mass', sa.Float(), nullable=False),
            sa.Column('bone_mass', sa.Float(), nullable=False),
            sa.Column('protein_pct', sa.Float(), nullable=False),
            sa.Column('bmr', sa.Float(), nullable=False),
            sa.Column('metabolic_age', sa.Float(), nullable=False),
            sa.Column('fat_mass', sa.Float(), nullable=False),
            sa.Column('moisture_content', sa.Float(), nullable=False),
            sa.Column('skeletal_muscle_mass', sa.Float(), nullable=False),
            sa.Column('muscle_rate_pct', sa.Float(), nullable=False),
            sa.Column('protein_mass', sa.Float(), nullable=False),
            sa.Column('obesity_score', sa.Integer(), nullable=False),
            sa.Column('fat_free_mass', sa.Float(), nullable=False),
            sa.Column('smi', sa.Float(), nullable=True),
            sa.Column('body_score', sa.Float(), nullable=False),
            sa.Column('target_weight', sa.Float(), nullable=False),
            sa.Column('weight_control', sa.Float(), nullable=False),
            sa.Column('fat_control', sa.Float(), nullable=False),
            sa.Column('muscle_control', sa.Float(), nullable=False),
            
            # --- Right Arm Segmental Analysis ---
            sa.Column('right_arm_fat_mass', sa.Float(), nullable=True),
            sa.Column('right_arm_fat_pct', sa.Float(), nullable=True),
            sa.Column('right_arm_fat_level', sa.String(), nullable=True),
            sa.Column('right_arm_muscle_mass', sa.Float(), nullable=True),
            sa.Column('right_arm_muscle_pct', sa.Float(), nullable=True),
            sa.Column('right_arm_muscle_level', sa.String(), nullable=True),
            sa.Column('right_arm_impedance_high', sa.Float(), nullable=True),
            sa.Column('right_arm_impedance_low', sa.Float(), nullable=True),
            
            # --- Left Arm Segmental Analysis ---
            sa.Column('left_arm_fat_mass', sa.Float(), nullable=True),
            sa.Column('left_arm_fat_pct', sa.Float(), nullable=True),
            sa.Column('left_arm_fat_level', sa.String(), nullable=True),
            sa.Column('left_arm_muscle_mass', sa.Float(), nullable=True),
            sa.Column('left_arm_muscle_pct', sa.Float(), nullable=True),
            sa.Column('left_arm_muscle_level', sa.String(), nullable=True),
            sa.Column('left_arm_impedance_high', sa.Float(), nullable=True),
            sa.Column('left_arm_impedance_low', sa.Float(), nullable=True),
            
            # --- Trunk Segmental Analysis ---
            sa.Column('trunk_fat_mass', sa.Float(), nullable=True),
            sa.Column('trunk_fat_pct', sa.Float(), nullable=True),
            sa.Column('trunk_fat_level', sa.String(), nullable=True),
            sa.Column('trunk_muscle_mass', sa.Float(), nullable=True),
            sa.Column('trunk_muscle_pct', sa.Float(), nullable=True),
            sa.Column('trunk_muscle_level', sa.String(), nullable=True),
            sa.Column('trunk_impedance_high', sa.Float(), nullable=True),
            sa.Column('trunk_impedance_low', sa.Float(), nullable=True),
            
            # --- Right Leg Segmental Analysis ---
            sa.Column('right_leg_fat_mass', sa.Float(), nullable=True),
            sa.Column('right_leg_fat_pct', sa.Float(), nullable=True),
            sa.Column('right_leg_fat_level', sa.String(), nullable=True),
            sa.Column('right_leg_muscle_mass', sa.Float(), nullable=True),
            sa.Column('right_leg_muscle_pct', sa.Float(), nullable=True),
            sa.Column('right_leg_muscle_level', sa.String(), nullable=True),
            sa.Column('right_leg_impedance_high', sa.Float(), nullable=True),
            sa.Column('right_leg_impedance_low', sa.Float(), nullable=True),
            
            # --- Left Leg Segmental Analysis ---
            sa.Column('left_leg_fat_mass', sa.Float(), nullable=True),
            sa.Column('left_leg_fat_pct', sa.Float(), nullable=True),
            sa.Column('left_leg_fat_level', sa.String(), nullable=True),
            sa.Column('left_leg_muscle_mass', sa.Float(), nullable=True),
            sa.Column('left_leg_muscle_pct', sa.Float(), nullable=True),
            sa.Column('left_leg_muscle_level', sa.String(), nullable=True),
            sa.Column('left_leg_impedance_high', sa.Float(), nullable=True),
            sa.Column('left_leg_impedance_low', sa.Float(), nullable=True),
            
            sa.UniqueConstraint('user_id', 'date', name='_user_date_uc')
        )


def downgrade() -> None:
    # Check if the 'users' table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if "users" in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        # 1. Rename login to username if login exists
        if "login" in columns and "username" not in columns:
            with op.batch_alter_table('users') as batch_op:
                batch_op.alter_column('login', new_column_name='username', existing_type=sa.String(), existing_nullable=False)
                
        # 2. Remove other columns if they exist
        for col_name in [
            'display_name',
            'gender',
            'birthday',
            'height_cm',
            'target_weight_kg',
            'profile_image_path',
            'preferred_language'
        ]:
            if col_name in columns:
                with op.batch_alter_table('users') as batch_op:
                    batch_op.drop_column(col_name)

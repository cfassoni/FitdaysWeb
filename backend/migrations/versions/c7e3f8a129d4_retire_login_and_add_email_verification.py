"""retire_login_and_add_email_verification

Revision ID: c7e3f8a129d4
Revises: b57236d395af
Create Date: 2026-08-17 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7e3f8a129d4'
down_revision: Union[str, Sequence[str], None] = 'b57236d395af'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "_alembic_tmp_users" in tables:
        op.execute(sa.text("DROP TABLE IF EXISTS _alembic_tmp_users"))

    if "users" in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        indexes = [idx['name'] for idx in inspector.get_indexes('users')]
        
        with op.batch_alter_table('users') as batch_op:
            if "ix_users_login" in indexes:
                batch_op.drop_index('ix_users_login')
            if "email_confirmed" not in columns:
                batch_op.add_column(
                    sa.Column('email_confirmed', sa.Boolean(), nullable=False, server_default=sa.true())
                )
            if "pending_email" not in columns:
                batch_op.add_column(
                    sa.Column('pending_email', sa.String(), nullable=True)
                )
            if "verification_code" not in columns:
                batch_op.add_column(
                    sa.Column('verification_code', sa.String(), nullable=True)
                )
            if "verification_code_expires_at" not in columns:
                batch_op.add_column(
                    sa.Column('verification_code_expires_at', sa.DateTime(), nullable=True)
                )
            if "verification_attempts" not in columns:
                batch_op.add_column(
                    sa.Column('verification_attempts', sa.Integer(), nullable=False, server_default="0")
                )
            if "login" in columns:
                batch_op.drop_column('login')


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "users" in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        with op.batch_alter_table('users') as batch_op:
            if "login" not in columns:
                batch_op.add_column(
                    sa.Column('login', sa.String(), nullable=True)
                )
            if "verification_attempts" in columns:
                batch_op.drop_column('verification_attempts')
            if "verification_code_expires_at" in columns:
                batch_op.drop_column('verification_code_expires_at')
            if "verification_code" in columns:
                batch_op.drop_column('verification_code')
            if "pending_email" in columns:
                batch_op.drop_column('pending_email')
            if "email_confirmed" in columns:
                batch_op.drop_column('email_confirmed')

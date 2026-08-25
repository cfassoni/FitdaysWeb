"""add_password_reset_fields

Revision ID: d8f2a1b94c3e
Revises: c7e3f8a129d4
Create Date: 2026-08-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd8f2a1b94c3e'
down_revision: Union[str, Sequence[str], None] = 'c7e3f8a129d4'
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
            if "reset_password_token" not in columns:
                batch_op.add_column(
                    sa.Column('reset_password_token', sa.String(), nullable=True)
                )
            if "reset_password_code" not in columns:
                batch_op.add_column(
                    sa.Column('reset_password_code', sa.String(), nullable=True)
                )
            if "reset_password_expires_at" not in columns:
                batch_op.add_column(
                    sa.Column('reset_password_expires_at', sa.DateTime(), nullable=True)
                )
            if "reset_password_attempts" not in columns:
                batch_op.add_column(
                    sa.Column('reset_password_attempts', sa.Integer(), nullable=False, server_default="0")
                )
            if "ix_users_reset_password_token" not in indexes:
                batch_op.create_index('ix_users_reset_password_token', ['reset_password_token'], unique=False)
            if "ix_users_reset_password_code" not in indexes:
                batch_op.create_index('ix_users_reset_password_code', ['reset_password_code'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "users" in tables:
        columns = [c['name'] for c in inspector.get_columns('users')]
        indexes = [idx['name'] for idx in inspector.get_indexes('users')]

        with op.batch_alter_table('users') as batch_op:
            if "ix_users_reset_password_code" in indexes:
                batch_op.drop_index('ix_users_reset_password_code')
            if "ix_users_reset_password_token" in indexes:
                batch_op.drop_index('ix_users_reset_password_token')
            if "reset_password_attempts" in columns:
                batch_op.drop_column('reset_password_attempts')
            if "reset_password_expires_at" in columns:
                batch_op.drop_column('reset_password_expires_at')
            if "reset_password_code" in columns:
                batch_op.drop_column('reset_password_code')
            if "reset_password_token" in columns:
                batch_op.drop_column('reset_password_token')

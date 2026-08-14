"""add_active_members_at_creation_to_sessions

Revision ID: f7bafd950d85
Revises: 089c90a3c67e
Create Date: 2025-11-16 15:03:12.680805

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7bafd950d85'
down_revision: Union[str, None] = '089c90a3c67e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add active_members_at_creation column
    op.add_column('sessions', sa.Column('active_members_at_creation', sa.Integer(), nullable=True))


def downgrade() -> None:
    # Drop active_members_at_creation column
    op.drop_column('sessions', 'active_members_at_creation')


"""add_rated_at_to_session_registrations

Revision ID: 7fed6787b918
Revises: a1b2c3d4e5f6
Create Date: 2026-01-28 15:37:25.219203

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7fed6787b918'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('session_registrations', sa.Column('rated_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('session_registrations', 'rated_at')


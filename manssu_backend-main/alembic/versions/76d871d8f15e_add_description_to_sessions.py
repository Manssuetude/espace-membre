"""add_description_to_sessions

Revision ID: 76d871d8f15e
Revises: 368f0d508b28
Create Date: 2025-11-15 23:23:40.696936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '76d871d8f15e'
down_revision: Union[str, None] = '368f0d508b28'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('sessions', sa.Column('description', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('sessions', 'description')


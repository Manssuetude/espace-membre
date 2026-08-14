"""add_description_to_activity_templates

Revision ID: 85bbb2624e6a
Revises: 067aa30b6638
Create Date: 2026-01-26 23:50:28.658855

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85bbb2624e6a'
down_revision: Union[str, None] = '067aa30b6638'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activity_templates', sa.Column('description', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('activity_templates', 'description')


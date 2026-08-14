"""add_name_to_locations

Revision ID: 7df114db0383
Revises: 67b8ee48f037
Create Date: 2025-11-15 18:27:02.117395

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7df114db0383'
down_revision: Union[str, None] = '67b8ee48f037'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('locations', sa.Column('name', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_locations_name'), 'locations', ['name'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_locations_name'), table_name='locations')
    op.drop_column('locations', 'name')


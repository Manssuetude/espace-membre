"""add_latitude_longitude_to_locations

Revision ID: 368f0d508b28
Revises: 7df114db0383
Create Date: 2025-11-15 23:07:35.921655

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '368f0d508b28'
down_revision: Union[str, None] = '7df114db0383'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('locations', sa.Column('latitude', sa.Numeric(precision=10, scale=8), nullable=True))
    op.add_column('locations', sa.Column('longitude', sa.Numeric(precision=11, scale=8), nullable=True))


def downgrade() -> None:
    op.drop_column('locations', 'longitude')
    op.drop_column('locations', 'latitude')


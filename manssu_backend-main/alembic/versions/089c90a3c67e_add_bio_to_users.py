"""add_bio_to_users

Revision ID: 089c90a3c67e
Revises: cebacdea65d5
Create Date: 2025-11-16 12:04:20.108654

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '089c90a3c67e'
down_revision: Union[str, None] = 'cebacdea65d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add bio column
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))


def downgrade() -> None:
    # Drop bio column
    op.drop_column('users', 'bio')


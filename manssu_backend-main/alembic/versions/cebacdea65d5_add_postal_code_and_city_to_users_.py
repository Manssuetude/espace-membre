"""add_postal_code_and_city_to_users_remove_student_fields

Revision ID: cebacdea65d5
Revises: 3235fcc776aa
Create Date: 2025-11-16 12:01:15.878092

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cebacdea65d5'
down_revision: Union[str, None] = '3235fcc776aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add postal_code and city columns
    op.add_column('users', sa.Column('postal_code', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('city', sa.String(100), nullable=True))
    
    # Note: student_number and university were never in the database model,
    # they only existed in the schema, so no need to drop them


def downgrade() -> None:
    # Drop postal_code and city columns
    op.drop_column('users', 'city')
    op.drop_column('users', 'postal_code')


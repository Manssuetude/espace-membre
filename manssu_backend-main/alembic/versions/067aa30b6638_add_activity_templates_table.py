"""add_activity_templates_table

Revision ID: 067aa30b6638
Revises: 41da77e358df
Create Date: 2026-01-26 23:13:36.542956

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '067aa30b6638'
down_revision: Union[str, None] = '41da77e358df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'activity_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('color', sa.String(50), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('rules', postgresql.JSONB, nullable=True),
        sa.Column('duration', sa.String(20), nullable=True),
        sa.Column('examples', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('idx_activity_templates_title', 'activity_templates', ['title'])


def downgrade() -> None:
    op.drop_index('idx_activity_templates_title', table_name='activity_templates')
    op.drop_table('activity_templates')


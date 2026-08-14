"""add_status_and_review_fields_to_resources

Revision ID: 3235fcc776aa
Revises: d69ed9bda80d
Create Date: 2025-11-16 11:21:44.536675

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3235fcc776aa'
down_revision: Union[str, None] = 'd69ed9bda80d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add status column with default 'pending'
    op.add_column('resources', sa.Column('status', sa.String(20), nullable=False, server_default='pending'))
    
    # Add review fields
    op.add_column('resources', sa.Column('reviewed_by', sa.UUID(), nullable=True))
    op.add_column('resources', sa.Column('reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('resources', sa.Column('review_notes', sa.Text(), nullable=True))
    
    # Add foreign key for reviewed_by
    op.create_foreign_key(
        'fk_resources_reviewed_by',
        'resources',
        'users',
        ['reviewed_by'],
        ['id']
    )
    
    # Create index on status
    op.create_index('idx_resources_status', 'resources', ['status'])


def downgrade() -> None:
    # Drop index
    op.drop_index('idx_resources_status', table_name='resources')
    
    # Drop foreign key
    op.drop_constraint('fk_resources_reviewed_by', 'resources', type_='foreignkey')
    
    # Drop columns
    op.drop_column('resources', 'review_notes')
    op.drop_column('resources', 'reviewed_at')
    op.drop_column('resources', 'reviewed_by')
    op.drop_column('resources', 'status')


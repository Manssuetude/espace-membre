"""fix_poll_votes_unique_constraint_for_multiple_responses

Revision ID: d69ed9bda80d
Revises: 76d871d8f15e
Create Date: 2025-11-16 01:52:59.776629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd69ed9bda80d'
down_revision: Union[str, None] = '76d871d8f15e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old unique constraint on (poll_id, user_id)
    # This constraint prevented multiple votes per user per poll
    op.drop_index('idx_poll_votes_unique', table_name='poll_votes')
    
    # Create new unique constraint on (poll_id, user_id, option_id)
    # This allows multiple votes per user per poll (one per option)
    # Works for both single and multiple response polls
    op.create_index(
        'idx_poll_votes_unique',
        'poll_votes',
        ['poll_id', 'user_id', 'option_id'],
        unique=True
    )


def downgrade() -> None:
    # Drop the new constraint
    op.drop_index('idx_poll_votes_unique', table_name='poll_votes')
    
    # Restore the old constraint
    op.create_index(
        'idx_poll_votes_unique',
        'poll_votes',
        ['poll_id', 'user_id'],
        unique=True
    )


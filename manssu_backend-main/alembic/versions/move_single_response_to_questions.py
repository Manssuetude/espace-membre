"""move_single_response_to_questions

Revision ID: move_single_resp_to_q
Revises: add_poll_questions_refactor
Create Date: 2025-01-17 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'move_single_resp_to_q'
down_revision: Union[str, None] = 'add_poll_questions_refactor'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add single_response column to poll_questions (nullable first)
    op.add_column('poll_questions', sa.Column('single_response', sa.Boolean(), nullable=True, server_default='true'))
    
    # Step 2: Migrate data from polls to poll_questions
    connection = op.get_bind()
    
    # Get all polls with their single_response value
    polls = connection.execute(
        sa.text("SELECT id, single_response FROM polls WHERE single_response IS NOT NULL")
    ).fetchall()
    
    # Update all questions for each poll with the poll's single_response value
    for poll_id, single_response_value in polls:
        connection.execute(
            sa.text("""
                UPDATE poll_questions
                SET single_response = CAST(:single_response AS boolean)
                WHERE poll_id = CAST(:poll_id AS uuid)
            """),
            {"single_response": str(single_response_value), "poll_id": str(poll_id)}
        )
    
    # Step 3: Make single_response NOT NULL
    op.alter_column('poll_questions', 'single_response', nullable=False, server_default='true')
    
    # Step 4: Remove single_response column from polls
    op.drop_column('polls', 'single_response')


def downgrade() -> None:
    # Step 1: Add single_response column back to polls
    op.add_column('polls', sa.Column('single_response', sa.Boolean(), nullable=True, server_default='true'))
    
    # Step 2: Migrate data back (use first question's single_response value for each poll)
    connection = op.get_bind()
    
    # Get first question's single_response for each poll
    polls_with_questions = connection.execute(
        sa.text("""
            SELECT DISTINCT poll_id, single_response
            FROM poll_questions
            ORDER BY poll_id, order_index
        """)
    ).fetchall()
    
    for poll_id, single_response_value in polls_with_questions:
        connection.execute(
            sa.text("""
                UPDATE polls
                SET single_response = CAST(:single_response AS boolean)
                WHERE id = CAST(:poll_id AS uuid)
            """),
            {"single_response": str(single_response_value), "poll_id": str(poll_id)}
        )
    
    # Step 3: Make single_response NOT NULL
    op.alter_column('polls', 'single_response', nullable=False, server_default='true')
    
    # Step 4: Remove single_response column from poll_questions
    op.drop_column('poll_questions', 'single_response')


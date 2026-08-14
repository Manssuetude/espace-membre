"""add_poll_questions_table_and_refactor_polls

Revision ID: add_poll_questions_refactor
Revises: f7bafd950d85
Create Date: 2025-01-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_poll_questions_refactor'
down_revision: Union[str, None] = 'f7bafd950d85'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Create poll_questions table
    op.create_table('poll_questions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('poll_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['poll_id'], ['polls.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_poll_questions_poll_id'), 'poll_questions', ['poll_id'], unique=False)
    
    # Step 2: Add question_id columns (nullable first)
    op.add_column('poll_options', sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('poll_votes', sa.Column('question_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Step 3: Migrate existing poll data to poll_questions
    # For each existing poll, create a question with the poll's question text
    connection = op.get_bind()
    polls = connection.execute(sa.text("SELECT id, question FROM polls WHERE question IS NOT NULL")).fetchall()
    
    for poll_id, question_text in polls:
        # Create a question for this poll
        result = connection.execute(
            sa.text("""
                INSERT INTO poll_questions (id, poll_id, question, order_index, created_at)
                VALUES (gen_random_uuid(), CAST(:poll_id AS uuid), :question, 0, NOW())
                RETURNING id
            """),
            {"poll_id": str(poll_id), "question": question_text}
        )
        question_id = result.fetchone()[0]
        
        # Update poll_options to reference the question instead of poll
        connection.execute(
            sa.text("""
                UPDATE poll_options
                SET question_id = CAST(:question_id AS uuid)
                WHERE poll_id = CAST(:poll_id AS uuid)
            """),
            {"question_id": str(question_id), "poll_id": str(poll_id)}
        )
        
        # Update poll_votes to reference the question
        connection.execute(
            sa.text("""
                UPDATE poll_votes
                SET question_id = CAST(:question_id AS uuid)
                WHERE poll_id = CAST(:poll_id AS uuid)
            """),
            {"question_id": str(question_id), "poll_id": str(poll_id)}
        )
    
    # Step 4: Create indexes for question_id columns
    op.create_index(op.f('ix_poll_options_question_id'), 'poll_options', ['question_id'], unique=False)
    op.create_index(op.f('ix_poll_votes_question_id'), 'poll_votes', ['question_id'], unique=False)
    
    # Step 5: Make question_id NOT NULL
    op.alter_column('poll_options', 'question_id', nullable=False)
    op.alter_column('poll_votes', 'question_id', nullable=False)
    
    # Step 6: Add foreign keys
    op.create_foreign_key('fk_poll_options_question_id', 'poll_options', 'poll_questions', ['question_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_poll_votes_question_id', 'poll_votes', 'poll_questions', ['question_id'], ['id'], ondelete='CASCADE')
    
    # Step 7: Drop old poll_id column from poll_options
    op.drop_constraint('poll_options_poll_id_fkey', 'poll_options', type_='foreignkey')
    op.drop_index(op.f('ix_poll_options_poll_id'), table_name='poll_options')
    op.drop_column('poll_options', 'poll_id')
    
    # Step 8: Update unique constraint on poll_votes
    op.drop_index('idx_poll_votes_unique', table_name='poll_votes')
    op.create_index('idx_poll_votes_unique', 'poll_votes', ['question_id', 'user_id', 'option_id'], unique=True)
    
    # Step 9: Remove question column from polls
    op.drop_column('polls', 'question')


def downgrade() -> None:
    # Step 1: Add question column back to polls
    op.add_column('polls', sa.Column('question', sa.Text(), nullable=True))
    
    # Step 2: Migrate data back (use first question from each poll)
    connection = op.get_bind()
    polls_with_questions = connection.execute(
        sa.text("""
            SELECT DISTINCT poll_id, question
            FROM poll_questions
            ORDER BY poll_id, order_index
        """)
    ).fetchall()
    
    for poll_id, question_text in polls_with_questions:
        connection.execute(
            sa.text("UPDATE polls SET question = :question WHERE id = CAST(:poll_id AS uuid)"),
            {"question": question_text, "poll_id": str(poll_id)}
        )
    
    # Step 3: Add poll_id back to poll_options
    op.add_column('poll_options', sa.Column('poll_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Migrate poll_id from question_id
    connection.execute(
        sa.text("""
            UPDATE poll_options
            SET poll_id = (
                SELECT poll_id FROM poll_questions WHERE id = poll_options.question_id
            )
        """)
    )
    
    op.alter_column('poll_options', 'poll_id', nullable=False)
    op.create_foreign_key('poll_options_poll_id_fkey', 'poll_options', 'polls', ['poll_id'], ['id'], ondelete='CASCADE')
    op.create_index(op.f('ix_poll_options_poll_id'), 'poll_options', ['poll_id'], unique=False)
    
    # Step 4: Drop question_id from poll_options
    op.drop_constraint('fk_poll_options_question_id', 'poll_options', type_='foreignkey')
    op.drop_index(op.f('ix_poll_options_question_id'), table_name='poll_options')
    op.drop_column('poll_options', 'question_id')
    
    # Step 5: Update poll_votes unique constraint
    op.drop_index('idx_poll_votes_unique', table_name='poll_votes')
    op.create_index('idx_poll_votes_unique', 'poll_votes', ['poll_id', 'user_id', 'option_id'], unique=True)
    
    # Step 6: Drop question_id from poll_votes
    op.drop_constraint('fk_poll_votes_question_id', 'poll_votes', type_='foreignkey')
    op.drop_index(op.f('ix_poll_votes_question_id'), table_name='poll_votes')
    op.drop_column('poll_votes', 'question_id')
    
    # Step 7: Drop poll_questions table
    op.drop_index(op.f('ix_poll_questions_poll_id'), table_name='poll_questions')
    op.drop_table('poll_questions')
    
    # Step 8: Make question NOT NULL
    op.alter_column('polls', 'question', nullable=False)


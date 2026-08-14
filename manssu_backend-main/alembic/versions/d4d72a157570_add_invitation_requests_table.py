"""add_invitation_requests_table

Revision ID: d4d72a157570
Revises: 6358987d0b2f
Create Date: 2025-12-12 18:15:32.328438

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4d72a157570'
down_revision: Union[str, None] = '6358987d0b2f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create invitation_requests table
    op.create_table('invitation_requests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('requested_by', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('reviewed_by', sa.UUID(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requested_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['reviewed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_invitation_requests_email'), 'invitation_requests', ['email'], unique=False)
    op.create_index(op.f('ix_invitation_requests_session_id'), 'invitation_requests', ['session_id'], unique=False)
    op.create_index(op.f('ix_invitation_requests_requested_by'), 'invitation_requests', ['requested_by'], unique=False)
    op.create_index(op.f('ix_invitation_requests_status'), 'invitation_requests', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_invitation_requests_status'), table_name='invitation_requests')
    op.drop_index(op.f('ix_invitation_requests_requested_by'), table_name='invitation_requests')
    op.drop_index(op.f('ix_invitation_requests_session_id'), table_name='invitation_requests')
    op.drop_index(op.f('ix_invitation_requests_email'), table_name='invitation_requests')
    op.drop_table('invitation_requests')


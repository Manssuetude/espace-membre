"""add_user_award_wins_table

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-09-15 00:00:00.000000

PERMANENT TABLE — unlike the rest of the Awards feature (award_categories,
award_nominations, award_candidates, award_votes, award_settings, which are
temporary and meant to be dropped after the event), user_award_wins is a
permanent achievement record shown on a member's profile and must be kept.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f4a5b6c7d8e9"
down_revision: Union[str, None] = "e3f4a5b6c7d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_award_wins",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("award_name", sa.String(length=255), nullable=False),
        sa.Column("award_icon", sa.String(length=10), nullable=True),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("awarded_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
    )
    op.create_index("idx_user_award_wins_user", "user_award_wins", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_user_award_wins_user", table_name="user_award_wins")
    op.drop_table("user_award_wins")

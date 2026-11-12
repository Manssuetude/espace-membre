"""awards_ceremony_teasing_and_editions

Revision ID: c7d8e9f0a1b2
Revises: b6c7d8e9f0a1
Create Date: 2026-11-12 00:00:00.000000

Extends the Awards feature with: a teasing phase (per-category reveal dates), an
edition year, a ceremony linked to a session, a 3-position email mode, per-email
anti-duplicate timestamps, a running order for the ceremony, and a dedicated
award_winners table (recorded during ceremony preparation, read at publication).
user_award_wins (permanent) gains is_co_winner.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, None] = "b6c7d8e9f0a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # award_categories: teasing reveal date + ceremony running order
    op.add_column("award_categories", sa.Column("reveal_at", sa.DateTime(), nullable=True))
    op.add_column("award_categories", sa.Column("ceremony_order", sa.Integer(), nullable=True))

    # award_winners: recorded during ceremony preparation, read at publication
    op.create_table(
        "award_winners",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("award_candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
    )
    op.create_index("idx_award_winners_category", "award_winners", ["category_id"], unique=False)
    op.create_index("idx_award_winners_unique", "award_winners", ["category_id", "candidate_id"], unique=True)

    # award_settings: edition, teasing, ceremony session, email mode + anti-duplicate timestamps
    op.add_column("award_settings", sa.Column("edition_year", sa.Integer(), nullable=False, server_default=sa.text("EXTRACT(YEAR FROM NOW())::int")))
    op.add_column("award_settings", sa.Column("teasing_start_at", sa.DateTime(), nullable=True))
    op.add_column("award_settings", sa.Column("ceremony_session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True))
    op.add_column("award_settings", sa.Column("email_mode", sa.String(length=10), nullable=False, server_default="off"))
    op.add_column("award_settings", sa.Column("teasing_email_sent_at", sa.DateTime(), nullable=True))
    op.add_column("award_settings", sa.Column("nominations_open_email_sent_at", sa.DateTime(), nullable=True))
    op.add_column("award_settings", sa.Column("vote_open_email_sent_at", sa.DateTime(), nullable=True))

    # user_award_wins (permanent): co-winner flag
    op.add_column("user_award_wins", sa.Column("is_co_winner", sa.Boolean(), nullable=False, server_default=sa.false()))

    # RLS, matching every other award_* table (app connects as table owner, bypasses RLS;
    # this only closes the unused PostgREST surface - see 60088fd4ce6d / b6c7d8e9f0a1)
    op.execute("ALTER TABLE public.award_winners ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_column("user_award_wins", "is_co_winner")

    op.drop_column("award_settings", "vote_open_email_sent_at")
    op.drop_column("award_settings", "nominations_open_email_sent_at")
    op.drop_column("award_settings", "teasing_email_sent_at")
    op.drop_column("award_settings", "email_mode")
    op.drop_column("award_settings", "ceremony_session_id")
    op.drop_column("award_settings", "teasing_start_at")
    op.drop_column("award_settings", "edition_year")

    op.drop_index("idx_award_winners_unique", table_name="award_winners")
    op.drop_index("idx_award_winners_category", table_name="award_winners")
    op.drop_table("award_winners")

    op.drop_column("award_categories", "ceremony_order")
    op.drop_column("award_categories", "reveal_at")

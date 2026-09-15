"""add_commission_support_to_award_wins

Revision ID: a5b6c7d8e9f0
Revises: f4a5b6c7d8e9
Create Date: 2026-09-15 00:00:00.000000

Extends the permanent user_award_wins table to also support collective prizes
awarded to a commission, not just individual members.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a5b6c7d8e9f0"
down_revision: Union[str, None] = "f4a5b6c7d8e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("user_award_wins", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    op.add_column(
        "user_award_wins",
        sa.Column("commission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("commissions.id", ondelete="CASCADE"), nullable=True),
    )
    op.create_index("idx_user_award_wins_commission", "user_award_wins", ["commission_id"], unique=False)
    op.create_check_constraint(
        "ck_award_win_single_target",
        "user_award_wins",
        "(user_id IS NOT NULL AND commission_id IS NULL) OR (user_id IS NULL AND commission_id IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_award_win_single_target", "user_award_wins", type_="check")
    op.drop_index("idx_user_award_wins_commission", table_name="user_award_wins")
    op.drop_column("user_award_wins", "commission_id")
    op.alter_column("user_award_wins", "user_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)

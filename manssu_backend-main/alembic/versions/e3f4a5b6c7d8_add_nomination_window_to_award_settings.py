"""add_nomination_window_to_award_settings

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-09-15 00:00:00.000000

Adds a global nomination window (start/end), mirroring the existing vote
window. Categories still in the nomination phase before the window opens
are hidden from regular members (see AwardService.get_categories).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3f4a5b6c7d8"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("award_settings", sa.Column("nomination_start_at", sa.DateTime(), nullable=True))
    op.add_column("award_settings", sa.Column("nomination_end_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("award_settings", "nomination_end_at")
    op.drop_column("award_settings", "nomination_start_at")

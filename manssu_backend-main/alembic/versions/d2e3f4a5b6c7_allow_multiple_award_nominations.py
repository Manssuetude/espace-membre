"""allow_multiple_award_nominations

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-09-14 00:30:00.000000

A member can now propose several nominees per category (not just one), as
long as they don't nominate the exact same person/commission twice.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "c1d2e3f4a5b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("idx_award_nominations_unique", table_name="award_nominations")
    op.create_index(
        "idx_award_nominations_unique_user",
        "award_nominations",
        ["category_id", "proposed_by_user_id", "nominated_user_id"],
        unique=True,
    )
    op.create_index(
        "idx_award_nominations_unique_commission",
        "award_nominations",
        ["category_id", "proposed_by_user_id", "nominated_commission_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("idx_award_nominations_unique_commission", table_name="award_nominations")
    op.drop_index("idx_award_nominations_unique_user", table_name="award_nominations")
    op.create_index(
        "idx_award_nominations_unique",
        "award_nominations",
        ["category_id", "proposed_by_user_id"],
        unique=True,
    )

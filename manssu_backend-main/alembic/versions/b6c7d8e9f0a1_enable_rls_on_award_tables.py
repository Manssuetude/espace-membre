"""enable_rls_on_award_tables

Revision ID: b6c7d8e9f0a1
Revises: a5b6c7d8e9f0
Create Date: 2026-09-28 00:00:00.000000

Same fix as 60088fd4ce6d, applied to the award tables that were created
after it: Supabase's linter flags any public table without RLS as
readable/writable via PostgREST. The app never uses PostgREST - it connects
directly as the table owner, which bypasses RLS regardless - so enabling
RLS with no policies just closes off that unused API surface.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b6c7d8e9f0a1"
down_revision: Union[str, None] = "a5b6c7d8e9f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = [
    "award_categories",
    "award_nominations",
    "award_candidates",
    "award_votes",
    "award_settings",
    "user_award_wins",
]


def upgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")

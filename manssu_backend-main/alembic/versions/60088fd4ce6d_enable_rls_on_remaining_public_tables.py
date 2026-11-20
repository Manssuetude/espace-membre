"""enable rls on remaining public tables

Revision ID: 60088fd4ce6d
Revises: a7b6c5d4e3f2
Create Date: 2026-08-15 00:28:31.937145

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '60088fd4ce6d'
down_revision: Union[str, None] = 'a7b6c5d4e3f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = [
    "book_notifications",
    "book_requests",
    "book_wishlist_items",
    "commission_applications",
    "commission_members",
    "poll_questions",
]


def upgrade() -> None:
    # These tables were flagged by Supabase's linter as publicly readable/writable
    # via PostgREST (RLS off = no filtering for the anon/authenticated API roles).
    # The app never uses PostgREST/supabase-js — it connects directly as the table
    # owner, which bypasses RLS regardless — so enabling RLS with no policies just
    # closes off that unused API surface, matching every other table in this schema.
    for table in TABLES:
        op.execute(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY")


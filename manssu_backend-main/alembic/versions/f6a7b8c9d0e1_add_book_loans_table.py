"""add_book_loans_table

Revision ID: f6a7b8c9d0e1
Revises: e1f2a3b4c5d6
Create Date: 2026-03-06 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "book_loans",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "borrower_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "source_request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("book_requests.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="pending_handover",
        ),
        sa.Column("planned_start_at", sa.DateTime(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("due_at", sa.DateTime(), nullable=True),
        sa.Column("returned_at", sa.DateTime(), nullable=True),
        sa.Column("owner_handover_confirmed_at", sa.DateTime(), nullable=True),
        sa.Column("borrower_handover_confirmed_at", sa.DateTime(), nullable=True),
        sa.Column("borrower_return_confirmed_at", sa.DateTime(), nullable=True),
        sa.Column("owner_return_confirmed_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
    )

    op.create_index("ix_book_loans_book_id", "book_loans", ["book_id"], unique=False)
    op.create_index("ix_book_loans_owner_id", "book_loans", ["owner_id"], unique=False)
    op.create_index("ix_book_loans_borrower_id", "book_loans", ["borrower_id"], unique=False)
    op.create_index("ix_book_loans_source_request_id", "book_loans", ["source_request_id"], unique=False)
    op.create_index("ix_book_loans_status", "book_loans", ["status"], unique=False)
    op.create_index("ix_book_loans_due_at", "book_loans", ["due_at"], unique=False)
    op.create_index(
        "idx_book_loans_book_status", "book_loans", ["book_id", "status"], unique=False
    )
    op.create_index(
        "idx_book_loans_owner_status", "book_loans", ["owner_id", "status"], unique=False
    )
    op.create_index(
        "idx_book_loans_borrower_status", "book_loans", ["borrower_id", "status"], unique=False
    )


def downgrade() -> None:
    op.drop_index("idx_book_loans_borrower_status", table_name="book_loans")
    op.drop_index("idx_book_loans_owner_status", table_name="book_loans")
    op.drop_index("idx_book_loans_book_status", table_name="book_loans")
    op.drop_index("ix_book_loans_due_at", table_name="book_loans")
    op.drop_index("ix_book_loans_status", table_name="book_loans")
    op.drop_index("ix_book_loans_source_request_id", table_name="book_loans")
    op.drop_index("ix_book_loans_borrower_id", table_name="book_loans")
    op.drop_index("ix_book_loans_owner_id", table_name="book_loans")
    op.drop_index("ix_book_loans_book_id", table_name="book_loans")
    op.drop_table("book_loans")


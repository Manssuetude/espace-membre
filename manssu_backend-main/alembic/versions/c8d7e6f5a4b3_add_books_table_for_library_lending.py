"""add_books_table_for_library_lending

Revision ID: c8d7e6f5a4b3
Revises: b2c3d4e5f6a7
Create Date: 2026-03-06 20:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c8d7e6f5a4b3"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "books",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("language", sa.String(length=50), nullable=True),
        sa.Column("condition", sa.String(length=30), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("availability_mode", sa.String(length=20), nullable=False, server_default="always"),
        sa.Column("available_from", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="available"),
        sa.Column("default_loan_days", sa.Integer(), nullable=True),
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

    op.create_index("ix_books_owner_id", "books", ["owner_id"], unique=False)
    op.create_index("ix_books_title", "books", ["title"], unique=False)
    op.create_index("ix_books_author", "books", ["author"], unique=False)
    op.create_index("ix_books_category", "books", ["category"], unique=False)
    op.create_index("ix_books_availability_mode", "books", ["availability_mode"], unique=False)
    op.create_index("ix_books_available_from", "books", ["available_from"], unique=False)
    op.create_index("ix_books_status", "books", ["status"], unique=False)
    op.create_index("idx_books_owner_status", "books", ["owner_id", "status"], unique=False)
    op.create_index("idx_books_category_status", "books", ["category", "status"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_books_category_status", table_name="books")
    op.drop_index("idx_books_owner_status", table_name="books")
    op.drop_index("ix_books_status", table_name="books")
    op.drop_index("ix_books_available_from", table_name="books")
    op.drop_index("ix_books_availability_mode", table_name="books")
    op.drop_index("ix_books_category", table_name="books")
    op.drop_index("ix_books_author", table_name="books")
    op.drop_index("ix_books_title", table_name="books")
    op.drop_index("ix_books_owner_id", table_name="books")
    op.drop_table("books")


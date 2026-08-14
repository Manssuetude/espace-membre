"""add_wishlist_and_library_notifications_tables

Revision ID: a7b6c5d4e3f2
Revises: f6a7b8c9d0e1
Create Date: 2026-03-06 21:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a7b6c5d4e3f2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "book_wishlist_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
    op.create_index("ix_book_wishlist_items_user_id", "book_wishlist_items", ["user_id"], unique=False)
    op.create_index("ix_book_wishlist_items_title", "book_wishlist_items", ["title"], unique=False)
    op.create_index("ix_book_wishlist_items_author", "book_wishlist_items", ["author"], unique=False)
    op.create_index("ix_book_wishlist_items_category", "book_wishlist_items", ["category"], unique=False)
    op.create_index("ix_book_wishlist_items_is_active", "book_wishlist_items", ["is_active"], unique=False)
    op.create_index(
        "idx_book_wishlist_user_active",
        "book_wishlist_items",
        ["user_id", "is_active"],
        unique=False,
    )

    op.create_table(
        "book_notifications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
    )
    op.create_index("ix_book_notifications_user_id", "book_notifications", ["user_id"], unique=False)
    op.create_index("ix_book_notifications_type", "book_notifications", ["type"], unique=False)
    op.create_index("ix_book_notifications_read_at", "book_notifications", ["read_at"], unique=False)
    op.create_index("ix_book_notifications_created_at", "book_notifications", ["created_at"], unique=False)
    op.create_index(
        "idx_book_notifications_user_created",
        "book_notifications",
        ["user_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_book_notifications_user_created", table_name="book_notifications")
    op.drop_index("ix_book_notifications_created_at", table_name="book_notifications")
    op.drop_index("ix_book_notifications_read_at", table_name="book_notifications")
    op.drop_index("ix_book_notifications_type", table_name="book_notifications")
    op.drop_index("ix_book_notifications_user_id", table_name="book_notifications")
    op.drop_table("book_notifications")

    op.drop_index("idx_book_wishlist_user_active", table_name="book_wishlist_items")
    op.drop_index("ix_book_wishlist_items_is_active", table_name="book_wishlist_items")
    op.drop_index("ix_book_wishlist_items_category", table_name="book_wishlist_items")
    op.drop_index("ix_book_wishlist_items_author", table_name="book_wishlist_items")
    op.drop_index("ix_book_wishlist_items_title", table_name="book_wishlist_items")
    op.drop_index("ix_book_wishlist_items_user_id", table_name="book_wishlist_items")
    op.drop_table("book_wishlist_items")


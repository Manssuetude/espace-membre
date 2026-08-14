"""add_book_requests_table

Revision ID: e1f2a3b4c5d6
Revises: c8d7e6f5a4b3
Create Date: 2026-03-06 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "c8d7e6f5a4b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "book_requests",
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
            "requester_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="queued"),
        sa.Column("queue_position", sa.Integer(), nullable=True),
        sa.Column("offered_at", sa.DateTime(), nullable=True),
        sa.Column("offer_expires_at", sa.DateTime(), nullable=True),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
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

    op.create_index("ix_book_requests_book_id", "book_requests", ["book_id"], unique=False)
    op.create_index("ix_book_requests_requester_id", "book_requests", ["requester_id"], unique=False)
    op.create_index("ix_book_requests_status", "book_requests", ["status"], unique=False)
    op.create_index("ix_book_requests_queue_position", "book_requests", ["queue_position"], unique=False)
    op.create_index("ix_book_requests_offer_expires_at", "book_requests", ["offer_expires_at"], unique=False)
    op.create_index(
        "idx_book_requests_book_status",
        "book_requests",
        ["book_id", "status"],
        unique=False,
    )
    op.create_index(
        "idx_book_requests_book_queue",
        "book_requests",
        ["book_id", "queue_position"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_book_requests_book_queue", table_name="book_requests")
    op.drop_index("idx_book_requests_book_status", table_name="book_requests")
    op.drop_index("ix_book_requests_offer_expires_at", table_name="book_requests")
    op.drop_index("ix_book_requests_queue_position", table_name="book_requests")
    op.drop_index("ix_book_requests_status", table_name="book_requests")
    op.drop_index("ix_book_requests_requester_id", table_name="book_requests")
    op.drop_index("ix_book_requests_book_id", table_name="book_requests")
    op.drop_table("book_requests")


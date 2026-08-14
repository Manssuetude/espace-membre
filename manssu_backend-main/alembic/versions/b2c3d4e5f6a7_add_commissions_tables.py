"""add_commissions_tables

Revision ID: b2c3d4e5f6a7
Revises: 7fed6787b918
Create Date: 2026-02-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "7fed6787b918"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Commission table
    op.create_table(
        "commissions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("name", sa.String(length=100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("max_members", sa.Integer(), nullable=True),
        sa.Column(
            "leader_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
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
    op.create_index(
        "idx_commissions_status",
        "commissions",
        ["status"],
        unique=False,
    )
    op.create_index(
        "idx_commissions_leader",
        "commissions",
        ["leader_id"],
        unique=False,
    )

    # Commission members table
    op.create_table(
        "commission_members",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "commission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("commissions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
    )
    op.create_index(
        "idx_commission_members_commission",
        "commission_members",
        ["commission_id"],
        unique=False,
    )
    op.create_index(
        "idx_commission_members_user",
        "commission_members",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "idx_commission_members_unique",
        "commission_members",
        ["commission_id", "user_id"],
        unique=True,
    )

    # Commission applications table
    op.create_table(
        "commission_applications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "commission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("commissions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column(
            "reviewed_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
    )
    op.create_index(
        "idx_commission_applications_commission",
        "commission_applications",
        ["commission_id"],
        unique=False,
    )
    op.create_index(
        "idx_commission_applications_user",
        "commission_applications",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "idx_commission_applications_pending",
        "commission_applications",
        ["commission_id", "status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_commission_applications_pending", table_name="commission_applications")
    op.drop_index("idx_commission_applications_user", table_name="commission_applications")
    op.drop_index("idx_commission_applications_commission", table_name="commission_applications")
    op.drop_table("commission_applications")

    op.drop_index("idx_commission_members_unique", table_name="commission_members")
    op.drop_index("idx_commission_members_user", table_name="commission_members")
    op.drop_index("idx_commission_members_commission", table_name="commission_members")
    op.drop_table("commission_members")

    op.drop_index("idx_commissions_leader", table_name="commissions")
    op.drop_index("idx_commissions_status", table_name="commissions")
    op.drop_table("commissions")


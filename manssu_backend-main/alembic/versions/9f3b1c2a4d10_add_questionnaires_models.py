"""add_questionnaires_models

Revision ID: 9f3b1c2a4d10
Revises: 85bbb2624e6a
Create Date: 2026-01-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "9f3b1c2a4d10"
down_revision: Union[str, None] = "85bbb2624e6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Questionnaire table
    op.create_table(
        "questionnaires",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("edit_window_minutes", sa.Integer(), nullable=True),
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
        "idx_questionnaires_status",
        "questionnaires",
        ["status"],
        unique=False,
    )
    op.create_index(
        "idx_questionnaires_start_end",
        "questionnaires",
        ["start_date", "end_date"],
        unique=False,
    )

    # Questionnaire questions
    op.create_table(
        "questionnaire_questions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "questionnaire_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questionnaires.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("type", sa.String(length=30), nullable=False, server_default="single_choice"),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
    )
    op.create_index(
        "idx_questionnaire_questions_questionnaire",
        "questionnaire_questions",
        ["questionnaire_id"],
        unique=False,
    )

    # Questionnaire options
    op.create_table(
        "questionnaire_options",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questionnaire_questions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
    )
    op.create_index(
        "idx_questionnaire_options_question",
        "questionnaire_options",
        ["question_id"],
        unique=False,
    )

    # Questionnaire responses
    op.create_table(
        "questionnaire_responses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "questionnaire_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questionnaires.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="in_progress",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("edit_until", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_questionnaire_responses_unique_user",
        "questionnaire_responses",
        ["questionnaire_id", "user_id"],
        unique=True,
    )

    # Questionnaire answers
    op.create_table(
        "questionnaire_answers",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "response_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questionnaire_responses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "question_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("questionnaire_questions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("answer", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
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
        "idx_questionnaire_answers_unique",
        "questionnaire_answers",
        ["response_id", "question_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("idx_questionnaire_answers_unique", table_name="questionnaire_answers")
    op.drop_table("questionnaire_answers")

    op.drop_index("idx_questionnaire_responses_unique_user", table_name="questionnaire_responses")
    op.drop_table("questionnaire_responses")

    op.drop_index("idx_questionnaire_options_question", table_name="questionnaire_options")
    op.drop_table("questionnaire_options")

    op.drop_index("idx_questionnaire_questions_questionnaire", table_name="questionnaire_questions")
    op.drop_table("questionnaire_questions")

    op.drop_index("idx_questionnaires_start_end", table_name="questionnaires")
    op.drop_index("idx_questionnaires_status", table_name="questionnaires")
    op.drop_table("questionnaires")



"""add_award_tables

Revision ID: c1d2e3f4a5b6
Revises: 60088fd4ce6d
Create Date: 2026-09-14 00:00:00.000000

Temporary feature (Awards 2026): nomination + vote system for the association's
internal awards. Meant to be removed (code + this migration downgraded, or the
tables archived) after the event. See app/models/award.py.
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, None] = "60088fd4ce6d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


CATEGORIES = [
    ("Monsieur/Madame Discours", "Le/la plus éloquent(e) en débat", "🎤", "member"),
    ("Monsieur/Madame Responsable", "Implication exceptionnelle sur un poste à responsabilité", "🧭", "member"),
    ("Monsieur/Madame Ponctualité", None, "⏰", "member"),
    ("Monsieur/Madame Retard", "Clin d'œil au prix Ponctualité", "🐢", "member"),
    ("Monsieur/Madame Ambiance", "Jovial(e), fait vivre le groupe", "🎉", "member"),
    ("Monsieur/Madame Style", None, "👗", "member"),
    ("Monsieur/Madame Avis Tranché", "Toujours un point de vue sur tout sujet, participe à toutes les séances de débat", "🗣️", "member"),
    ("Meilleure Commission de l'année", "Prix collectif", "🏆", "commission"),
    ("La Bibliothèque", "Grande culture, vient toujours préparé(e)", "📚", "member"),
    ("Monsieur/Madame Émotif", "Met le cœur dedans", "❤️", "member"),
    ("Le Fantôme", "Pas toujours présent(e), mais marque les esprits quand il/elle vient", "👻", "member"),
    ("Prix collectif", "Catégorie à définir par Emmanuelle — nom et modalités ajustables par l'admin", "🎁", "member"),
]


def upgrade() -> None:
    op.create_table(
        "award_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=10), nullable=True),
        sa.Column("target_type", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("nominations_open", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("results_published_at", sa.DateTime(), nullable=True),
        sa.Column("order_index", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
    )

    op.create_table(
        "award_nominations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nominated_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("nominated_commission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("commissions.id", ondelete="CASCADE"), nullable=True),
        sa.Column("proposed_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
        sa.CheckConstraint(
            "(nominated_user_id IS NOT NULL AND nominated_commission_id IS NULL) OR "
            "(nominated_user_id IS NULL AND nominated_commission_id IS NOT NULL)",
            name="ck_award_nomination_single_target",
        ),
    )
    op.create_index("idx_award_nominations_category", "award_nominations", ["category_id"], unique=False)
    op.create_index("idx_award_nominations_nominated_user", "award_nominations", ["nominated_user_id"], unique=False)
    op.create_index("idx_award_nominations_nominated_commission", "award_nominations", ["nominated_commission_id"], unique=False)
    op.create_index("idx_award_nominations_proposed_by", "award_nominations", ["proposed_by_user_id"], unique=False)
    op.create_index("idx_award_nominations_unique", "award_nominations", ["category_id", "proposed_by_user_id"], unique=True)

    op.create_table(
        "award_candidates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("nominated_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
        sa.Column("nominated_commission_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("commissions.id", ondelete="CASCADE"), nullable=True),
        sa.Column("nomination_count", sa.Integer(), server_default="0"),
        sa.Column("votes", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
        sa.CheckConstraint(
            "(nominated_user_id IS NOT NULL AND nominated_commission_id IS NULL) OR "
            "(nominated_user_id IS NULL AND nominated_commission_id IS NOT NULL)",
            name="ck_award_candidate_single_target",
        ),
    )
    op.create_index("idx_award_candidates_category", "award_candidates", ["category_id"], unique=False)
    op.create_index("idx_award_candidates_unique_user", "award_candidates", ["category_id", "nominated_user_id"], unique=True)
    op.create_index("idx_award_candidates_unique_commission", "award_candidates", ["category_id", "nominated_commission_id"], unique=True)

    op.create_table(
        "award_votes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("award_candidates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("voter_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("voted_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
    )
    op.create_index("idx_award_votes_category", "award_votes", ["category_id"], unique=False)
    op.create_index("idx_award_votes_candidate", "award_votes", ["candidate_id"], unique=False)
    op.create_index("idx_award_votes_voter", "award_votes", ["voter_user_id"], unique=False)
    op.create_index("idx_award_votes_unique", "award_votes", ["category_id", "voter_user_id"], unique=True)

    op.create_table(
        "award_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("vote_start_at", sa.DateTime(), nullable=True),
        sa.Column("vote_end_at", sa.DateTime(), nullable=True),
        sa.Column("reminder_sent_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("TIMEZONE('utc', NOW())")),
    )

    # Seed the 12 initial award categories
    award_categories_table = sa.table(
        "award_categories",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
        sa.column("icon", sa.String),
        sa.column("target_type", sa.String),
        sa.column("order_index", sa.Integer),
    )
    op.bulk_insert(
        award_categories_table,
        [
            {
                "id": uuid.uuid4(),
                "name": name,
                "description": description,
                "icon": icon,
                "target_type": target_type,
                "order_index": index,
            }
            for index, (name, description, icon, target_type) in enumerate(CATEGORIES)
        ],
    )


def downgrade() -> None:
    op.drop_table("award_settings")

    op.drop_index("idx_award_votes_unique", table_name="award_votes")
    op.drop_index("idx_award_votes_voter", table_name="award_votes")
    op.drop_index("idx_award_votes_candidate", table_name="award_votes")
    op.drop_index("idx_award_votes_category", table_name="award_votes")
    op.drop_table("award_votes")

    op.drop_index("idx_award_candidates_unique_commission", table_name="award_candidates")
    op.drop_index("idx_award_candidates_unique_user", table_name="award_candidates")
    op.drop_index("idx_award_candidates_category", table_name="award_candidates")
    op.drop_table("award_candidates")

    op.drop_index("idx_award_nominations_unique", table_name="award_nominations")
    op.drop_index("idx_award_nominations_proposed_by", table_name="award_nominations")
    op.drop_index("idx_award_nominations_nominated_commission", table_name="award_nominations")
    op.drop_index("idx_award_nominations_nominated_user", table_name="award_nominations")
    op.drop_index("idx_award_nominations_category", table_name="award_nominations")
    op.drop_table("award_nominations")

    op.drop_table("award_categories")

from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class AwardCategory(Base):
    __tablename__ = "award_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(10), nullable=True)  # emoji
    target_type = Column(String(20), nullable=False, default="member")  # member, commission
    nominations_open = Column(Boolean, nullable=False, default=True)
    results_published_at = Column(DateTime, nullable=True)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    nominations = relationship("AwardNomination", back_populates="category", cascade="all, delete-orphan")
    candidates = relationship("AwardCandidate", back_populates="category", cascade="all, delete-orphan")


class AwardNomination(Base):
    __tablename__ = "award_nominations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    nominated_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    nominated_commission_id = Column(UUID(as_uuid=True), ForeignKey("commissions.id", ondelete="CASCADE"), nullable=True, index=True)
    proposed_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    category = relationship("AwardCategory", back_populates="nominations")
    nominated_user = relationship("User", foreign_keys=[nominated_user_id])
    nominated_commission = relationship("Commission", foreign_keys=[nominated_commission_id])
    proposed_by = relationship("User", foreign_keys=[proposed_by_user_id])

    # A member can propose several nominees per category, but not the same nominee twice
    __table_args__ = (
        Index('idx_award_nominations_unique_user', 'category_id', 'proposed_by_user_id', 'nominated_user_id', unique=True),
        Index('idx_award_nominations_unique_commission', 'category_id', 'proposed_by_user_id', 'nominated_commission_id', unique=True),
        CheckConstraint(
            "(nominated_user_id IS NOT NULL AND nominated_commission_id IS NULL) OR "
            "(nominated_user_id IS NULL AND nominated_commission_id IS NOT NULL)",
            name="ck_award_nomination_single_target"
        ),
    )


class AwardCandidate(Base):
    """Final shortlist entry for a category, built by an admin from AwardNomination stats."""
    __tablename__ = "award_candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    nominated_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    nominated_commission_id = Column(UUID(as_uuid=True), ForeignKey("commissions.id", ondelete="CASCADE"), nullable=True, index=True)
    nomination_count = Column(Integer, default=0)  # snapshot of how many members proposed this nominee
    votes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    category = relationship("AwardCategory", back_populates="candidates")
    nominated_user = relationship("User", foreign_keys=[nominated_user_id])
    nominated_commission = relationship("Commission", foreign_keys=[nominated_commission_id])
    award_votes = relationship("AwardVote", back_populates="candidate", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_award_candidates_unique_user', 'category_id', 'nominated_user_id', unique=True),
        Index('idx_award_candidates_unique_commission', 'category_id', 'nominated_commission_id', unique=True),
        CheckConstraint(
            "(nominated_user_id IS NOT NULL AND nominated_commission_id IS NULL) OR "
            "(nominated_user_id IS NULL AND nominated_commission_id IS NOT NULL)",
            name="ck_award_candidate_single_target"
        ),
    )


class AwardVote(Base):
    __tablename__ = "award_votes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(UUID(as_uuid=True), ForeignKey("award_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("award_candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    voter_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    voted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    category = relationship("AwardCategory")
    candidate = relationship("AwardCandidate", back_populates="award_votes")
    voter = relationship("User", foreign_keys=[voter_user_id])

    # One vote per member per category
    __table_args__ = (
        Index('idx_award_votes_unique', 'category_id', 'voter_user_id', unique=True),
    )


class AwardSettings(Base):
    """Singleton row holding the global nomination-to-vote event window."""
    __tablename__ = "award_settings"

    id = Column(Integer, primary_key=True)
    nomination_start_at = Column(DateTime, nullable=True)
    nomination_end_at = Column(DateTime, nullable=True)
    vote_start_at = Column(DateTime, nullable=True)
    vote_end_at = Column(DateTime, nullable=True)
    reminder_sent_at = Column(DateTime, nullable=True)  # guards against duplicate J-1 reminder emails
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

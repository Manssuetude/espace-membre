from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=True)  # NULL for OTP-only auth
    role = Column(String(20), nullable=False, default="member", index=True)  # member, admin, super_admin, guest
    status = Column(String(20), nullable=False, default="active", index=True)  # active, suspended
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    postal_code = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    member_since = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    submitted_themes = relationship("Theme", back_populates="submitted_by_user", foreign_keys="Theme.submitted_by")
    reviewed_themes = relationship("Theme", back_populates="reviewed_by_user", foreign_keys="Theme.reviewed_by")
    created_windows = relationship("ThemeProposalWindow", back_populates="creator")
    session_registrations = relationship("SessionRegistration", back_populates="user", cascade="all, delete-orphan")
    work_group_memberships = relationship("WorkGroupMember", back_populates="user", cascade="all, delete-orphan")
    created_resources = relationship("Resource", back_populates="creator", foreign_keys="Resource.created_by")
    poll_votes = relationship("PollVote", back_populates="user", cascade="all, delete-orphan")
    questionnaire_responses = relationship(
        "QuestionnaireResponse",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    feedbacks = relationship("Feedback", back_populates="submitter")


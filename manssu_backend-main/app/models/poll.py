from sqlalchemy import Column, String, Integer, Boolean, Date, DateTime, DECIMAL, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Poll(Base):
    __tablename__ = "polls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="draft", index=True)  # draft, active, completed
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    total_responses = Column(Integer, default=0)
    total_members = Column(Integer, default=0)
    participation = Column(DECIMAL(5, 2), nullable=True)  # Percentage
    results_visibility = Column(String(20), default="realtime")  # realtime, hidden
    anonymous = Column(Boolean, default=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    days_left = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="polls")
    questions = relationship("PollQuestion", back_populates="poll", cascade="all, delete-orphan", order_by="PollQuestion.order_index")
    votes = relationship("PollVote", back_populates="poll", cascade="all, delete-orphan")


class PollQuestion(Base):
    __tablename__ = "poll_questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    description = Column(Text, nullable=True)  # Optional description per question
    single_response = Column(Boolean, default=True)  # Whether this question allows single or multiple responses
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    poll = relationship("Poll", back_populates="questions")
    options = relationship("PollOption", back_populates="question", cascade="all, delete-orphan", order_by="PollOption.order_index")
    votes = relationship("PollVote", back_populates="question", cascade="all, delete-orphan")


class PollOption(Base):
    __tablename__ = "poll_options"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("poll_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    votes = Column(Integer, default=0)
    percentage = Column(DECIMAL(5, 2), default=0)
    color = Column(String(20), nullable=True)  # primary, accent, secondary, success
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    question = relationship("PollQuestion", back_populates="options")
    poll_votes = relationship("PollVote", back_populates="option", cascade="all, delete-orphan")


class PollVote(Base):
    __tablename__ = "poll_votes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poll_id = Column(UUID(as_uuid=True), ForeignKey("polls.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("poll_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    option_id = Column(UUID(as_uuid=True), ForeignKey("poll_options.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    voted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    poll = relationship("Poll", back_populates="votes")
    question = relationship("PollQuestion", back_populates="votes")
    option = relationship("PollOption", back_populates="poll_votes")
    user = relationship("User", back_populates="poll_votes")
    
    # Unique constraint: one vote per user per option per question
    # This allows multiple votes per user per question (one per option)
    # Works for both single and multiple response polls
    __table_args__ = (
        Index('idx_poll_votes_unique', 'question_id', 'user_id', 'option_id', unique=True),
    )


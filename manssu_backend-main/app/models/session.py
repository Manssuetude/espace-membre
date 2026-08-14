from sqlalchemy import Column, String, Integer, Boolean, Date, Time, DateTime, DECIMAL, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)  # Optional description of the session
    theme = Column(String(255), nullable=True)  # Optional, can be from themes table or custom
    type = Column(String(50), nullable=False, index=True)  # workshop, conference, group, individual
    date = Column(Date, nullable=True, index=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration = Column(String(20), nullable=True)  # e.g., "2h"
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="SET NULL"), nullable=True, index=True)
    location_address = Column(Text, nullable=True)  # Legacy: can store custom address if not using location_id
    location_instructions = Column(Text, nullable=True)  # Legacy: can store custom instructions if not using location_id
    is_online = Column(Boolean, default=False)
    max_participants = Column(Integer, nullable=False)
    registered = Column(Integer, default=0)
    active_members_at_creation = Column(Integer, nullable=True)  # Number of active members when session was created
    status = Column(String(20), nullable=False, default="upcoming", index=True)  # upcoming, ongoing, completed, cancelled
    attendance_rate = Column(DECIMAL(5, 2), nullable=True)  # Percentage
    rating_reminder_sent = Column(Boolean, default=False)  # Whether rating reminder email was already sent
    average_grade = Column(DECIMAL(3, 2), nullable=True)  # Out of 5
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    location = relationship("Location", back_populates="sessions")
    objectives = relationship("SessionObjective", back_populates="session", cascade="all, delete-orphan")
    registrations = relationship("SessionRegistration", back_populates="session", cascade="all, delete-orphan")
    work_groups = relationship("WorkGroup", back_populates="session", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="session")
    polls = relationship("Poll", back_populates="session")
    feedbacks = relationship("Feedback", back_populates="session")


class SessionObjective(Base):
    __tablename__ = "session_objectives"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    objective = Column(Text, nullable=False)
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="objectives")


class SessionRegistration(Base):
    __tablename__ = "session_registrations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    attended = Column(Boolean, default=False)
    rating = Column(Integer, nullable=True)  # 1-5
    comment = Column(Text, nullable=True)
    rated_at = Column(DateTime, nullable=True)  # Timestamp when rating was submitted
    
    # Relationships
    session = relationship("Session", back_populates="registrations")
    user = relationship("User", back_populates="session_registrations")
    
    # Unique constraint: one registration per user per session
    __table_args__ = (
        Index('idx_registrations_unique', 'session_id', 'user_id', unique=True),
    )


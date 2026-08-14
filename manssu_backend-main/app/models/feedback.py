from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Feedback(Base):
    __tablename__ = "feedbacks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(50), nullable=False, index=True)  # Session, Général, etc.
    type = Column(String(50), nullable=False)  # Suggestion, Compliment, etc.
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    anonymous = Column(Boolean, default=False)
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), nullable=False, default="new", index=True)  # new, read, resolved
    rating = Column(Integer, nullable=True)  # 1-5 (for session feedbacks)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    submitter = relationship("User", back_populates="feedbacks")
    session = relationship("Session", back_populates="feedbacks")


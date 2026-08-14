from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class InvitationRequest(Base):
    __tablename__ = "invitation_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)  # Why does the member want to invite this person
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, approved, rejected
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", backref="invitation_requests")
    requester = relationship("User", foreign_keys=[requested_by], backref="invitation_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviewed_invitation_requests")


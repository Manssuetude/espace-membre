from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class SessionInvite(Base):
    __tablename__ = "session_invites"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(32), unique=True, nullable=False, index=True)  # Unique invite code
    email = Column(String(255), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, used, expired, cancelled
    used_at = Column(DateTime, nullable=True)
    used_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", backref="invites")
    creator = relationship("User", foreign_keys=[created_by], backref="created_invites")
    user = relationship("User", foreign_keys=[used_by], backref="used_invites")
    
    # Index to ensure one pending invite per email
    __table_args__ = (
        Index('idx_pending_invite_per_email', 'email', 'status', unique=False),
    )





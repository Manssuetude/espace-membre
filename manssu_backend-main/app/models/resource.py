from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String(20), nullable=False, index=True)  # file, video, audio, folder
    link = Column(String(500), nullable=False)
    folder_description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    file_path = Column(String(500), nullable=True)  # For uploaded files
    file_size = Column(Integer, nullable=True)  # In bytes
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, approved, rejected
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="resources")
    creator = relationship("User", back_populates="created_resources", foreign_keys=[created_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])


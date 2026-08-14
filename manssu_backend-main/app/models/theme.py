from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, Date, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class ThemeProposalWindow(Base):
    __tablename__ = "theme_proposal_windows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="created_windows")
    themes = relationship("Theme", back_populates="window")
    
    # Indexes
    __table_args__ = (
        Index('idx_windows_dates', 'start_date', 'end_date'),
    )


class Theme(Base):
    __tablename__ = "themes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, approved, rejected, current
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    window_id = Column(UUID(as_uuid=True), ForeignKey("theme_proposal_windows.id"), nullable=True, index=True)
    session_count = Column(Integer, default=0)
    next_session_date = Column(Date, nullable=True)
    last_session_date = Column(Date, nullable=True)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    submitted_by_user = relationship("User", back_populates="submitted_themes", foreign_keys=[submitted_by])
    reviewed_by_user = relationship("User", back_populates="reviewed_themes", foreign_keys=[reviewed_by])
    window = relationship("ThemeProposalWindow", back_populates="themes")


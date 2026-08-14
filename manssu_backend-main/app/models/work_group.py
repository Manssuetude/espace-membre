from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class WorkGroup(Base):
    __tablename__ = "work_groups"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    letter = Column(String(1), nullable=False)
    color = Column(String(20), nullable=False)  # primary, accent, secondary, success
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("Session", back_populates="work_groups")
    members = relationship("WorkGroupMember", back_populates="work_group", cascade="all, delete-orphan")


class WorkGroupMember(Base):
    __tablename__ = "work_group_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_group_id = Column(UUID(as_uuid=True), ForeignKey("work_groups.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_leader = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    work_group = relationship("WorkGroup", back_populates="members")
    user = relationship("User", back_populates="work_group_memberships")
    
    # Unique constraint: one membership per user per group
    __table_args__ = (
        Index('idx_group_members_unique', 'work_group_id', 'user_id', unique=True),
    )


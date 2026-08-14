from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Commission(Base):
    """
    Commission model - represents a group with a specific responsibility
    (e.g., communication, resources, IT, etc.)
    """
    __tablename__ = "commissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    max_members = Column(Integer, nullable=True)  # NULL means unlimited
    leader_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), nullable=False, default="active", index=True)  # active, archived
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leader = relationship("User", foreign_keys=[leader_id], backref="led_commissions")
    members = relationship("CommissionMember", back_populates="commission", cascade="all, delete-orphan")
    applications = relationship("CommissionApplication", back_populates="commission", cascade="all, delete-orphan")


class CommissionMember(Base):
    """
    Commission membership - tracks users who are members of a commission
    """
    __tablename__ = "commission_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commission_id = Column(UUID(as_uuid=True), ForeignKey("commissions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    commission = relationship("Commission", back_populates="members")
    user = relationship("User", backref="commission_memberships")
    
    # Unique constraint: one membership per user per commission
    __table_args__ = (
        Index('idx_commission_members_unique', 'commission_id', 'user_id', unique=True),
    )


class CommissionApplication(Base):
    """
    Commission application - tracks user applications to join a commission
    """
    __tablename__ = "commission_applications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commission_id = Column(UUID(as_uuid=True), ForeignKey("commissions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)  # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Relationships
    commission = relationship("Commission", back_populates="applications")
    user = relationship("User", foreign_keys=[user_id], backref="commission_applications")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    
    # Index for quick lookup of pending applications
    __table_args__ = (
        Index('idx_commission_applications_pending', 'commission_id', 'status'),
    )




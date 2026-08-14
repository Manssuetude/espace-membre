from sqlalchemy import Column, String, Boolean, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from datetime import datetime


class OTP(Base):
    __tablename__ = "otps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Composite index for email and code lookup
    __table_args__ = (
        Index('idx_otps_email_code', 'email', 'code'),
    )


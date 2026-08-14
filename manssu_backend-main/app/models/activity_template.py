from sqlalchemy import Column, String, Text, Integer, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class ActivityTemplate(Base):
    __tablename__ = "activity_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)  # Description of the activity template
    color = Column(String(50), nullable=True)  # Free text color (e.g., "#FF5733", "blue", "primary")
    icon = Column(String(100), nullable=True)  # Free text icon identifier (e.g., "discussion", "brainstorm", "presentation")
    rules = Column(JSONB, nullable=True)  # List of rules as JSON array of strings
    duration = Column(String(20), nullable=True)  # Duration as string (e.g., "30min", "1h", "2h30min")
    examples = Column(JSONB, nullable=True)  # List of examples as JSON array of strings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_activity_templates_title', 'title'),
    )



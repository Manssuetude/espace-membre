from pydantic import BaseModel, Field
from typing import Optional


class FeedbackBase(BaseModel):
    """Base feedback schema"""
    category: str  # Session, Général, etc.
    type: str  # Suggestion, Compliment, etc.
    subject: str
    message: str
    anonymous: bool = False
    rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 for session feedbacks
    sessionId: Optional[str] = Field(None, alias="session_id")
    
    class Config:
        populate_by_name = True


class CreateFeedbackRequest(FeedbackBase):
    """Schema for creating feedback"""
    pass


class UpdateFeedbackRequest(BaseModel):
    """Schema for updating feedback status"""
    status: str  # new, read, resolved


class FeedbackResponse(FeedbackBase):
    """Schema for feedback response"""
    id: str
    submittedBy: Optional[str] = Field(None, alias="submitted_by")
    submittedAt: Optional[str] = Field(None, alias="submitted_at")
    status: str
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


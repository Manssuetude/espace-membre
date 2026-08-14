from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.schemas.user import UserSummary


class ThemeBase(BaseModel):
    """Base theme schema"""
    title: str
    description: str
    category: Optional[str] = None


class CreateThemeRequest(ThemeBase):
    """Schema for creating a theme (member submission)"""
    pass


class UpdateThemeRequest(BaseModel):
    """Schema for updating theme status (admin)"""
    status: str  # approved, rejected
    reviewNotes: Optional[str] = Field(None, alias="review_notes")
    
    class Config:
        populate_by_name = True


class ThemeResponse(ThemeBase):
    """Schema for theme response"""
    id: str
    status: str
    submittedBy: Optional[UserSummary] = Field(None, alias="submitted_by")
    submittedAt: Optional[str] = Field(None, alias="submitted_at")
    reviewedAt: Optional[str] = Field(None, alias="reviewed_at")
    reviewedBy: Optional[str] = Field(None, alias="reviewed_by")
    reviewNotes: Optional[str] = Field(None, alias="review_notes")
    sessionCount: int = Field(0, alias="session_count")
    nextSessionDate: Optional[str] = Field(None, alias="next_session_date")
    lastSessionDate: Optional[str] = Field(None, alias="last_session_date")
    likes: int = 0
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ThemeWindowStatusResponse(BaseModel):
    """Schema for theme proposal window status"""
    isOpen: bool = Field(..., alias="is_open")
    startDate: Optional[str] = Field(None, alias="start_date")
    endDate: Optional[str] = Field(None, alias="end_date")
    daysRemaining: Optional[int] = Field(None, alias="days_remaining")
    nextOpeningDate: Optional[str] = Field(None, alias="next_opening_date")
    userProposals: Optional[List[ThemeResponse]] = Field(None, alias="user_proposals")
    
    class Config:
        populate_by_name = True


class OpenWindowRequest(BaseModel):
    """Schema for opening a theme proposal window"""
    duration: int  # Duration in days


class ExtendWindowRequest(BaseModel):
    """Schema for extending a theme proposal window"""
    additionalDays: int = Field(..., alias="additional_days")
    
    class Config:
        populate_by_name = True


class ThemeWindowResponse(BaseModel):
    """Schema for theme proposal window response"""
    id: str
    startDate: str = Field(..., alias="start_date")
    endDate: str = Field(..., alias="end_date")
    isActive: bool = Field(..., alias="is_active")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CreateThemeSelectionPollRequest(BaseModel):
    """Schema for creating a theme selection poll from active window"""
    themeIds: List[str] = Field(..., alias="theme_ids", description="List of approved theme IDs to include as poll options")
    sessionId: str = Field(..., alias="session_id", description="ID of upcoming session (mandatory)")
    
    class Config:
        populate_by_name = True


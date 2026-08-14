from pydantic import BaseModel, Field
from typing import Optional, List, Union, Annotated
from datetime import date as date_type, time as time_type


class SessionBase(BaseModel):
    """Base session schema"""
    title: str
    description: Optional[str] = None
    theme: Optional[str] = None
    type: str  # workshop, conference, group, individual
    date: date_type | None = None
    startTime: Optional[time_type] = Field(None, alias="start_time")
    endTime: Optional[time_type] = Field(None, alias="end_time")
    locationId: Optional[str] = Field(None, alias="location_id")
    isOnline: bool = Field(False, alias="is_online")
    maxParticipants: int = Field(..., alias="max_participants")
    objectives: Optional[List[str]] = None
    
    class Config:
        populate_by_name = True


class CreateSessionRequest(SessionBase):
    """Schema for creating a session"""
    pass


class UpdateSessionRequest(BaseModel):
    """Schema for updating a session"""
    title: Optional[str] = None
    description: Optional[str] = None
    theme: Optional[str] = None
    type: Optional[str] = None
    date: date_type | None = None
    startTime: Optional[time_type] = Field(default=None, alias="start_time")
    endTime: Optional[time_type] = Field(default=None, alias="end_time")
    locationId: Optional[str] = Field(default=None, alias="location_id")
    isOnline: Optional[bool] = Field(default=None, alias="is_online")
    maxParticipants: Optional[int] = Field(default=None, alias="max_participants")
    status: Optional[str] = None
    objectives: Optional[List[str]] = None
    
    model_config = {
        "populate_by_name": True
    }


class SessionResponse(SessionBase):
    """Schema for session response"""
    id: str
    registered: int
    status: str
    location: Optional[dict] = None  # Location details from relationship
    attendanceRate: Optional[float] = Field(None, alias="attendance_rate")
    averageGrade: Optional[float] = Field(None, alias="average_grade")
    duration: Optional[str] = None
    isRegistered: bool = Field(False, alias="is_registered")
    objectives: List[str] = []  # Always return a list, never None
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class SessionDetailResponse(SessionResponse):
    """Schema for detailed session response with related data"""
    workGroups: Optional[List[dict]] = None
    polls: Optional[List[dict]] = None
    resources: Optional[List[dict]] = None
    attendants: Optional[List[dict]] = None
    userRating: Optional[dict] = None  # Current user's own rating (if they submitted one)
    ratings: Optional[List[dict]] = None  # Only included for admins
    totalRatings: Optional[int] = None  # Only included for admins
    attended: Optional[bool] = None  # Whether the current user attended (only for members)
    ratingReminderSent: Optional[bool] = None  # Whether rating reminder email was sent (only for admins)


class WorkGroupCreateRequest(BaseModel):
    """Schema for creating work groups"""
    numberOfGroups: int = Field(..., alias="number_of_groups")
    isRandom: bool = Field(False, alias="is_random")
    assignments: Optional[dict] = None  # {user_id: group_index}
    
    class Config:
        populate_by_name = True


class WorkGroupResponse(BaseModel):
    """Schema for work group response"""
    id: str
    name: str
    letter: str
    color: str
    members: Optional[List[dict]] = None
    
    class Config:
        from_attributes = True


class RateSessionRequest(BaseModel):
    """Schema for rating a session"""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, description="Optional comment about the session")
    
    class Config:
        populate_by_name = True


class UpdateAttendanceRequest(BaseModel):
    """Schema for marking attendance (admin)"""
    attended: bool = Field(True, description="Mark whether the user attended the session")
    
    class Config:
        populate_by_name = True


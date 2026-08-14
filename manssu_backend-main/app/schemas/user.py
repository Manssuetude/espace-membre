from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    firstName: str = Field(..., alias="first_name")
    lastName: str = Field(..., alias="last_name")
    phone: Optional[str] = None
    address: Optional[str] = None
    postalCode: Optional[str] = Field(None, alias="postal_code")
    city: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = Field(None, alias="avatar_url")
    role: str = "member"
    
    class Config:
        populate_by_name = True


class UserCreate(UserBase):
    """Schema for creating a user"""
    pass


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    firstName: Optional[str] = Field(None, alias="first_name")
    lastName: Optional[str] = Field(None, alias="last_name")
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    postalCode: Optional[str] = Field(None, alias="postal_code")
    city: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = Field(None, alias="avatar_url")
    role: Optional[str] = None
    status: Optional[str] = None
    
    class Config:
        populate_by_name = True


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    status: str
    name: Optional[str] = None  # Computed: firstName + lastName
    sessionsCount: Optional[int] = 0
    feedbacksCount: Optional[int] = 0
    themesCount: Optional[int] = 0
    memberSince: Optional[str] = Field(None, alias="member_since")
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    lastLogin: Optional[str] = Field(None, alias="last_login")
    pollHistory: Optional[List[Dict]] = None  # List of polls user voted on with choices
    feedbacksHistory: Optional[List[Dict]] = None  # List of feedbacks submitted by user
    sessionAttendanceHistory: Optional[List[Dict]] = None  # List of sessions user registered for/attended
    
    class Config:
        from_attributes = True
        populate_by_name = True


class UserSummary(BaseModel):
    """Simplified user schema for nested responses"""
    id: str
    name: str
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


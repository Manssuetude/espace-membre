from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class CreateInviteRequest(BaseModel):
    """Schema for creating a session invite"""
    email: EmailStr
    sessionId: str = Field(..., alias="session_id")
    
    class Config:
        populate_by_name = True


class InviteResponse(BaseModel):
    """Schema for invite response"""
    id: str
    code: str
    email: str
    sessionId: str = Field(..., alias="session_id")
    sessionTitle: Optional[str] = None
    createdBy: Optional[str] = Field(None, alias="created_by")
    createdByName: Optional[str] = None
    expiresAt: str = Field(..., alias="expires_at")
    status: str
    usedAt: Optional[str] = Field(None, alias="used_at")
    usedBy: Optional[str] = Field(None, alias="used_by")
    usedByName: Optional[str] = None
    createdAt: str = Field(..., alias="created_at")
    inviteUrl: Optional[str] = None  # Full URL with code
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ValidateInviteResponse(BaseModel):
    """Schema for invite validation response"""
    valid: bool
    email: Optional[str] = None
    sessionId: Optional[str] = None
    sessionTitle: Optional[str] = None
    expiresAt: Optional[str] = None
    message: Optional[str] = None


class GuestRegisterRequest(BaseModel):
    """Schema for guest registration"""
    code: str
    firstName: str = Field(..., alias="first_name")
    lastName: str = Field(..., alias="last_name")
    otp: str
    
    class Config:
        populate_by_name = True


class AddSessionToGuestRequest(BaseModel):
    """Schema for adding a session to an existing guest"""
    sessionId: str = Field(..., alias="session_id")
    
    class Config:
        populate_by_name = True


class CreateInvitationRequestRequest(BaseModel):
    """Schema for creating an invitation request (by member)"""
    email: EmailStr
    fullName: str = Field(..., alias="full_name", min_length=1, max_length=200)
    reason: str = Field(..., min_length=1)  # Why does the member want to invite this person
    sessionId: str = Field(..., alias="session_id")
    
    class Config:
        populate_by_name = True


class InvitationRequestResponse(BaseModel):
    """Schema for invitation request response"""
    id: str
    email: str
    fullName: str = Field(..., alias="full_name")
    reason: str
    sessionId: str = Field(..., alias="session_id")
    sessionTitle: Optional[str] = None
    requestedBy: str = Field(..., alias="requested_by")
    requestedByName: Optional[str] = None
    status: str  # pending, approved, rejected
    reviewedBy: Optional[str] = Field(None, alias="reviewed_by")
    reviewedByName: Optional[str] = None
    reviewedAt: Optional[str] = Field(None, alias="reviewed_at")
    createdAt: str = Field(..., alias="created_at")
    updatedAt: str = Field(..., alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class ReviewInvitationRequestRequest(BaseModel):
    """Schema for reviewing (approve/reject) an invitation request"""
    action: str = Field(..., description="Either 'approve' or 'reject'")
    
    class Config:
        populate_by_name = True






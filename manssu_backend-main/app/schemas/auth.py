from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class SendOTPRequest(BaseModel):
    """Request schema for sending OTP"""
    email: EmailStr


class SendOTPResponse(BaseModel):
    """Response schema for sending OTP"""
    message: str
    expiresIn: int  # seconds


class VerifyOTPRequest(BaseModel):
    """Request schema for verifying OTP"""
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)


class UserInfo(BaseModel):
    """User information in auth responses"""
    id: str
    email: str
    firstName: str
    lastName: str
    role: str
    avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Token response schema"""
    accessToken: str
    refreshToken: Optional[str] = None
    user: UserInfo


class VerifyOTPResponse(BaseModel):
    """Response schema for verifying OTP"""
    accessToken: str
    refreshToken: Optional[str] = None
    user: UserInfo


class LogoutResponse(BaseModel):
    """Response schema for logout"""
    message: str


class SendOTPForInviteRequest(BaseModel):
    """Request schema for sending OTP for invite code"""
    code: str


class GuestRegisterRequest(BaseModel):
    """Request schema for guest registration"""
    code: str
    firstName: str = Field(..., alias="first_name")
    lastName: str = Field(..., alias="last_name")
    otp: str
    
    class Config:
        populate_by_name = True


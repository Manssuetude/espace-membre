from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# Application status type
ApplicationStatus = Literal["pending", "approved", "rejected"]

# Commission status type
CommissionStatus = Literal["active", "archived"]


# ============ User Summary for Commission Responses ============

class CommissionUserSummary(BaseModel):
    """Brief user info for commission responses"""
    id: str
    firstName: str = Field(..., alias="first_name")
    lastName: str = Field(..., alias="last_name")
    email: str
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    
    class Config:
        from_attributes = True
        populate_by_name = True


# ============ Commission Member Schemas ============

class CommissionMemberResponse(BaseModel):
    """Schema for commission member response"""
    id: str
    user: CommissionUserSummary
    joinedAt: str = Field(..., alias="joined_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


# ============ Commission Application Schemas ============

class CreateApplicationRequest(BaseModel):
    """Schema for applying to join a commission"""
    reason: str = Field(..., min_length=10, max_length=2000, description="Detailed reason for joining")
    
    class Config:
        populate_by_name = True


class RejectApplicationRequest(BaseModel):
    """Schema for rejecting an application"""
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for rejection")
    
    class Config:
        populate_by_name = True


class ApplicationResponse(BaseModel):
    """Schema for commission application response"""
    id: str
    user: CommissionUserSummary
    reason: str
    status: ApplicationStatus
    createdAt: str = Field(..., alias="created_at")
    reviewedAt: Optional[str] = Field(None, alias="reviewed_at")
    reviewedBy: Optional[CommissionUserSummary] = Field(None, alias="reviewed_by")
    rejectionReason: Optional[str] = Field(None, alias="rejection_reason")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class MyApplicationResponse(BaseModel):
    """Schema for user's own application response (includes commission info)"""
    id: str
    commissionId: str = Field(..., alias="commission_id")
    commissionName: str = Field(..., alias="commission_name")
    reason: str
    status: ApplicationStatus
    createdAt: str = Field(..., alias="created_at")
    reviewedAt: Optional[str] = Field(None, alias="reviewed_at")
    rejectionReason: Optional[str] = Field(None, alias="rejection_reason")
    
    class Config:
        from_attributes = True
        populate_by_name = True


# ============ Commission Schemas ============

class CreateCommissionRequest(BaseModel):
    """Schema for creating a commission (super admin only)"""
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    maxMembers: Optional[int] = Field(None, alias="max_members", gt=0, description="Maximum number of members (null for unlimited)")
    
    class Config:
        populate_by_name = True


class UpdateCommissionRequest(BaseModel):
    """Schema for updating a commission (super admin or leader)"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)
    maxMembers: Optional[int] = Field(None, alias="max_members", gt=0)
    status: Optional[CommissionStatus] = None
    
    class Config:
        populate_by_name = True


class AssignLeaderRequest(BaseModel):
    """Schema for assigning a leader to a commission"""
    userId: str = Field(..., alias="user_id", description="ID of the user to assign as leader")
    
    class Config:
        populate_by_name = True


class AddMemberRequest(BaseModel):
    """Schema for adding a member directly to a commission"""
    userId: str = Field(..., alias="user_id", description="ID of the user to add as member")
    
    class Config:
        populate_by_name = True


class CommissionSummaryResponse(BaseModel):
    """Schema for commission list response"""
    id: str
    name: str
    description: Optional[str] = None
    status: CommissionStatus
    maxMembers: Optional[int] = Field(None, alias="max_members")
    memberCount: int = Field(0, alias="member_count")
    pendingApplicationsCount: int = Field(0, alias="pending_applications_count")
    leader: Optional[CommissionUserSummary] = None
    createdAt: str = Field(..., alias="created_at")
    updatedAt: str = Field(..., alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class CommissionDetailResponse(CommissionSummaryResponse):
    """Schema for detailed commission response"""
    members: List[CommissionMemberResponse] = []
    # Applications only included for super admins and commission leader
    applications: Optional[List[ApplicationResponse]] = None
    # Whether current user is a member
    isMember: bool = Field(False, alias="is_member")
    # Whether current user is the leader
    isLeader: bool = Field(False, alias="is_leader")
    # Current user's pending application (if any)
    myPendingApplication: Optional[ApplicationResponse] = Field(None, alias="my_pending_application")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class MyCommissionResponse(BaseModel):
    """Schema for user's commission membership"""
    id: str
    name: str
    description: Optional[str] = None
    status: CommissionStatus
    isLeader: bool = Field(False, alias="is_leader")
    memberCount: int = Field(0, alias="member_count")
    joinedAt: str = Field(..., alias="joined_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


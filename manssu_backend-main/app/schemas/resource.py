from pydantic import BaseModel, Field
from typing import Optional, List


class ResourceBase(BaseModel):
    """Base resource schema"""
    title: str
    description: str
    type: str  # file, video, audio, folder
    link: str
    folderDescription: Optional[str] = Field(None, alias="folder_description")
    category: Optional[str] = None
    sessionId: Optional[str] = Field(None, alias="session_id")
    addToSession: Optional[bool] = Field(None, alias="add_to_session")
    
    class Config:
        populate_by_name = True


class CreateResourceRequest(BaseModel):
    """Schema for creating a resource - sessionId is required"""
    title: str
    description: str
    type: str  # file, video, audio, folder
    link: str
    folderDescription: Optional[str] = Field(None, alias="folder_description")
    category: Optional[str] = None
    sessionId: str = Field(..., alias="session_id", description="Session ID (required)")
    addToSession: Optional[bool] = Field(None, alias="add_to_session")
    
    class Config:
        populate_by_name = True


class UpdateResourceRequest(BaseModel):
    """Schema for updating a resource"""
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    link: Optional[str] = None
    folderDescription: Optional[str] = Field(None, alias="folder_description")
    category: Optional[str] = None
    sessionId: Optional[str] = Field(None, alias="session_id")
    
    class Config:
        populate_by_name = True


class UpdateResourceStatusRequest(BaseModel):
    """Schema for updating resource status (Admin only)"""
    status: str  # approved, rejected
    reviewNotes: Optional[str] = Field(None, alias="review_notes")
    
    class Config:
        populate_by_name = True


class ResourceResponse(ResourceBase):
    """Schema for resource response"""
    id: str
    status: str  # pending, approved, rejected
    reviewedBy: Optional[str] = Field(None, alias="reviewed_by")
    reviewedAt: Optional[str] = Field(None, alias="reviewed_at")
    reviewNotes: Optional[str] = Field(None, alias="review_notes")
    filePath: Optional[str] = Field(None, alias="file_path")
    fileSize: Optional[int] = Field(None, alias="file_size")
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class SessionResourceSummary(BaseModel):
    """Schema representing minimal session info when grouping resources"""
    id: str
    title: str
    status: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None
    theme: Optional[str] = None
    createdAt: Optional[str] = Field(None, alias="created_at")
    
    class Config:
        populate_by_name = True


class SessionResourceGroupResponse(BaseModel):
    """Schema representing resources grouped under a session"""
    session: SessionResourceSummary
    resources: List[ResourceResponse]


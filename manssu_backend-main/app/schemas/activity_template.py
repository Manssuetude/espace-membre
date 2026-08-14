from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ActivityTemplateBase(BaseModel):
    """Base activity template schema"""
    title: str
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    rules: Optional[List[str]] = None
    duration: Optional[str] = None
    examples: Optional[List[str]] = None


class CreateActivityTemplateRequest(ActivityTemplateBase):
    """Schema for creating an activity template"""
    pass


class UpdateActivityTemplateRequest(BaseModel):
    """Schema for updating an activity template"""
    title: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    rules: Optional[List[str]] = None
    duration: Optional[str] = None
    examples: Optional[List[str]] = None


class ActivityTemplateResponse(ActivityTemplateBase):
    """Schema for activity template response"""
    id: str
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True



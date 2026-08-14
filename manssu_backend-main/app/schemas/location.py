from pydantic import BaseModel, Field
from typing import Optional


class LocationBase(BaseModel):
    """Base location schema"""
    name: Optional[str] = None
    address: str
    instructions: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    googlePlaceId: Optional[str] = Field(None, alias="google_place_id")
    
    class Config:
        populate_by_name = True


class CreateLocationRequest(LocationBase):
    """Schema for creating a location"""
    pass


class UpdateLocationRequest(BaseModel):
    """Schema for updating a location"""
    name: Optional[str] = None
    address: Optional[str] = None
    instructions: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    googlePlaceId: Optional[str] = Field(None, alias="google_place_id")
    
    class Config:
        populate_by_name = True


class LocationResponse(LocationBase):
    """Schema for location response"""
    id: str
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional, Dict, Any

T = TypeVar('T')


class APIResponse(BaseModel):
    """Standard API response wrapper"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[Dict[str, List[str]]] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    data: List[T]
    total: int
    page: int
    limit: int
    totalPages: int


class Location(BaseModel):
    """Location schema for nested location data"""
    address: str
    instructions: Optional[str] = None
    
    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    """Error response schema"""
    success: bool = False
    message: str
    errors: Optional[Dict[str, List[str]]] = None


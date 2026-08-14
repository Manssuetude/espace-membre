from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_admin
from app.schemas.location import CreateLocationRequest, UpdateLocationRequest, LocationResponse
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.location_service import LocationService

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_locations(
    search: Optional[str] = Query(None, description="Search in address"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get all locations with filtering and pagination.
    """
    service = LocationService(db)
    result = service.get_locations(search=search, page=page, limit=limit)
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/{location_id}", response_model=APIResponse)
async def get_location(
    location_id: str,
    db: Session = Depends(get_db)
):
    """
    Get location by ID.
    """
    service = LocationService(db)
    location = service.get_location_by_id(location_id)
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return APIResponse(
        success=True,
        data=location.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_location(
    data: CreateLocationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a new location (Admin only).
    """
    service = LocationService(db)
    location = service.create_location(data)
    
    return APIResponse(
        success=True,
        data=location.model_dump(),
        message="Lieu créé avec succès"
    )


@router.patch("/{location_id}", response_model=APIResponse)
async def update_location(
    location_id: str,
    data: UpdateLocationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update location (Admin only).
    """
    service = LocationService(db)
    location = service.update_location(location_id, data)
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return APIResponse(
        success=True,
        data=location.model_dump(),
        message="Lieu mis à jour avec succès"
    )


@router.delete("/{location_id}", response_model=APIResponse)
async def delete_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete location (Admin only).
    """
    service = LocationService(db)
    
    # Check if location is in use
    if service.is_location_in_use(location_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete location that is used by active sessions"
        )
    
    success = service.delete_location(location_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return APIResponse(
        success=True,
        message="Lieu supprimé avec succès"
    )


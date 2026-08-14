from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime

from app.models.location import Location
from app.models.session import Session as SessionModel
from app.schemas.location import CreateLocationRequest, UpdateLocationRequest, LocationResponse
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache


class LocationService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all location-related caches"""
        list_cache.invalidate_pattern("locations_list")
    
    def get_locations(
        self,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse[LocationResponse]:
        """Get all locations with filtering and pagination"""
        # Check cache
        cache_key = f"locations_list_search:{search or ''}_page:{page}_limit:{limit}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Location)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Location.name.ilike(search_term),
                    Location.address.ilike(search_term)
                )
            )
        
        total = query.count()
        offset = (page - 1) * limit
        locations = query.order_by(Location.created_at.desc()).offset(offset).limit(limit).all()
        
        result = PaginatedResponse(
            data=[self._location_to_dict(l) for l in locations],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        # Cache the result
        list_cache.set(cache_key, result)
        return result
    
    def get_location_by_id(self, location_id: str) -> Optional[LocationResponse]:
        """Get location by ID"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
            return None
        return self._location_to_dict(location)
    
    def create_location(self, data: CreateLocationRequest) -> LocationResponse:
        """Create a new location (Admin only)"""
        location = Location(
            name=data.name,
            address=data.address,
            instructions=data.instructions,
            latitude=data.latitude,
            longitude=data.longitude,
            google_place_id=data.googlePlaceId
        )
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        self._invalidate_cache()
        return self._location_to_dict(location)
    
    def update_location(
        self,
        location_id: str,
        data: UpdateLocationRequest
    ) -> Optional[LocationResponse]:
        """Update location (Admin only)"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
            return None
        
        if data.name is not None:
            location.name = data.name
        if data.address is not None:
            location.address = data.address
        if data.instructions is not None:
            location.instructions = data.instructions
        if data.latitude is not None:
            location.latitude = data.latitude
        if data.longitude is not None:
            location.longitude = data.longitude
        if data.googlePlaceId is not None:
            location.google_place_id = data.googlePlaceId
        
        location.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(location)
        self._invalidate_cache()
        return self._location_to_dict(location)
    
    def delete_location(self, location_id: str) -> bool:
        """Delete location (Admin only)"""
        location = self.db.query(Location).filter(Location.id == location_id).first()
        if not location:
            return False
        
        self.db.delete(location)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def is_location_in_use(self, location_id: str) -> bool:
        """Check if location is used by any sessions"""
        count = self.db.query(SessionModel).filter(
            SessionModel.location_id == location_id
        ).count()
        return count > 0
    
    def _location_to_dict(self, location: Location) -> LocationResponse:
        """Convert Location model to LocationResponse"""
        return LocationResponse(
            id=str(location.id),
            name=location.name,
            address=location.address,
            instructions=location.instructions,
            latitude=float(location.latitude) if location.latitude is not None else None,
            longitude=float(location.longitude) if location.longitude is not None else None,
            googlePlaceId=location.google_place_id,
            createdAt=location.created_at.isoformat() if location.created_at else None,
            updatedAt=location.updated_at.isoformat() if location.updated_at else None
        )


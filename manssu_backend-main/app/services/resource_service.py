from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from datetime import datetime, timezone, date as date_type

from app.models.resource import Resource
from app.models.session import Session as SessionModel
from app.schemas.resource import (
    CreateResourceRequest,
    UpdateResourceRequest,
    UpdateResourceStatusRequest,
    ResourceResponse,
    SessionResourceGroupResponse,
    SessionResourceSummary,
)
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache, dashboard_cache


class ResourceService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all resource-related caches"""
        list_cache.invalidate_pattern("resources_list")
        dashboard_cache.invalidate_pattern("member_dashboard")
        dashboard_cache.invalidate_pattern("admin_dashboard")
    
    def get_resources(
        self,
        session_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        search: Optional[str] = None,
        status: Optional[str] = "approved",  # Default to approved for public, "all" for admins
        page: int = 1,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> PaginatedResponse[ResourceResponse]:
        """Get all resources with filtering and pagination"""
        # Check if user is a guest - guests can only see resources from their registered sessions
        from app.models.user import User
        from app.models.session import SessionRegistration
        is_guest = False
        guest_session_ids = []
        
        if user_id:
            # Convert user_id to UUID for query (SQLAlchemy needs UUID type)
            from uuid import UUID as UUIDType
            try:
                user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
            except (ValueError, TypeError):
                # If conversion fails, try querying with string
                user_uuid = user_id
            
            user = self.db.query(User).filter(User.id == user_uuid).first()
            if user and user.role == "guest":
                is_guest = True
                # Get guest's registered session IDs (keep as UUIDs)
                registrations = self.db.query(SessionRegistration.session_id).filter(
                    SessionRegistration.user_id == user_uuid
                ).all()
                guest_session_ids = [reg.session_id for reg in registrations]
                # If guest has no registered sessions, return empty result
                if not guest_session_ids:
                    return PaginatedResponse(
                        data=[],
                        total=0,
                        page=page,
                        limit=limit,
                        totalPages=0
                    )
        
        # Check cache (include user_id in cache key for guests)
        cache_key = f"resources_list_session:{session_id or ''}_type:{resource_type or ''}_search:{search or ''}_status:{status or 'approved'}_page:{page}_limit:{limit}_user:{user_id or ''}_guest:{is_guest}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Resource)
        
        # For guests, filter to only resources from their registered sessions
        if is_guest:
            query = query.filter(Resource.session_id.in_(guest_session_ids))
        
        if session_id:
            from uuid import UUID as UUIDType
            session_uuid = UUIDType(session_id) if isinstance(session_id, str) else session_id
            query = query.filter(Resource.session_id == session_uuid)
            # For guests, also verify they're registered for this session
            if is_guest and session_uuid not in guest_session_ids:
                return PaginatedResponse(
                    data=[],
                    total=0,
                    page=page,
                    limit=limit,
                    totalPages=0
                )
        
        if resource_type:
            query = query.filter(Resource.type == resource_type)
        
        if status and status != "all":
            query = query.filter(Resource.status == status)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Resource.title.ilike(search_term),
                    Resource.description.ilike(search_term)
                )
            )
        
        total = query.count()
        offset = (page - 1) * limit
        resources = query.order_by(Resource.created_at.desc()).offset(offset).limit(limit).all()
        
        result = PaginatedResponse(
            data=[self._resource_to_dict(r) for r in resources],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        # Cache the result
        list_cache.set(cache_key, result)
        return result
    
    def get_pending_resources(self) -> list[ResourceResponse]:
        """Get pending resources (Admin only)"""
        resources = self.db.query(Resource).filter(
            Resource.status == "pending"
        ).order_by(Resource.created_at.desc()).all()
        
        return [self._resource_to_dict(r) for r in resources]
    
    def get_resource_by_id(self, resource_id: str, user_id: Optional[str] = None) -> Optional[ResourceResponse]:
        """Get resource by ID"""
        resource = self.db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return None
        
        # Check if user is a guest - guests can only access resources from their registered sessions
        if user_id:
            from app.models.user import User
            from app.models.session import SessionRegistration
            from uuid import UUID as UUIDType
            user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
            user = self.db.query(User).filter(User.id == user_uuid).first()
            if user and user.role == "guest":
                # Check if resource belongs to a session the guest is registered for
                if resource.session_id:
                    registration = self.db.query(SessionRegistration).filter(
                        and_(
                            SessionRegistration.session_id == resource.session_id,
                            SessionRegistration.user_id == user_uuid
                        )
                    ).first()
                    if not registration:
                        # Guest is not registered for this session, deny access
                        return None
        
        return self._resource_to_dict(resource)
    
    def create_resource(
        self,
        data: CreateResourceRequest,
        created_by: str,
        file_path: Optional[str] = None,
        file_size: Optional[int] = None,
        status: str = "pending"  # Default to pending for normal users
    ) -> ResourceResponse:
        """Create a new resource (normal users - status: pending)"""
        # Validate that session exists
        session = self.db.query(SessionModel).filter(SessionModel.id == data.sessionId).first()
        if not session:
            raise ValueError(f"Session with ID {data.sessionId} not found")
        
        resource = Resource(
            title=data.title,
            description=data.description,
            type=data.type,
            link=data.link,
            folder_description=data.folderDescription,
            category=data.category,
            session_id=data.sessionId,
            file_path=file_path,
            file_size=file_size,
            created_by=created_by,
            status=status
        )
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        self._invalidate_cache()
        return self._resource_to_dict(resource)
    
    def create_resource_directly(
        self,
        data: CreateResourceRequest,
        created_by: str,
        file_path: Optional[str] = None,
        file_size: Optional[int] = None,
        status: str = "approved"  # Default to approved for admins
    ) -> ResourceResponse:
        """Create a resource directly (Admin only - bypasses approval, status: approved)"""
        # Validate that session exists
        session = self.db.query(SessionModel).filter(SessionModel.id == data.sessionId).first()
        if not session:
            raise ValueError(f"Session with ID {data.sessionId} not found")
        
        resource = Resource(
            title=data.title,
            description=data.description,
            type=data.type,
            link=data.link,
            folder_description=data.folderDescription,
            category=data.category,
            session_id=data.sessionId,
            file_path=file_path,
            file_size=file_size,
            created_by=created_by,
            status=status,
            reviewed_by=created_by,  # Admin who creates it is the reviewer
            reviewed_at=datetime.now(timezone.utc)  # Auto-approved
        )
        self.db.add(resource)
        self.db.commit()
        self.db.refresh(resource)
        self._invalidate_cache()
        return self._resource_to_dict(resource)
    
    def update_resource(
        self,
        resource_id: str,
        data: UpdateResourceRequest
    ) -> Optional[ResourceResponse]:
        """Update resource"""
        resource = self.db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return None
        
        if data.title is not None:
            resource.title = data.title
        if data.description is not None:
            resource.description = data.description
        if data.type is not None:
            resource.type = data.type
        if data.link is not None:
            resource.link = data.link
        if data.folderDescription is not None:
            resource.folder_description = data.folderDescription
        if data.category is not None:
            resource.category = data.category
        if data.sessionId is not None:
            resource.session_id = data.sessionId
        
        resource.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(resource)
        self._invalidate_cache()
        return self._resource_to_dict(resource)
    
    def update_resource_status(
        self,
        resource_id: str,
        data: UpdateResourceStatusRequest,
        reviewed_by: str
    ) -> Optional[ResourceResponse]:
        """Update resource status (Admin only - Approve/Reject)"""
        resource = self.db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return None
        
        resource.status = data.status
        resource.reviewed_at = datetime.now(timezone.utc)
        resource.reviewed_by = reviewed_by
        if data.reviewNotes:
            resource.review_notes = data.reviewNotes
        
        resource.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(resource)
        self._invalidate_cache()
        return self._resource_to_dict(resource)
    
    def delete_resource(self, resource_id: str) -> bool:
        """Delete resource"""
        resource = self.db.query(Resource).filter(Resource.id == resource_id).first()
        if not resource:
            return False
        
        self.db.delete(resource)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def get_resources_grouped_by_session(
        self,
        start_date: Optional[date_type] = None,
        end_date: Optional[date_type] = None,
        session_status: Optional[str] = None,
        resource_status: str = "approved",
        only_past_sessions: bool = True,
        page: int = 1,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> PaginatedResponse[SessionResourceGroupResponse]:
        """Get resources grouped by session with optional time filtering"""
        # Check if user is a guest - guests can only see resources from their registered sessions
        from app.models.user import User
        from app.models.session import SessionRegistration
        is_guest = False
        guest_session_ids = []
        
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.role == "guest":
                is_guest = True
                # Get guest's registered session IDs (keep as UUIDs)
                from uuid import UUID as UUIDType
                user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
                registrations = self.db.query(SessionRegistration.session_id).filter(
                    SessionRegistration.user_id == user_uuid
                ).all()
                guest_session_ids = [reg.session_id for reg in registrations]
                # If guest has no registered sessions, return empty result
                if not guest_session_ids:
                    return PaginatedResponse(
                        data=[],
                        total=0,
                        page=page,
                        limit=limit,
                        totalPages=0
                    )
        
        cache_key = (
            "resources_grouped_sessions_"
            f"{start_date or ''}_{end_date or ''}_{session_status or ''}_"
            f"{resource_status}_{only_past_sessions}_{page}_{limit}_user:{user_id or ''}_guest:{is_guest}"
        )
        cached = list_cache.get(cache_key)
        if cached is not None:
            return cached
        
        today = datetime.now(timezone.utc).date()
        
        base_query = self.db.query(SessionModel).join(Resource).filter(
            Resource.status == resource_status
        )
        
        # For guests, filter to only sessions they're registered for
        if is_guest:
            base_query = base_query.filter(SessionModel.id.in_(guest_session_ids))
        
        if start_date:
            base_query = base_query.filter(SessionModel.date >= start_date)
        if end_date:
            base_query = base_query.filter(SessionModel.date <= end_date)
        if session_status:
            if session_status == "past":
                base_query = base_query.filter(
                    and_(SessionModel.date.isnot(None), SessionModel.date < today)
                )
            elif session_status != "all":
                base_query = base_query.filter(SessionModel.status == session_status)
        if only_past_sessions:
            base_query = base_query.filter(
                or_(
                    SessionModel.status.in_(["completed", "cancelled"]),
                    and_(SessionModel.date.isnot(None), SessionModel.date < today)
                )
            )
        
        base_query = base_query.distinct()
        
        total = base_query.order_by(None).count()
        offset = (page - 1) * limit
        sessions_page: List[SessionModel] = (
            base_query
            .order_by(
                SessionModel.date.desc(),
                SessionModel.created_at.desc()
            )
            .offset(offset)
            .limit(limit)
            .all()
        )
        
        if not sessions_page:
            result = PaginatedResponse(
                data=[],
                total=total,
                page=page,
                limit=limit,
                totalPages=(total + limit - 1) // limit if limit else 0
            )
            list_cache.set(cache_key, result)
            return result
        
        session_ids = [session.id for session in sessions_page]
        session_order = [str(session_id) for session_id in session_ids]
        sessions_map = {str(session.id): session for session in sessions_page}
        
        resources = (
            self.db.query(Resource)
            .filter(
                Resource.session_id.in_(session_ids),
                Resource.status == resource_status
            )
            .order_by(Resource.created_at.desc())
            .all()
        )
        
        resources_by_session: dict[str, list[ResourceResponse]] = {
            session_id: [] for session_id in session_order
        }
        for resource in resources:
            session_id = str(resource.session_id)
            if session_id in resources_by_session:
                resources_by_session[session_id].append(self._resource_to_dict(resource))
        
        grouped_data = [
            SessionResourceGroupResponse(
                session=self._session_to_summary(sessions_map[session_id]),
                resources=resources_by_session.get(session_id, [])
            )
            for session_id in session_order
        ]
        
        result = PaginatedResponse(
            data=grouped_data,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        list_cache.set(cache_key, result)
        return result
    
    def _resource_to_dict(self, resource: Resource) -> ResourceResponse:
        """Convert Resource model to ResourceResponse"""
        return ResourceResponse(
            id=str(resource.id),
            title=resource.title,
            description=resource.description,
            type=resource.type,
            link=resource.link,
            folderDescription=resource.folder_description,
            category=resource.category,
            sessionId=str(resource.session_id) if resource.session_id else None,
            status=resource.status,
            reviewedBy=str(resource.reviewed_by) if resource.reviewed_by else None,
            reviewedAt=resource.reviewed_at.isoformat() if resource.reviewed_at else None,
            reviewNotes=resource.review_notes,
            filePath=resource.file_path,
            fileSize=resource.file_size,
            createdAt=resource.created_at.isoformat() if resource.created_at else None,
            updatedAt=resource.updated_at.isoformat() if resource.updated_at else None
        )
    
    def _session_to_summary(self, session: SessionModel) -> SessionResourceSummary:
        """Convert Session model to minimal summary"""
        return SessionResourceSummary(
            id=str(session.id),
            title=session.title,
            status=session.status,
            date=session.date.isoformat() if session.date else None,
            type=session.type,
            theme=session.theme,
            createdAt=session.created_at.isoformat() if session.created_at else None
        )


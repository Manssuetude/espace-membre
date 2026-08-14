from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime

from app.models.activity_template import ActivityTemplate
from app.schemas.activity_template import (
    CreateActivityTemplateRequest,
    UpdateActivityTemplateRequest,
    ActivityTemplateResponse
)
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache


class ActivityTemplateService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all activity template-related caches"""
        list_cache.invalidate_pattern("activity_templates_list")
    
    def get_activity_templates(
        self,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse[ActivityTemplateResponse]:
        """Get all activity templates with filtering and pagination"""
        # Check cache
        cache_key = f"activity_templates_list_search:{search or ''}_page:{page}_limit:{limit}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(ActivityTemplate)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    ActivityTemplate.title.ilike(search_term),
                    ActivityTemplate.description.ilike(search_term)
                )
            )
        
        total = query.count()
        offset = (page - 1) * limit
        templates = query.order_by(ActivityTemplate.created_at.desc()).offset(offset).limit(limit).all()
        
        result = PaginatedResponse(
            data=[self._template_to_dict(t) for t in templates],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        # Cache the result
        list_cache.set(cache_key, result)
        return result
    
    def get_activity_template_by_id(self, template_id: str) -> Optional[ActivityTemplateResponse]:
        """Get activity template by ID"""
        template = self.db.query(ActivityTemplate).filter(ActivityTemplate.id == template_id).first()
        if not template:
            return None
        return self._template_to_dict(template)
    
    def create_activity_template(self, data: CreateActivityTemplateRequest) -> ActivityTemplateResponse:
        """Create a new activity template"""
        template = ActivityTemplate(
            title=data.title,
            description=data.description,
            color=data.color,
            icon=data.icon,
            rules=data.rules,  # JSONB will handle the list
            duration=data.duration,
            examples=data.examples  # JSONB will handle the list
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        self._invalidate_cache()
        return self._template_to_dict(template)
    
    def update_activity_template(
        self,
        template_id: str,
        data: UpdateActivityTemplateRequest
    ) -> Optional[ActivityTemplateResponse]:
        """Update activity template"""
        template = self.db.query(ActivityTemplate).filter(ActivityTemplate.id == template_id).first()
        if not template:
            return None
        
        if data.title is not None:
            template.title = data.title
        if data.description is not None:
            template.description = data.description
        if data.color is not None:
            template.color = data.color
        if data.icon is not None:
            template.icon = data.icon
        if data.rules is not None:
            template.rules = data.rules
        if data.duration is not None:
            template.duration = data.duration
        if data.examples is not None:
            template.examples = data.examples
        
        template.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(template)
        self._invalidate_cache()
        return self._template_to_dict(template)
    
    def delete_activity_template(self, template_id: str) -> bool:
        """Delete activity template"""
        template = self.db.query(ActivityTemplate).filter(ActivityTemplate.id == template_id).first()
        if not template:
            return False
        
        self.db.delete(template)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def _template_to_dict(self, template: ActivityTemplate) -> ActivityTemplateResponse:
        """Convert ActivityTemplate model to ActivityTemplateResponse"""
        return ActivityTemplateResponse(
            id=str(template.id),
            title=template.title,
            description=template.description,
            color=template.color,
            icon=template.icon,
            rules=template.rules if template.rules else [],
            duration=template.duration,
            examples=template.examples if template.examples else [],
            createdAt=template.created_at.isoformat() if template.created_at else None,
            updatedAt=template.updated_at.isoformat() if template.updated_at else None
        )



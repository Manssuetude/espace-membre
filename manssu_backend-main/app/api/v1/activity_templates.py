from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.activity_template import (
    CreateActivityTemplateRequest,
    UpdateActivityTemplateRequest,
    ActivityTemplateResponse
)
from app.schemas.common import APIResponse
from app.services.activity_template_service import ActivityTemplateService

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_activity_templates(
    search: Optional[str] = Query(None, description="Search in title"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all activity templates with filtering and pagination (Authenticated users only).
    """
    service = ActivityTemplateService(db)
    result = service.get_activity_templates(search=search, page=page, limit=limit)
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/{template_id}", response_model=APIResponse)
async def get_activity_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get activity template by ID (Authenticated users only).
    """
    service = ActivityTemplateService(db)
    template = service.get_activity_template_by_id(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity template not found"
        )
    
    return APIResponse(
        success=True,
        data=template.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_activity_template(
    data: CreateActivityTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a new activity template (Admin only).
    """
    service = ActivityTemplateService(db)
    template = service.create_activity_template(data)
    
    return APIResponse(
        success=True,
        data=template.model_dump(),
        message="Modèle d'activité créé avec succès"
    )


@router.patch("/{template_id}", response_model=APIResponse)
async def update_activity_template(
    template_id: str,
    data: UpdateActivityTemplateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update activity template (Admin only).
    """
    service = ActivityTemplateService(db)
    template = service.update_activity_template(template_id, data)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity template not found"
        )
    
    return APIResponse(
        success=True,
        data=template.model_dump(),
        message="Modèle d'activité mis à jour avec succès"
    )


@router.delete("/{template_id}", response_model=APIResponse)
async def delete_activity_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete activity template (Admin only).
    """
    service = ActivityTemplateService(db)
    success = service.delete_activity_template(template_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity template not found"
        )
    
    return APIResponse(
        success=True,
        message="Modèle d'activité supprimé avec succès"
    )











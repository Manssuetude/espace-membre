from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date as date_type

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.resource import (
    CreateResourceRequest,
    UpdateResourceRequest,
    UpdateResourceStatusRequest,
    ResourceResponse,
    SessionResourceGroupResponse,
)
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.resource_service import ResourceService
from app.services.r2_storage_service import R2StorageService

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_resources(
    sessionId: Optional[str] = Query(None, alias="sessionId", description="Filter by session ID"),
    type: Optional[str] = Query(None, description="Filter by type: file, video, audio, folder"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    status: Optional[str] = Query("approved", description="Filter by status: all, pending, approved, rejected (default: approved for public, all for admins)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all resources with filtering and pagination.
    Public users see only approved resources by default.
    Admins can see all resources by setting status=all.
    """
    service = ResourceService(db)
    
    # If user is admin and status is "all", show all. Otherwise default to approved for public
    status_filter = status if (current_user and current_user.role in ["admin", "super_admin"] and status == "all") else (status if status != "approved" else "approved")
    
    # Pass user_id for guest filtering
    user_id = str(current_user.id) if current_user else None
    
    result = service.get_resources(
        session_id=sessionId,
        resource_type=type,
        search=search,
        status=status_filter,
        page=page,
        limit=limit,
        user_id=user_id
    )
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/sessions/history", response_model=APIResponse)
async def get_resources_grouped_by_session(
    startDate: Optional[date_type] = Query(None, description="Filter sessions starting from this date"),
    endDate: Optional[date_type] = Query(None, description="Filter sessions up to this date"),
    sessionStatus: Optional[str] = Query(None, description="Filter by session status (completed, cancelled, etc.)"),
    resourceStatus: str = Query("approved", description="Filter resources by status (default: approved)"),
    onlyPastSessions: bool = Query(True, description="When true, only include past/completed sessions"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get resources grouped by their session with optional time filtering.
    Useful for browsing past sessions along with their resources.
    """
    service = ResourceService(db)
    result: PaginatedResponse[SessionResourceGroupResponse] = service.get_resources_grouped_by_session(
        start_date=startDate,
        end_date=endDate,
        session_status=sessionStatus,
        resource_status=resourceStatus,
        only_past_sessions=onlyPastSessions,
        page=page,
        limit=limit,
        user_id=str(current_user.id) if current_user else None
    )
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/pending", response_model=APIResponse)
async def get_pending_resources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get all pending resources (Admin only).
    """
    service = ResourceService(db)
    resources = service.get_pending_resources()
    
    return APIResponse(
        success=True,
        data=resources
    )


@router.get("/{resource_id}", response_model=APIResponse)
async def get_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get resource by ID.
    Guests can only access resources from sessions they're registered for.
    """
    service = ResourceService(db)
    resource = service.get_resource_by_id(resource_id, user_id=str(current_user.id) if current_user else None)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return APIResponse(
        success=True,
        data=resource.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_resource(
    title: str = Form(...),
    description: str = Form(...),
    type: str = Form(...),
    link: str = Form(...),
    folderDescription: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    sessionId: str = Form(..., description="Session ID (required)"),
    addToSession: Optional[bool] = Form(False),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new resource (with optional file upload).
    Normal users: Resource is created with status="pending" and requires admin approval.
    Guests can create resources for sessions they're registered for.
    """
    service = ResourceService(db)
    storage_service = R2StorageService()
    
    # Handle file upload
    file_path = None
    file_size = None
    
    if file:
        try:
            file_path, file_size = storage_service.upload_upload_file(
                file=file,
                folder="resources",
                owner_id=str(current_user.id),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    # Create resource
    data = CreateResourceRequest(
        title=title,
        description=description,
        type=type,
        link=link,
        folderDescription=folderDescription,
        category=category,
        sessionId=sessionId,
        addToSession=addToSession
    )
    
    # Normal users create resources with status="pending"
    try:
        resource = service.create_resource(
            data,
            str(current_user.id),
            file_path=file_path,
            file_size=file_size,
            status="pending"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return APIResponse(
        success=True,
        data=resource.model_dump(),
        message="Ressource créée avec succès. En attente d'approbation."
    )


@router.patch("/{resource_id}", response_model=APIResponse)
async def update_resource(
    resource_id: str,
    data: UpdateResourceRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Update resource.
    """
    service = ResourceService(db)
    resource = service.update_resource(resource_id, data)
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return APIResponse(
        success=True,
        data=resource.model_dump(),
        message="Ressource mise à jour avec succès"
    )


@router.post("/admin/create", response_model=APIResponse)
async def create_resource_admin(
    title: str = Form(...),
    description: str = Form(...),
    type: str = Form(...),
    link: str = Form(...),
    folderDescription: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    sessionId: str = Form(..., description="Session ID (required)"),
    addToSession: Optional[bool] = Form(False),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a resource directly (Admin only - bypasses approval, status: approved).
    """
    service = ResourceService(db)
    storage_service = R2StorageService()
    
    # Handle file upload
    file_path = None
    file_size = None
    
    if file:
        try:
            file_path, file_size = storage_service.upload_upload_file(
                file=file,
                folder="resources",
                owner_id=str(current_user.id),
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    
    # Create resource
    data = CreateResourceRequest(
        title=title,
        description=description,
        type=type,
        link=link,
        folderDescription=folderDescription,
        category=category,
        sessionId=sessionId,
        addToSession=addToSession
    )
    
    # Admins create resources with status="approved" (bypasses approval)
    try:
        resource = service.create_resource_directly(
            data,
            str(current_user.id),
            file_path=file_path,
            file_size=file_size,
            status="approved"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    return APIResponse(
        success=True,
        data=resource.model_dump(),
        message="Ressource créée avec succès"
    )


@router.patch("/{resource_id}/status", response_model=APIResponse)
async def update_resource_status(
    resource_id: str,
    data: UpdateResourceStatusRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update resource status (Admin only - Approve/Reject).
    """
    service = ResourceService(db)
    resource = service.update_resource_status(resource_id, data, str(current_user.id))
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    status_message = "approuvée" if data.status == "approved" else "rejetée"
    return APIResponse(
        success=True,
        data=resource.model_dump(),
        message=f"Ressource {status_message} avec succès"
    )


@router.delete("/{resource_id}", response_model=APIResponse)
async def delete_resource(
    resource_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete resource (Admin only).
    """
    service = ResourceService(db)
    storage_service = R2StorageService()
    
    # Get resource to delete file if exists
    resource = service.get_resource_by_id(resource_id)
    if resource and resource.filePath:
        storage_service.delete_file(resource.filePath)
    
    success = service.delete_resource(resource_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    return APIResponse(
        success=True,
        message="Ressource supprimée avec succès"
    )

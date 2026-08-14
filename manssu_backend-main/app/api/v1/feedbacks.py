from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.feedback import CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackResponse
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.feedback_service import FeedbackService

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_feedbacks(
    status: Optional[str] = Query("all", description="Filter by status: all, new, read, resolved"),
    category: Optional[str] = Query("all", description="Filter by category: all, Session, Général, etc."),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get all feedbacks with filtering and pagination (Admin only).
    """
    service = FeedbackService(db)
    result = service.get_feedbacks(status=status, category=category, page=page, limit=limit)
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/me", response_model=APIResponse)
async def get_my_feedbacks(
    status: Optional[str] = Query("all", description="Filter by status: all, new, read, resolved"),
    category: Optional[str] = Query("all", description="Filter by category: all, Session, Général, etc."),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get current user's own feedbacks with filtering and pagination.
    Only returns feedbacks submitted by the authenticated user (non-anonymous feedbacks).
    """
    service = FeedbackService(db)
    result = service.get_user_feedbacks(
        user_id=str(current_user.id),
        status=status,
        category=category,
        page=page,
        limit=limit
    )
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/{feedback_id}", response_model=APIResponse)
async def get_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get feedback by ID (Admin only).
    """
    service = FeedbackService(db)
    feedback = service.get_feedback_by_id(feedback_id)
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    return APIResponse(
        success=True,
        data=feedback.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_feedback(
    data: CreateFeedbackRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new feedback.
    Guests cannot submit feedback.
    """
    # Check if user is a guest
    if current_user.role == "guest":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les invités ne peuvent pas soumettre de feedback"
        )
    
    service = FeedbackService(db)
    feedback = service.create_feedback(data, str(current_user.id))
    
    return APIResponse(
        success=True,
        data=feedback.model_dump(),
        message="Feedback soumis avec succès"
    )


@router.patch("/{feedback_id}", response_model=APIResponse)
async def update_feedback_status(
    feedback_id: str,
    data: UpdateFeedbackRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update feedback status (Admin only).
    """
    service = FeedbackService(db)
    feedback = service.update_feedback_status(feedback_id, data)
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    return APIResponse(
        success=True,
        data=feedback.model_dump(),
        message="Statut du feedback mis à jour avec succès"
    )


@router.delete("/{feedback_id}", response_model=APIResponse)
async def delete_feedback(
    feedback_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete feedback (Admin only).
    """
    service = FeedbackService(db)
    success = service.delete_feedback(feedback_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    return APIResponse(
        success=True,
        message="Feedback supprimé avec succès"
    )


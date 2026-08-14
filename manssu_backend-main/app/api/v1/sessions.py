from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin, get_optional_user
from app.schemas.session import (
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionResponse,
    WorkGroupCreateRequest,
    WorkGroupResponse,
    RateSessionRequest,
    UpdateAttendanceRequest,
)
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.session_service import SessionService

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_sessions(
    status: Optional[str] = Query("all", description="Filter by status: all, upcoming, ongoing, completed, cancelled"),
    theme: Optional[str] = Query(None, description="Filter by theme"),
    search: Optional[str] = Query(None, description="Search in title/theme"),
    dateFrom: Optional[date] = Query(None, description="Filter sessions from this date onwards (YYYY-MM-DD)"),
    dateTo: Optional[date] = Query(None, description="Filter sessions up to this date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all sessions with filtering and pagination.
    Requires authentication. Guests can see:
    - sessions they're registered for
    - all future sessions (upcoming/ongoing)
    
    Time filtering:
    - dateFrom: Filter sessions from this date onwards
    - dateTo: Filter sessions up to this date
    - Both can be used together to filter by date range
    """
    service = SessionService(db)
    user_id = str(current_user.id) if current_user else None
    result = service.get_sessions(
        status=status,
        theme=theme,
        search=search,
        date_from=dateFrom,
        date_to=dateTo,
        page=page,
        limit=limit,
        user_id=user_id
    )
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/{session_id}", response_model=APIResponse)
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get session by ID with details (work groups, polls, resources).
    Requires authentication. Guests can access:
    - sessions they're registered for
    - future sessions (upcoming/ongoing)
    If user is authenticated, includes isRegistered field.
    If user is admin, includes ratings information.
    """
    service = SessionService(db)
    user_id = str(current_user.id) if current_user else None
    is_admin = current_user and current_user.role in ["admin", "super_admin"] if current_user else False
    
    session = service.get_session_by_id(session_id, include_details=True, user_id=user_id, include_ratings=is_admin)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return APIResponse(
        success=True,
        data=session.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_session(
    data: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a new session (Admin only).
    """
    service = SessionService(db)
    session = service.create_session(data, str(current_user.id))
    
    return APIResponse(
        success=True,
        data=session.model_dump(),
        message="Session créée avec succès"
    )


@router.patch("/{session_id}", response_model=APIResponse)
async def update_session(
    session_id: str,
    data: UpdateSessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update session (Admin only).
    """
    service = SessionService(db)
    user_id = str(current_user.id) if current_user else None
    session = service.update_session(session_id, data, user_id=user_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return APIResponse(
        success=True,
        data=session.model_dump(),
        message="Session mise à jour avec succès"
    )


@router.post("/{session_id}/cancel", response_model=APIResponse)
async def cancel_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Cancel a session by setting status to cancelled (Admin only).
    This preserves the session data (unlike delete).
    """
    service = SessionService(db)
    session = service.cancel_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return APIResponse(
        success=True,
        data=session.model_dump(),
        message="Session annulée avec succès"
    )


@router.delete("/{session_id}", response_model=APIResponse)
async def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete session (Admin only).
    """
    service = SessionService(db)
    success = service.delete_session(session_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return APIResponse(
        success=True,
        message="Session supprimée avec succès"
    )


@router.post("/{session_id}/register", response_model=APIResponse)
async def register_for_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Register for a session.
    """
    service = SessionService(db)
    success = service.register_for_session(session_id, str(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register: session full or already registered"
        )
    
    return APIResponse(
        success=True,
        message="Inscription réussie"
    )


@router.delete("/{session_id}/register", response_model=APIResponse)
async def unregister_from_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Unregister from a session.
    """
    service = SessionService(db)
    success = service.unregister_from_session(session_id, str(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unregister: not registered for this session"
        )
    
    return APIResponse(
        success=True,
        message="Désinscription réussie"
    )


@router.post("/{session_id}/rate", response_model=APIResponse)
async def rate_session(
    session_id: str,
    data: RateSessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Rate a session.
    Requirements:
    - User must be registered for the session
    - User must have been marked as attended by an admin
    - Session must be completed or cancelled
    """
    service = SessionService(db)
    success = service.rate_session(
        session_id=session_id,
        user_id=str(current_user.id),
        rating=data.rating,
        comment=data.comment,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot rate: not registered for this session, not marked as attended, or session is not completed/cancelled"
        )
    
    return APIResponse(
        success=True,
        message="Note enregistrée avec succès"
    )


@router.post("/{session_id}/attendance/{user_id}", response_model=APIResponse)
async def set_session_attendance(
    session_id: str,
    user_id: str,
    data: UpdateAttendanceRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin),
):
    """
    Mark a user's attendance for a session (Admin only).
    - This controls whether the user is allowed to rate the session.
    - Also updates the session's attendanceRate field.
    - If marking present and user is not registered, creates a registration automatically.
    """
    service = SessionService(db)
    success = service.set_attendance(session_id, user_id, data.attended)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update attendance: session not found, or cannot mark absent a user who is not registered"
        )
    
    return APIResponse(
        success=True,
        message="Présence mise à jour avec succès"
    )


@router.post("/{session_id}/groups", response_model=APIResponse)
async def create_work_groups(
    session_id: str,
    data: WorkGroupCreateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create work groups for a session (Admin only).
    """
    service = SessionService(db)
    groups = service.create_work_groups(session_id, data)
    
    return APIResponse(
        success=True,
        data=groups,
        message="Groupes créés avec succès"
    )


@router.get("/{session_id}/groups", response_model=APIResponse)
async def get_session_groups(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get work groups for a session.
    """
    service = SessionService(db)
    groups = service.get_session_groups(session_id)
    
    return APIResponse(
        success=True,
        data=groups
    )


@router.post("/{session_id}/remind-ratings", response_model=APIResponse)
async def remind_session_ratings_for_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin),
):
    """
    Send rating reminder emails for a single completed session (Admin only).
    
    Rules:
    - Session must exist and have status 'completed'
    - Only attendees (attended = true) without a rating are notified
    - Can only be called once per session (subsequent calls will fail)
    """
    service = SessionService(db)
    result = service.send_session_rating_reminder_for_session(session_id)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    if result.get("invalidStatus"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send reminder: session must be completed",
        )

    if result.get("alreadySent"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating reminder has already been sent for this session",
        )

    return APIResponse(
        success=True,
        data=result,
        message="Rappels d'évaluation de session envoyés",
    )

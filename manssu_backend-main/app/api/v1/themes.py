from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.theme import (
    CreateThemeRequest,
    UpdateThemeRequest,
    ThemeResponse,
    ThemeWindowStatusResponse,
    OpenWindowRequest,
    ExtendWindowRequest,
    ThemeWindowResponse,
    CreateThemeSelectionPollRequest
)
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.theme_service import ThemeService

router = APIRouter()


@router.get("/window/status", response_model=APIResponse)
async def get_window_status(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get current theme proposal window status (Authenticated users only).
    Includes the current user's theme proposals for the active window.
    """
    service = ThemeService(db)
    result = service.get_window_status(user_id=str(current_user.id))
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.post("/window/open", response_model=APIResponse)
async def open_window(
    data: OpenWindowRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Open a new theme proposal window (Admin only).
    """
    service = ThemeService(db)
    result = service.open_window(data, str(current_user.id))
    
    return APIResponse(
        success=True,
        data=result.model_dump(),
        message="Fenêtre de propositions ouverte avec succès"
    )


@router.patch("/window/{window_id}/extend", response_model=APIResponse)
async def extend_window(
    window_id: str,
    data: ExtendWindowRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Extend a theme proposal window (Admin only).
    """
    service = ThemeService(db)
    result = service.extend_window(window_id, data)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Window not found"
        )
    
    return APIResponse(
        success=True,
        data=result.model_dump(),
        message="Fenêtre prolongée avec succès"
    )


@router.post("/window/{window_id}/close", response_model=APIResponse)
async def close_window(
    window_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Close a theme proposal window (Admin only).
    """
    service = ThemeService(db)
    success = service.close_window(window_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Window not found"
        )
    
    return APIResponse(
        success=True,
        data={"message": "Fenêtre fermée avec succès"},
        message="Fenêtre fermée avec succès"
    )


@router.get("", response_model=APIResponse)
async def get_themes(
    status: Optional[str] = Query("all", description="Filter by status: all, pending, approved, rejected, current"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all themes with filtering and pagination (Authenticated users only).
    """
    service = ThemeService(db)
    result = service.get_themes(status=status, page=page, limit=limit)
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/pending", response_model=APIResponse)
async def get_pending_themes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get pending themes (Admin only).
    """
    service = ThemeService(db)
    themes = service.get_pending_themes()
    
    return APIResponse(
        success=True,
        data=themes
    )


@router.get("/linked", response_model=APIResponse)
async def get_linked_themes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get themes that are linked to at least one session (regardless of session status).
    Authenticated users only.
    """
    service = ThemeService(db)
    themes = service.get_linked_themes()
    
    return APIResponse(
        success=True,
        data=themes
    )


@router.get("/unlinked", response_model=APIResponse)
async def get_unlinked_themes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get themes that are not linked to any session.
    Authenticated users only.
    """
    service = ThemeService(db)
    themes = service.get_unlinked_themes()
    
    return APIResponse(
        success=True,
        data=themes
    )


@router.get("/{theme_id}", response_model=APIResponse)
async def get_theme(
    theme_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get theme by ID (Authenticated users only).
    """
    service = ThemeService(db)
    theme = service.get_theme_by_id(theme_id)
    
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    return APIResponse(
        success=True,
        data=theme.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_theme(
    data: CreateThemeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a theme proposal (Member - only when window is open).
    Guests cannot propose themes.
    """
    # Check if user is a guest
    if current_user.role == "guest":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les invités ne peuvent pas proposer de thèmes"
        )
    
    service = ThemeService(db)
    theme = service.create_theme(data, str(current_user.id))
    
    if not theme:
        # Check if window is closed or limit reached
        window_status = service.get_window_status()
        if not window_status.isOpen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La fenêtre de propositions est actuellement fermée"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limite de propositions atteinte pour cette fenêtre"
            )
    
    return APIResponse(
        success=True,
        data=theme.model_dump(),
        message="Thème proposé avec succès"
    )


@router.post("/admin/create", response_model=APIResponse)
async def create_theme_directly(
    data: CreateThemeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a theme directly (Admin only - bypasses proposal window).
    Theme is created with approved status by default.
    """
    service = ThemeService(db)
    theme = service.create_theme_directly(data, str(current_user.id))
    
    return APIResponse(
        success=True,
        data=theme.model_dump(),
        message="Thème créé avec succès"
    )


@router.patch("/{theme_id}", response_model=APIResponse)
async def update_theme_status(
    theme_id: str,
    data: UpdateThemeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update theme status (Admin only - Approve/Reject).
    """
    service = ThemeService(db)
    theme = service.update_theme_status(theme_id, data, str(current_user.id))
    
    if not theme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    message = "Thème approuvé avec succès" if data.status == "approved" else "Thème rejeté avec succès"
    
    return APIResponse(
        success=True,
        data=theme.model_dump(),
        message=message
    )


@router.delete("/{theme_id}", response_model=APIResponse)
async def delete_theme(
    theme_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete a theme (Admin only).
    """
    service = ThemeService(db)
    success = service.delete_theme(theme_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Theme not found"
        )
    
    return APIResponse(
        success=True,
        message="Thème supprimé avec succès"
    )


@router.post("/window/create-poll", response_model=APIResponse)
async def create_theme_selection_poll(
    data: CreateThemeSelectionPollRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a poll for theme selection from active window and close the window (Admin only).
    
    Requirements:
    - Active theme proposal window must exist
    - All theme IDs must be approved themes
    - Session must exist and be upcoming
    - Creates poll with title "Sélection du thème de la prochaine session"
    - Question: "Quel thème souhaitez-vous aborder?"
    - Options are the theme titles
    - singleResponse=true
    - Closes the theme window after creation
    """
    service = ThemeService(db)
    
    try:
        poll = service.create_theme_selection_poll(
            theme_ids=data.themeIds,
            session_id=data.sessionId
        )
        
        return APIResponse(
            success=True,
            data=poll,
            message="Sondage de sélection de thème créé avec succès et fenêtre fermée"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


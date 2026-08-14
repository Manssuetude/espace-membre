from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.user_service import UserService
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=APIResponse)
async def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's full profile information.
    Note: Does not include history data for performance. Use /users/{id} endpoint for history.
    """
    service = UserService(db)
    # Use the already-loaded current_user object and skip history for performance
    # This avoids re-querying the user and loading expensive history data
    user = service.get_user_by_id(str(current_user.id), include_history=False, user=current_user)
    
    return APIResponse(
        success=True,
        data=user.model_dump()
    )


@router.patch("/me", response_model=APIResponse)
async def update_my_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's own profile.
    Users can only update: firstName, lastName, phone, address, postalCode, city, bio, avatar.
    Cannot update: email, role, status (these require admin access).
    """
    # Filter out fields that users cannot update themselves
    update_data = UserUpdate(
        firstName=data.firstName,
        lastName=data.lastName,
        phone=data.phone,
        address=data.address,
        postalCode=data.postalCode,
        city=data.city,
        bio=data.bio,
        avatar=data.avatar,
        # Explicitly set these to None so they can't be changed
        email=None,
        role=None,
        status=None
    )
    
    service = UserService(db)
    # Don't pass role for self-updates (users can't change their own role/status anyway)
    user = service.update_user(str(current_user.id), update_data, current_user_role=None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return APIResponse(
        success=True,
        data=user.model_dump(),
        message="Profil mis à jour avec succès"
    )


@router.get("", response_model=APIResponse)
async def get_users(
    status: Optional[str] = Query("all", description="Filter by status: all, active, suspended"),
    search: Optional[str] = Query(None, description="Search in name/email"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all users with filtering and pagination, including stats.
    - Admins (admin/super_admin): Can see all users with all filters
    - Members/Guests: Can only see active members (status forced to 'active'),
      including active admins.
    """
    service = UserService(db)
    is_admin = current_user.role in ["admin", "super_admin"]

    # Restrict non-admins (members/guests) to only see active members (including admins)
    if not is_admin:
        status = "active"
    
    result = service.get_users(
        status=status,
        search=search,
        page=page,
        limit=limit,
        member_only=not is_admin,
    )
    
    return APIResponse(
        success=True,
        data=result
    )


@router.get("/{user_id}", response_model=APIResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get user by ID with history (Admin only).
    Includes poll history (with choices), feedbacks history, and session attendance history.
    """
    service = UserService(db)
    user = service.get_user_by_id(user_id, include_history=True)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return APIResponse(
        success=True,
        data=user.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a new user (Admin only).
    """
    service = UserService(db)
    user = service.create_user(data)
    
    return APIResponse(
        success=True,
        data=user.model_dump(),
        message="User créé avec succès"
    )


@router.patch("/{user_id}", response_model=APIResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update user (Admin only).
    Note: Only super_admin can update role/status of other admins.
    """
    service = UserService(db)
    try:
        user = service.update_user(user_id, data, current_user.role)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return APIResponse(
            success=True,
            data=user.model_dump(),
            message="User mis à jour avec succès"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{user_id}/suspend", response_model=APIResponse)
async def suspend_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Suspend a user (Admin only).
    Note: Only super_admin can suspend other admins.
    """
    service = UserService(db)
    try:
        user = service.suspend_user(user_id, current_user.role)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return APIResponse(
            success=True,
            data=user.model_dump(),
            message="User suspendu avec succès"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{user_id}/unsuspend", response_model=APIResponse)
async def unsuspend_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Unsuspend a user (reactivate their account) (Admin only).
    Note: Only super_admin can unsuspend other admins.
    """
    service = UserService(db)
    try:
        user = service.unsuspend_user(user_id, current_user.role)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return APIResponse(
            success=True,
            data=user.model_dump(),
            message="User réactivé avec succès"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/{user_id}/upgrade", response_model=APIResponse)
async def upgrade_guest_to_member(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Upgrade a guest user to member (Admin only).
    Members have access to all sessions.
    """
    service = UserService(db)
    try:
        user = service.upgrade_guest_to_member(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or is not a guest"
            )
        
        return APIResponse(
            success=True,
            data=user.model_dump(),
            message="Invité promu membre avec succès"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{user_id}", response_model=APIResponse)
async def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete a user (Admin only).
    Note: Only super_admin can delete other admins.
    """
    service = UserService(db)
    try:
        success = service.delete_user(user_id, current_user.role)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return APIResponse(
            success=True,
            message="User supprimé avec succès"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


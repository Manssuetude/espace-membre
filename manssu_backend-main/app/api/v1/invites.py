from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_admin, get_current_user
from app.schemas.common import APIResponse
from app.schemas.invite import (
    CreateInviteRequest,
    InviteResponse,
    ValidateInviteResponse,
    AddSessionToGuestRequest,
    CreateInvitationRequestRequest,
    InvitationRequestResponse,
    ReviewInvitationRequestRequest
)
from app.services.invite_service import InviteService

router = APIRouter()


@router.post("", response_model=APIResponse)
async def create_invite(
    data: CreateInviteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a new session invite (Admin only).
    
    Generates an invite code and sends an email to the specified address.
    """
    service = InviteService(db)
    
    try:
        invite = service.create_invite(
            email=data.email,
            session_id=data.sessionId,
            created_by=str(current_user.id)
        )
        
        return APIResponse(
            success=True,
            message="Invitation créée et envoyée avec succès",
            data=invite.dict()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=APIResponse)
async def list_invites(
    status: Optional[str] = Query(None, description="Filter by status: pending, used, expired, cancelled"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    email: Optional[str] = Query(None, description="Search by email"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    List all invites with optional filters (Admin only).
    """
    service = InviteService(db)
    invites = service.get_invites(
        status=status,
        session_id=session_id,
        email=email
    )
    
    return APIResponse(
        success=True,
        message="Invitations récupérées avec succès",
        data=[invite.dict() for invite in invites]
    )


@router.get("/validate/{code}", response_model=ValidateInviteResponse)
async def validate_invite_code(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Validate an invite code (Public endpoint).
    Returns validation result with session info if valid.
    """
    service = InviteService(db)
    result = service.validate_invite_code(code)
    return result


@router.post("/guests/{guest_id}/sessions", response_model=APIResponse)
async def add_session_to_guest(
    guest_id: str,
    data: AddSessionToGuestRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Add a session to an existing guest user (Admin only).
    This allows admins to give guests access to additional sessions without upgrading them to member.
    """
    service = InviteService(db)
    success = service.add_session_to_guest(guest_id, data.sessionId)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'ajouter la session (utilisateur n'est pas un invité, session introuvable, ou déjà inscrit)"
        )
    
    return APIResponse(
        success=True,
        message="Session ajoutée à l'invité avec succès"
    )


@router.post("/requests", response_model=APIResponse)
async def create_invitation_request(
    data: CreateInvitationRequestRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create an invitation request (Member only).
    
    Members can request to invite someone to a session. The request will be reviewed by admins.
    """
    # Only members can create requests (not guests, admins can directly create invites)
    if current_user.role not in ["member", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les membres peuvent créer des demandes d'invitation"
        )
    
    service = InviteService(db)
    
    try:
        request = service.create_invitation_request(
            email=data.email,
            full_name=data.fullName,
            reason=data.reason,
            session_id=data.sessionId,
            requested_by=str(current_user.id)
        )
        
        return APIResponse(
            success=True,
            message="Demande d'invitation créée avec succès. Elle sera examinée par un administrateur.",
            data=request.dict()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/requests", response_model=APIResponse)
async def list_invitation_requests(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, rejected"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    List all invitation requests with optional filters (Admin only).
    """
    service = InviteService(db)
    requests = service.get_invitation_requests(
        status=status,
        session_id=session_id
    )
    
    return APIResponse(
        success=True,
        message="Demandes d'invitation récupérées avec succès",
        data=[req.dict() for req in requests]
    )


@router.get("/requests/{request_id}", response_model=APIResponse)
async def get_invitation_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get invitation request by ID (Admin only).
    """
    service = InviteService(db)
    request = service.get_invitation_request_by_id(request_id)
    
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demande d'invitation introuvable"
        )
    
    return APIResponse(
        success=True,
        message="Demande d'invitation récupérée avec succès",
        data=request.dict()
    )


@router.post("/requests/{request_id}/review", response_model=APIResponse)
async def review_invitation_request(
    request_id: str,
    data: ReviewInvitationRequestRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Review (approve or reject) an invitation request (Admin only).
    
    - If approved: Creates the invite and sends email to the invited person
    - If rejected: Marks the request as rejected
    """
    if data.action not in ["approve", "reject"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action invalide. Utilisez 'approve' ou 'reject'"
        )
    
    service = InviteService(db)
    
    try:
        request = service.review_invitation_request(
            request_id=request_id,
            action=data.action,
            reviewed_by=str(current_user.id)
        )
        
        if not request:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible d'examiner cette demande (déjà examinée ou introuvable)"
            )
        
        action_message = "approuvée" if data.action == "approve" else "rejetée"
        if data.action == "approve":
            action_message += " et l'invitation a été créée et envoyée"
        
        return APIResponse(
            success=True,
            message=f"Demande d'invitation {action_message} avec succès",
            data=request.dict()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{invite_id}", response_model=APIResponse)
async def get_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get invite by ID (Admin only).
    """
    service = InviteService(db)
    invite = service.get_invite_by_id(invite_id)
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation introuvable"
        )
    
    return APIResponse(
        success=True,
        message="Invitation récupérée avec succès",
        data=invite.dict()
    )


@router.post("/{invite_id}/cancel", response_model=APIResponse)
async def cancel_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Cancel an invite (Admin only).
    Cannot cancel invites that are already used.
    """
    service = InviteService(db)
    success = service.cancel_invite(invite_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'annuler cette invitation (déjà utilisée ou introuvable)"
        )
    
    return APIResponse(
        success=True,
        message="Invitation annulée avec succès"
    )




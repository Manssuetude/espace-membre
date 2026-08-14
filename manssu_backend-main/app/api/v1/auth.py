import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    LogoutResponse,
    UserInfo,
    SendOTPForInviteRequest,
    GuestRegisterRequest
)
from app.schemas.common import APIResponse
from app.services.auth_service import AuthService
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/send-otp", response_model=APIResponse)
async def send_otp(
    request: Request,
    data: SendOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Send OTP to user's email.
    Only works for registered users.
    """
    logger.info(f"Send OTP request for email: {data.email}")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request method: {request.method}")
    
    service = AuthService(db)
    try:
        result = service.send_otp(data.email)
        logger.info(f"OTP sent successfully for email: {data.email}")
        
        return APIResponse(
            success=True,
            data=result.model_dump(),
            message="OTP envoyé avec succès"
        )
    except ValueError as e:
        logger.warning(f"OTP send failed for {data.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error sending OTP: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'envoi de l'OTP"
        )


@router.post("/verify-otp", response_model=APIResponse)
async def verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP and return JWT token.
    """
    service = AuthService(db)
    result = service.verify_otp(data.email, data.otp)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Code OTP invalide ou expiré"
        )
    
    return APIResponse(
        success=True,
        data=result.model_dump(),
        message="Connexion réussie"
    )


@router.post("/logout", response_model=APIResponse)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout user (currently just returns success, can be extended for token blacklisting).
    """
    return APIResponse(
        success=True,
        data={"message": "Déconnexion réussie"},
        message="Déconnexion réussie"
    )


@router.get("/me", response_model=APIResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    user_info = UserInfo(
        id=str(current_user.id),
        email=current_user.email,
        firstName=current_user.first_name,
        lastName=current_user.last_name,
        role=current_user.role,
        avatar=current_user.avatar_url
    )
    
    return APIResponse(
        success=True,
        data=user_info.model_dump()
    )


@router.post("/send-otp-invite", response_model=APIResponse)
async def send_otp_for_invite(
    data: SendOTPForInviteRequest,
    db: Session = Depends(get_db)
):
    """
    Send OTP to email associated with an invite code.
    Used for guest registration flow (Public endpoint).
    """
    service = AuthService(db)
    try:
        result = service.send_otp_for_invite(data.code)
        return APIResponse(
            success=True,
            data=result.model_dump(),
            message="OTP envoyé avec succès"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/register-guest", response_model=APIResponse)
async def register_guest(
    data: GuestRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a guest user using invite code and OTP (Public endpoint).
    Creates guest account and auto-registers for the session.
    """
    service = AuthService(db)
    result = service.register_guest(
        code=data.code,
        first_name=data.firstName,
        last_name=data.lastName,
        otp_code=data.otp
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code d'invitation ou OTP invalide"
        )
    
    return APIResponse(
        success=True,
        data=result.model_dump(),
        message="Inscription réussie"
    )


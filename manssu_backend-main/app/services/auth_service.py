from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from datetime import datetime, timedelta

from app.models.user import User
from app.models.otp import OTP
from app.models.session_invite import SessionInvite
from app.models.session import SessionRegistration
from app.core.config import settings
from app.core.security import generate_otp, get_otp_expiry, create_access_token
from app.schemas.auth import SendOTPResponse, VerifyOTPResponse, UserInfo
from app.services.email_service import ResendEmailService
from app.services.invite_service import InviteService


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = ResendEmailService()
    
    def send_otp(self, email: str) -> SendOTPResponse:
        """
        Generate and send OTP to user's email.
        
        Args:
            email: User's email address
        
        Returns:
            SendOTPResponse with message and expiry time
        
        Raises:
            ValueError: If email is not registered
        """
        # Check if user exists
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError("Email non enregistré. Veuillez contacter un administrateur.")
        
        # Check if user is active
        if user.status != "active":
            raise ValueError("Compte utilisateur suspendu. Veuillez contacter un administrateur.")
        
        # Generate OTP
        otp_code = generate_otp()
        expires_at = get_otp_expiry()
        
        # Invalidate any existing unused OTPs for this email
        self.db.query(OTP).filter(
            and_(OTP.email == email, OTP.used == False)
        ).update({"used": True})
        
        # Create new OTP record
        otp = OTP(
            email=email,
            code=otp_code,
            expires_at=expires_at
        )
        self.db.add(otp)
        self.db.commit()
        
        # Send email using email service
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            user_name = f"{user.first_name} {user.last_name}".strip() or user.email
            success = self.email_service.send_otp_email(
                to_email=email,
                to_name=user_name,
                otp_code=otp_code
            )
            if not success:
                # Email sending failed - raise error so API returns error response
                logger.error(f"Failed to send OTP email to {email} - MailerSend returned error")
                raise ValueError("Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.")
        except ValueError:
            # Re-raise ValueError (email sending failure)
            raise
        except Exception as e:
            # Unexpected error - log and raise
            logger.error(f"Unexpected error sending OTP email to {email}: {e}", exc_info=True)
            raise ValueError("Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.")
        
        expires_in = int((expires_at - datetime.utcnow()).total_seconds())
        
        return SendOTPResponse(
            message="OTP envoyé avec succès",
            expiresIn=expires_in
        )
    
    def verify_otp(self, email: str, otp_code: str) -> Optional[VerifyOTPResponse]:
        """
        Verify OTP and create/update user, return JWT token.
        
        Args:
            email: User's email address
            otp_code: OTP code to verify
        
        Returns:
            VerifyOTPResponse with tokens and user info, or None if invalid
        """
        # Find valid OTP
        otp = self.db.query(OTP).filter(
            and_(
                OTP.email == email,
                OTP.code == otp_code,
                OTP.used == False,
                OTP.expires_at > datetime.utcnow()
            )
        ).first()
        
        if not otp:
            return None
        
        # Mark OTP as used
        otp.used = True
        self.db.commit()
        
        # Get user (must exist since send_otp checks for it)
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            # This shouldn't happen if send_otp is called first, but handle it
            raise ValueError("Email non enregistré")
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        # Generate JWT token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
        access_token = create_access_token(token_data)
        
        # Create user info
        user_info = UserInfo(
            id=str(user.id),
            email=user.email,
            firstName=user.first_name,
            lastName=user.last_name,
            role=user.role,
            avatar=user.avatar_url
        )
        
        return VerifyOTPResponse(
            accessToken=access_token,
            refreshToken=None,  # Can implement refresh tokens later
            user=user_info
        )
    
    def send_otp_for_invite(self, code: str) -> SendOTPResponse:
        """
        Send OTP to email associated with an invite code.
        Used for guest registration flow.
        
        Args:
            code: Invite code
            
        Returns:
            SendOTPResponse with message and expiry time
            
        Raises:
            ValueError: If invite code is invalid or expired
        """
        # Validate invite code
        invite_service = InviteService(self.db)
        validation = invite_service.validate_invite_code(code)
        
        if not validation.valid:
            raise ValueError(validation.message or "Code d'invitation invalide")
        
        email = validation.email
        
        # Generate OTP
        otp_code = generate_otp()
        expires_at = get_otp_expiry()
        
        # Invalidate any existing unused OTPs for this email
        self.db.query(OTP).filter(
            and_(OTP.email == email, OTP.used == False)
        ).update({"used": True})
        
        # Create new OTP record
        otp = OTP(
            email=email,
            code=otp_code,
            expires_at=expires_at
        )
        self.db.add(otp)
        self.db.commit()
        
        # Send email using email service
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            success = self.email_service.send_otp_email(
                to_email=email,
                to_name="",
                otp_code=otp_code
            )
            if not success:
                logger.error(f"Failed to send OTP email to {email} for invite code {code}")
                raise ValueError("Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error sending OTP email to {email}: {e}", exc_info=True)
            raise ValueError("Erreur lors de l'envoi de l'email. Veuillez réessayer plus tard.")
        
        expires_in = int((expires_at - datetime.utcnow()).total_seconds())
        
        return SendOTPResponse(
            message="OTP envoyé avec succès",
            expiresIn=expires_in
        )
    
    def register_guest(self, code: str, first_name: str, last_name: str, otp_code: str) -> Optional[VerifyOTPResponse]:
        """
        Register a guest user using invite code and OTP.
        
        Args:
            code: Invite code
            first_name: Guest's first name
            last_name: Guest's last name
            otp_code: OTP code to verify
            
        Returns:
            VerifyOTPResponse with tokens and user info, or None if invalid
        """
        # Validate invite code
        invite_service = InviteService(self.db)
        validation = invite_service.validate_invite_code(code)
        
        if not validation.valid:
            return None
        
        email = validation.email
        session_id = validation.sessionId
        
        # Verify OTP
        otp = self.db.query(OTP).filter(
            and_(
                OTP.email == email,
                OTP.code == otp_code,
                OTP.used == False,
                OTP.expires_at > datetime.utcnow()
            )
        ).first()
        
        if not otp:
            return None
        
        # Mark OTP as used
        otp.used = True
        self.db.commit()
        
        # Check if user already exists (as guest)
        user = self.db.query(User).filter(User.email == email).first()
        
        if user:
            # User exists - check if they're a guest
            if user.role != "guest":
                return None  # User exists but is not a guest
            
            # Update guest info
            user.first_name = first_name
            user.last_name = last_name
            user.last_login = datetime.utcnow()
        else:
            # Create new guest user
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role="guest",
                status="active",
                password_hash=None  # No password for guests
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        
        # Auto-register for session
        from app.models.session import Session
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if session:
            # Check if already registered
            existing_reg = self.db.query(SessionRegistration).filter(
                and_(
                    SessionRegistration.session_id == session_id,
                    SessionRegistration.user_id == str(user.id)
                )
            ).first()
            
            if not existing_reg:
                registration = SessionRegistration(
                    session_id=session_id,
                    user_id=str(user.id)
                )
                self.db.add(registration)
                
                # Update registered count
                session.registered += 1
                self.db.commit()
        
        # Mark invite as used
        invite_service.mark_invite_used(code, str(user.id))
        
        # Generate JWT token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
        access_token = create_access_token(token_data)
        
        # Create user info
        user_info = UserInfo(
            id=str(user.id),
            email=user.email,
            firstName=user.first_name,
            lastName=user.last_name,
            role=user.role,
            avatar=user.avatar_url
        )
        
        return VerifyOTPResponse(
            accessToken=access_token,
            refreshToken=None,
            user=user_info
        )
    


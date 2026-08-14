from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import secrets

from app.models.session_invite import SessionInvite
from app.models.invitation_request import InvitationRequest
from app.models.session import Session
from app.models.user import User
from app.core.config import settings
from app.services.email_service import ResendEmailService
from app.schemas.invite import InviteResponse, ValidateInviteResponse, InvitationRequestResponse


class InviteService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = ResendEmailService()
    
    def _generate_invite_code(self) -> str:
        """Generate a secure random invite code"""
        return secrets.token_urlsafe(16)  # 16 bytes = ~22 characters URL-safe
    
    def create_invite(self, email: str, session_id: str, created_by: str) -> InviteResponse:
        """
        Create a new session invite.
        
        Args:
            email: Email address to invite
            session_id: Session ID to invite to
            created_by: Admin user ID who created the invite
            
        Returns:
            InviteResponse with invite details
            
        Raises:
            ValueError: If session not found, email already has pending invite, or user already exists as member/admin
        """
        # Check if session exists
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError("Session introuvable")
        
        # Check if user already exists and is member/admin (not guest)
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user and existing_user.role in ["member", "admin", "super_admin"]:
            raise ValueError("Un utilisateur avec cet email existe déjà en tant que membre ou administrateur")
        
        # Check if there's already a pending invite for this email
        pending_invite = self.db.query(SessionInvite).filter(
            and_(
                SessionInvite.email == email,
                SessionInvite.status == "pending",
                SessionInvite.expires_at > datetime.utcnow()
            )
        ).first()
        
        if pending_invite:
            raise ValueError("Une invitation en attente existe déjà pour cet email")
        
        # Generate invite code
        code = self._generate_invite_code()
        
        # Ensure code is unique
        while self.db.query(SessionInvite).filter(SessionInvite.code == code).first():
            code = self._generate_invite_code()
        
        # Set expiration to 7 days from now
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Create invite
        invite = SessionInvite(
            code=code,
            email=email,
            session_id=session_id,
            created_by=created_by,
            expires_at=expires_at,
            status="pending"
        )
        self.db.add(invite)
        self.db.commit()
        self.db.refresh(invite)
        
        # Send invite email
        invite_url = f"{settings.FRONTEND_BASE_URL}/invitation/{code}"
        self._send_invite_email(email, session.title, invite_url)
        
        return self._invite_to_response(invite)
    
    def _send_invite_email(self, email: str, session_title: str, invite_url: str):
        """Send invite email with link"""
        subject = f"Invitation à une session - {settings.SMTP_FROM_NAME}"
        html_content = self.email_service._render_notification_template(
            name="",
            title="Invitation à une session",
            message=f"Vous avez été invité(e) à participer à la session suivante :",
            details={
                "Session": session_title
            },
            action_text="Accepter l'invitation",
            action_url=invite_url,
            custom_content=f"<p style='color: #6b7280; font-size: 14px; margin-top: 20px;'>Cette invitation est valide pendant 7 jours. Cliquez sur le bouton ci-dessus pour vous inscrire.</p>"
        )
        self.email_service._send_email(
            to_email=email,
            to_name="",
            subject=subject,
            html_content=html_content,
            tags=["invite", "session"]
        )
    
    def validate_invite_code(self, code: str) -> ValidateInviteResponse:
        """
        Validate an invite code.
        
        Args:
            code: Invite code to validate
            
        Returns:
            ValidateInviteResponse with validation result
        """
        invite = self.db.query(SessionInvite).filter(SessionInvite.code == code).first()
        
        if not invite:
            return ValidateInviteResponse(
                valid=False,
                message="Code d'invitation invalide"
            )
        
        # Check if already used
        if invite.status == "used":
            return ValidateInviteResponse(
                valid=False,
                message="Cette invitation a déjà été utilisée"
            )
        
        # Check if cancelled
        if invite.status == "cancelled":
            return ValidateInviteResponse(
                valid=False,
                message="Cette invitation a été annulée"
            )
        
        # Check if expired
        if invite.expires_at < datetime.utcnow():
            # Update status to expired
            invite.status = "expired"
            self.db.commit()
            return ValidateInviteResponse(
                valid=False,
                message="Cette invitation a expiré"
            )
        
        # Get session title
        session = self.db.query(Session).filter(Session.id == invite.session_id).first()
        session_title = session.title if session else None
        
        return ValidateInviteResponse(
            valid=True,
            email=invite.email,
            sessionId=str(invite.session_id),
            sessionTitle=session_title,
            expiresAt=invite.expires_at.isoformat()
        )
    
    def get_invites(
        self,
        status: Optional[str] = None,
        session_id: Optional[str] = None,
        email: Optional[str] = None
    ) -> List[InviteResponse]:
        """
        Get list of invites with optional filters.
        
        Args:
            status: Filter by status (pending, used, expired, cancelled)
            session_id: Filter by session ID
            email: Filter by email
            
        Returns:
            List of InviteResponse
        """
        query = self.db.query(SessionInvite)
        
        if status:
            query = query.filter(SessionInvite.status == status)
        
        if session_id:
            query = query.filter(SessionInvite.session_id == session_id)
        
        if email:
            query = query.filter(SessionInvite.email.ilike(f"%{email}%"))
        
        # Order by created_at descending
        invites = query.order_by(SessionInvite.created_at.desc()).all()
        
        return [self._invite_to_response(invite) for invite in invites]
    
    def get_invite_by_id(self, invite_id: str) -> Optional[InviteResponse]:
        """Get invite by ID"""
        invite = self.db.query(SessionInvite).filter(SessionInvite.id == invite_id).first()
        if not invite:
            return None
        return self._invite_to_response(invite)
    
    def cancel_invite(self, invite_id: str) -> bool:
        """
        Cancel an invite.
        
        Args:
            invite_id: Invite ID to cancel
            
        Returns:
            True if cancelled, False if not found or already used
        """
        invite = self.db.query(SessionInvite).filter(SessionInvite.id == invite_id).first()
        if not invite:
            return False
        
        # Can't cancel if already used
        if invite.status == "used":
            return False
        
        invite.status = "cancelled"
        self.db.commit()
        return True
    
    def mark_invite_used(self, code: str, user_id: str) -> bool:
        """
        Mark an invite as used.
        
        Args:
            code: Invite code
            user_id: User ID who used the invite
            
        Returns:
            True if marked, False if not found
        """
        invite = self.db.query(SessionInvite).filter(SessionInvite.code == code).first()
        if not invite:
            return False
        
        invite.status = "used"
        invite.used_at = datetime.utcnow()
        invite.used_by = user_id
        self.db.commit()
        return True
    
    def _invite_to_response(self, invite: SessionInvite) -> InviteResponse:
        """Convert SessionInvite to InviteResponse"""
        # Get session title
        session = self.db.query(Session).filter(Session.id == invite.session_id).first()
        session_title = session.title if session else None
        
        # Get creator name
        created_by_name = None
        if invite.created_by:
            creator = self.db.query(User).filter(User.id == invite.created_by).first()
            if creator:
                created_by_name = f"{creator.first_name} {creator.last_name}"
        
        # Get user name (if used)
        used_by_name = None
        if invite.used_by:
            user = self.db.query(User).filter(User.id == invite.used_by).first()
            if user:
                used_by_name = f"{user.first_name} {user.last_name}"
        
        # Build invite URL
        invite_url = f"{settings.FRONTEND_BASE_URL}/invitation/{invite.code}"
        
        return InviteResponse(
            id=str(invite.id),
            code=invite.code,
            email=invite.email,
            sessionId=str(invite.session_id),
            sessionTitle=session_title,
            createdBy=str(invite.created_by) if invite.created_by else None,
            createdByName=created_by_name,
            expiresAt=invite.expires_at.isoformat(),
            status=invite.status,
            usedAt=invite.used_at.isoformat() if invite.used_at else None,
            usedBy=str(invite.used_by) if invite.used_by else None,
            usedByName=used_by_name,
            createdAt=invite.created_at.isoformat(),
            inviteUrl=invite_url
        )
    
    def add_session_to_guest(self, guest_id: str, session_id: str) -> bool:
        """
        Add a session to an existing guest user.
        This allows admins to give guests access to additional sessions.
        
        Args:
            guest_id: Guest user ID
            session_id: Session ID to add
            
        Returns:
            True if added, False if user is not a guest or session not found
        """
        # Check if user exists and is a guest
        user = self.db.query(User).filter(User.id == guest_id).first()
        if not user or user.role != "guest":
            return False
        
        # Check if session exists
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return False
        
        # Check if already registered
        from app.models.session import SessionRegistration
        existing = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.user_id == guest_id
            )
        ).first()
        
        if existing:
            return False  # Already registered
        
        # Register guest for session
        registration = SessionRegistration(
            session_id=session_id,
            user_id=guest_id
        )
        self.db.add(registration)
        
        # Update registered count
        session.registered += 1
        self.db.commit()
        
        return True
    
    def create_invitation_request(
        self,
        email: str,
        full_name: str,
        reason: str,
        session_id: str,
        requested_by: str
    ) -> InvitationRequestResponse:
        """
        Create an invitation request from a member.
        
        Args:
            email: Email address to invite
            full_name: Full name of the person to invite
            reason: Reason why the member wants to invite this person
            session_id: Session ID to invite to
            requested_by: Member user ID who requested the invite
            
        Returns:
            InvitationRequestResponse with request details
            
        Raises:
            ValueError: If session not found, user already exists as member/admin, or pending request exists
        """
        # Check if session exists
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise ValueError("Session introuvable")
        
        # Check if user already exists and is member/admin (not guest)
        existing_user = self.db.query(User).filter(User.email == email).first()
        if existing_user and existing_user.role in ["member", "admin", "super_admin"]:
            raise ValueError("Un utilisateur avec cet email existe déjà en tant que membre ou administrateur")
        
        # Check if there's already a pending request for this email and session
        pending_request = self.db.query(InvitationRequest).filter(
            and_(
                InvitationRequest.email == email,
                InvitationRequest.session_id == session_id,
                InvitationRequest.status == "pending"
            )
        ).first()
        
        if pending_request:
            raise ValueError("Une demande d'invitation en attente existe déjà pour cet email et cette session")
        
        # Create request
        request = InvitationRequest(
            email=email,
            full_name=full_name,
            reason=reason,
            session_id=session_id,
            requested_by=requested_by,
            status="pending"
        )
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        
        # Send email notification to all admins
        self._notify_admins_of_request(request)
        
        # Send confirmation email to the requester
        self._send_request_created_confirmation(request)
        
        return self._invitation_request_to_response(request)
    
    def _notify_admins_of_request(self, request: InvitationRequest):
        """Send email notification to all admins about a new invitation request"""
        # Get all active admins
        admins = self.db.query(User).filter(
            and_(
                User.role.in_(["admin", "super_admin"]),
                User.status == "active"
            )
        ).all()
        
        if not admins:
            return
        
        # Get requester name
        requester = self.db.query(User).filter(User.id == request.requested_by).first()
        requester_name = f"{requester.first_name} {requester.last_name}" if requester else "Un membre"
        
        # Get session title
        session = self.db.query(Session).filter(Session.id == request.session_id).first()
        session_title = session.title if session else "Session inconnue"
        
        # Send email to each admin
        for admin in admins:
            subject = f"Nouvelle demande d'invitation - {settings.SMTP_FROM_NAME}"
            html_content = self.email_service._render_notification_template(
                name=f"{admin.first_name} {admin.last_name}",
                title="Nouvelle demande d'invitation",
                message=f"{requester_name} a demandé d'inviter quelqu'un à une session :",
                details={
                    "Email de l'invité": request.email,
                    "Nom complet": request.full_name,
                    "Session": session_title,
                    "Raison": request.reason
                },
                action_text="Voir les demandes",
                action_url=f"{settings.FRONTEND_BASE_URL}/admin/membres",
                custom_content="<p style='color: #6b7280; font-size: 14px; margin-top: 20px;'>Vous pouvez approuver ou rejeter cette demande depuis le panneau d'administration.</p>"
            )
            self.email_service._send_email(
                to_email=admin.email,
                to_name=f"{admin.first_name} {admin.last_name}",
                subject=subject,
                html_content=html_content,
                tags=["invitation_request", "admin_notification"]
            )
    
    def _send_request_created_confirmation(self, request: InvitationRequest):
        """Send confirmation email to the requester when their invitation request is created"""
        requester = self.db.query(User).filter(User.id == request.requested_by).first()
        if not requester:
            return
        
        # Get session title
        session = self.db.query(Session).filter(Session.id == request.session_id).first()
        session_title = session.title if session else "Session inconnue"
        
        subject = f"Confirmation de votre demande d'invitation - {settings.SMTP_FROM_NAME}"
        html_content = self.email_service._render_notification_template(
            name=f"{requester.first_name} {requester.last_name}",
            title="Demande d'invitation créée",
            message="Votre demande d'invitation a été créée avec succès et sera examinée par un administrateur.",
            details={
                "Email de l'invité": request.email,
                "Nom complet": request.full_name,
                "Session": session_title,
                "Raison": request.reason
            },
            custom_content="<p style='color: #6b7280; font-size: 14px; margin-top: 20px;'>Vous recevrez une notification par email une fois qu'un administrateur aura examiné votre demande.</p>"
        )
        self.email_service._send_email(
            to_email=requester.email,
            to_name=f"{requester.first_name} {requester.last_name}",
            subject=subject,
            html_content=html_content,
            tags=["invitation_request", "confirmation", "created"]
        )
    
    def _send_request_approved_confirmation(self, request: InvitationRequest):
        """Send confirmation email to the requester when their invitation request is approved"""
        requester = self.db.query(User).filter(User.id == request.requested_by).first()
        if not requester:
            return
        
        # Get session title
        session = self.db.query(Session).filter(Session.id == request.session_id).first()
        session_title = session.title if session else "Session inconnue"
        
        # Get reviewer name
        reviewer_name = "un administrateur"
        if request.reviewed_by:
            reviewer = self.db.query(User).filter(User.id == request.reviewed_by).first()
            if reviewer:
                reviewer_name = f"{reviewer.first_name} {reviewer.last_name}"
        
        subject = f"Votre demande d'invitation a été approuvée - {settings.SMTP_FROM_NAME}"
        html_content = self.email_service._render_notification_template(
            name=f"{requester.first_name} {requester.last_name}",
            title="Demande d'invitation approuvée",
            message="Votre demande d'invitation a été approuvée et l'invitation a été envoyée à la personne concernée.",
            details={
                "Email de l'invité": request.email,
                "Nom complet": request.full_name,
                "Session": session_title,
                "Approuvé par": reviewer_name
            },
            custom_content="<p style='color: #6b7280; font-size: 14px; margin-top: 20px;'>L'invitation a été créée et un email a été envoyé à <strong>" + request.email + "</strong>.</p>"
        )
        self.email_service._send_email(
            to_email=requester.email,
            to_name=f"{requester.first_name} {requester.last_name}",
            subject=subject,
            html_content=html_content,
            tags=["invitation_request", "confirmation", "approved"]
        )
    
    def _send_request_rejected_confirmation(self, request: InvitationRequest):
        """Send confirmation email to the requester when their invitation request is rejected"""
        requester = self.db.query(User).filter(User.id == request.requested_by).first()
        if not requester:
            return
        
        # Get session title
        session = self.db.query(Session).filter(Session.id == request.session_id).first()
        session_title = session.title if session else "Session inconnue"
        
        # Get reviewer name
        reviewer_name = "un administrateur"
        if request.reviewed_by:
            reviewer = self.db.query(User).filter(User.id == request.reviewed_by).first()
            if reviewer:
                reviewer_name = f"{reviewer.first_name} {reviewer.last_name}"
        
        subject = f"Votre demande d'invitation a été rejetée - {settings.SMTP_FROM_NAME}"
        html_content = self.email_service._render_notification_template(
            name=f"{requester.first_name} {requester.last_name}",
            title="Demande d'invitation rejetée",
            message="Votre demande d'invitation a été rejetée par un administrateur.",
            details={
                "Email de l'invité": request.email,
                "Nom complet": request.full_name,
                "Session": session_title,
                "Rejeté par": reviewer_name
            },
            custom_content="<p style='color: #6b7280; font-size: 14px; margin-top: 20px;'>Si vous avez des questions concernant cette décision, n'hésitez pas à contacter l'administration.</p>"
        )
        self.email_service._send_email(
            to_email=requester.email,
            to_name=f"{requester.first_name} {requester.last_name}",
            subject=subject,
            html_content=html_content,
            tags=["invitation_request", "confirmation", "rejected"]
        )
    
    def get_invitation_requests(
        self,
        status: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> List[InvitationRequestResponse]:
        """
        Get list of invitation requests with optional filters.
        
        Args:
            status: Filter by status (pending, approved, rejected)
            session_id: Filter by session ID
            
        Returns:
            List of InvitationRequestResponse
        """
        query = self.db.query(InvitationRequest)
        
        if status:
            query = query.filter(InvitationRequest.status == status)
        
        if session_id:
            query = query.filter(InvitationRequest.session_id == session_id)
        
        # Order by created_at descending
        requests = query.order_by(InvitationRequest.created_at.desc()).all()
        
        return [self._invitation_request_to_response(req) for req in requests]
    
    def get_invitation_request_by_id(self, request_id: str) -> Optional[InvitationRequestResponse]:
        """Get invitation request by ID"""
        request = self.db.query(InvitationRequest).filter(InvitationRequest.id == request_id).first()
        if not request:
            return None
        return self._invitation_request_to_response(request)
    
    def review_invitation_request(
        self,
        request_id: str,
        action: str,
        reviewed_by: str
    ) -> Optional[InvitationRequestResponse]:
        """
        Review (approve or reject) an invitation request.
        
        Args:
            request_id: Invitation request ID
            action: Either 'approve' or 'reject'
            reviewed_by: Admin user ID who reviewed the request
            
        Returns:
            InvitationRequestResponse if successful, None if request not found or already reviewed
        """
        request = self.db.query(InvitationRequest).filter(InvitationRequest.id == request_id).first()
        if not request:
            return None
        
        # Can't review if already reviewed
        if request.status != "pending":
            return None
        
        if action == "approve":
            request.status = "approved"
            request.reviewed_by = reviewed_by
            request.reviewed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(request)
            
            # Create the actual invite and send email
            try:
                invite = self.create_invite(
                    email=request.email,
                    session_id=str(request.session_id),
                    created_by=reviewed_by
                )
                # Note: create_invite already sends the email
            except ValueError as e:
                # If invite creation fails, rollback the approval
                self.db.rollback()
                raise ValueError(f"Impossible de créer l'invitation : {str(e)}")
            
            # Send confirmation email to the requester
            self._send_request_approved_confirmation(request)
            
        elif action == "reject":
            request.status = "rejected"
            request.reviewed_by = reviewed_by
            request.reviewed_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(request)
            
            # Send confirmation email to the requester
            self._send_request_rejected_confirmation(request)
        else:
            raise ValueError("Action invalide. Utilisez 'approve' ou 'reject'")
        
        return self._invitation_request_to_response(request)
    
    def _invitation_request_to_response(self, request: InvitationRequest) -> InvitationRequestResponse:
        """Convert InvitationRequest to InvitationRequestResponse"""
        # Get session title
        session = self.db.query(Session).filter(Session.id == request.session_id).first()
        session_title = session.title if session else None
        
        # Get requester name
        requester_name = None
        if request.requested_by:
            requester = self.db.query(User).filter(User.id == request.requested_by).first()
            if requester:
                requester_name = f"{requester.first_name} {requester.last_name}"
        
        # Get reviewer name
        reviewer_name = None
        if request.reviewed_by:
            reviewer = self.db.query(User).filter(User.id == request.reviewed_by).first()
            if reviewer:
                reviewer_name = f"{reviewer.first_name} {reviewer.last_name}"
        
        return InvitationRequestResponse(
            id=str(request.id),
            email=request.email,
            fullName=request.full_name,
            reason=request.reason,
            sessionId=str(request.session_id),
            sessionTitle=session_title,
            requestedBy=str(request.requested_by),
            requestedByName=requester_name,
            status=request.status,
            reviewedBy=str(request.reviewed_by) if request.reviewed_by else None,
            reviewedByName=reviewer_name,
            reviewedAt=request.reviewed_at.isoformat() if request.reviewed_at else None,
            createdAt=request.created_at.isoformat(),
            updatedAt=request.updated_at.isoformat()
        )






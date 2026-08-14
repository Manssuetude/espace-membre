from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from typing import Optional, List, Dict
from datetime import datetime, timezone
import logging

from app.models.user import User
from app.models.session import SessionRegistration, Session
from app.models.feedback import Feedback
from app.models.theme import Theme
from app.models.poll import Poll, PollVote, PollOption
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache, dashboard_cache
from app.services.email_service import ResendEmailService, EmailService

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all user-related caches"""
        list_cache.invalidate_pattern("users_list")
        dashboard_cache.invalidate_pattern("member_dashboard")
        dashboard_cache.invalidate_pattern("admin_dashboard")
    
    def _invalidate_user_cache(self, user_id: Optional[str] = None):
        """Invalidate user-specific caches"""
        if user_id:
            dashboard_cache.delete(f"member_dashboard_{user_id}")

    def _send_guest_promoted_email(self, user: User):
        """
        Send a welcome/congratulations email when a guest becomes a member.
        Uses a dedicated template when available, otherwise falls back to welcome email.
        """
        try:
            email_service = EmailService()
            to_name = f"{user.first_name} {user.last_name}"

            if hasattr(email_service, "send_guest_promoted_to_member_email"):
                email_service.send_guest_promoted_to_member_email(
                    to_email=user.email,
                    to_name=to_name
                )
            else:
                email_service.send_welcome_email(
                    to_email=user.email,
                    to_name=to_name,
                    temporary_password=None
                )
        except Exception as e:
            # Log error but don't fail the role change if email fails
            logger.error(
                f"Failed to send guest->member email to {user.email}: {str(e)}"
            )
    
    def get_users(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        member_only: bool = False
    ) -> Dict:
        """
        Get all users with filtering and pagination, including stats.
        
        Args:
            status: Filter by status (all, active, suspended)
            search: Search in name/email
            page: Page number
            limit: Items per page
            member_only: If True, only show active members (for member access)
        
        Returns:
            Dict with paginated users and overall stats
        """
        # Check cache (include member_only in cache key)
        cache_key = f"users_list_status:{status or 'all'}_search:{search or ''}_page:{page}_limit:{limit}_member_only:{member_only}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(User)
        
        # If member_only, restrict to active members (including admins) for non-admin viewers
        if member_only:
            query = query.filter(
                User.status == "active",
                User.role.in_(["member", "admin", "super_admin"])
            )
        else:
            # Filter by status (for admins)
            if status and status != "all":
                query = query.filter(User.status == status)
        
        # Search
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term)
                )
            )
        
        # Count total
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        users = query.offset(offset).limit(limit).all()
        
        # Calculate overall stats
        if member_only:
            # For members/guests, only show count of active members (including admins)
            active_members = self.db.query(User).filter(
                User.status == "active",
                User.role.in_(["member", "admin", "super_admin"])
            ).count()
            stats = {
                "activeMembers": active_members
            }
        else:
            # For admins, show all stats
            total_members = self.db.query(User).filter(User.role == "member").count()
            active_members = self.db.query(User).filter(
                User.role == "member",
                User.status == "active"
            ).count()
            administrators = self.db.query(User).filter(
                User.role.in_(["admin", "super_admin"])
            ).count()
            pending = self.db.query(User).filter(User.status == "suspended").count()
            
            stats = {
                "totalMembers": total_members,
                "activeMembers": active_members,
                "administrators": administrators,
                "pending": pending
            }
        
        # Batch calculate sessions count for all users to avoid N+1 queries
        user_ids = [u.id for u in users]
        
        # Batch count completed sessions per user (only sessions they actually attended)
        sessions_counts = {}
        if user_ids:
            sessions_data = self.db.query(
                SessionRegistration.user_id,
                func.count(SessionRegistration.id).label('count')
            ).join(
                Session,
                SessionRegistration.session_id == Session.id
            ).filter(
                and_(
                    SessionRegistration.user_id.in_(user_ids),
                    Session.status == "completed",
                    SessionRegistration.attended == True
                )
            ).group_by(SessionRegistration.user_id).all()
            
            sessions_counts = {str(user_id): count for user_id, count in sessions_data}
        
        # Build response with pre-calculated stats (no history for list view)
        user_responses = []
        for user in users:
            user_id_str = str(user.id)
            name = f"{user.first_name} {user.last_name}".strip()
            
            user_responses.append(UserResponse(
                id=user_id_str,
                email=user.email,
                firstName=user.first_name,
                lastName=user.last_name,
                name=name,
                phone=user.phone,
                address=user.address,
                postalCode=user.postal_code,
                city=user.city,
                bio=user.bio,
                avatar=user.avatar_url,
                role=user.role,
                status=user.status,
                sessionsCount=sessions_counts.get(user_id_str, 0),
                feedbacksCount=0,  # Not needed for list view
                themesCount=0,  # Not needed for list view
                memberSince=user.member_since.isoformat() if user.member_since else None,
                createdAt=user.created_at.isoformat() if user.created_at else None,
                updatedAt=user.updated_at.isoformat() if user.updated_at else None,
                lastLogin=user.last_login.isoformat() if user.last_login else None,
                pollHistory=None,
                feedbacksHistory=None,
                sessionAttendanceHistory=None
            ))
        
        result = PaginatedResponse(
            data=user_responses,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        response = {
            **result.model_dump(),
            "stats": stats
        }
        
        # Cache the result
        list_cache.set(cache_key, response)
        return response
    
    def get_user_by_id(self, user_id: str, include_history: bool = True, user: Optional[User] = None) -> Optional[UserResponse]:
        """
        Get user by ID with optional history data.
        
        Args:
            user_id: User ID
            include_history: If True, includes poll history, feedbacks history, and session attendance history
            user: Optional pre-loaded User object to avoid duplicate query
        
        Returns:
            UserResponse with user data and optionally history
        """
        if user is None:
            user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        return self._user_to_dict(user, include_history=include_history)
    
    def create_user(self, data: UserCreate) -> UserResponse:
        """Create a new user"""
        user = User(
            email=data.email,
            first_name=data.firstName,
            last_name=data.lastName,
            phone=data.phone,
            address=data.address,
            avatar_url=data.avatar,
            role=data.role,
            status="active",
            member_since=datetime.now(timezone.utc)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        self._invalidate_cache()
        
        # Send welcome email
        email_service = ResendEmailService()
        email_service.send_welcome_email(
            to_email=user.email,
            to_name=f"{user.first_name} {user.last_name}",
            temporary_password=None  # No password needed - authentication via OTP
        )
        
        return self._user_to_dict(user)
    
    def update_user(self, user_id: str, data: UserUpdate, current_user_role: Optional[str] = None) -> Optional[UserResponse]:
        """
        Update user.
        
        Args:
            user_id: ID of user to update
            data: UserUpdate data
            current_user_role: Role of the current user performing the action (for permission checks)
        
        Returns:
            UserResponse if successful, None if user not found
        
        Raises:
            ValueError: If trying to update admin role/status without super_admin role
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Check permissions for role/status changes on admins
        if current_user_role and user.role in ["admin", "super_admin"]:
            if data.role is not None and current_user_role != "super_admin":
                raise ValueError("Seuls les super administrateurs peuvent modifier le rôle d'autres administrateurs")
            if data.status is not None and current_user_role != "super_admin":
                raise ValueError("Seuls les super administrateurs peuvent modifier le statut d'autres administrateurs")
        
        # Track if email is being changed
        old_email = user.email
        old_role = user.role
        email_changed = False
        
        if data.firstName is not None:
            user.first_name = data.firstName
        if data.lastName is not None:
            user.last_name = data.lastName
        if data.email is not None:
            if data.email != old_email:
                email_changed = True
            user.email = data.email
        if data.phone is not None:
            user.phone = data.phone
        if data.address is not None:
            user.address = data.address
        if data.postalCode is not None:
            user.postal_code = data.postalCode
        if data.city is not None:
            user.city = data.city
        if data.bio is not None:
            user.bio = data.bio
        if data.avatar is not None:
            user.avatar_url = data.avatar
        if data.role is not None:
            user.role = data.role
        if data.status is not None:
            user.status = data.status
        
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        self._invalidate_cache()
        
        # Send email notification if email was changed
        if email_changed:
            email_service = ResendEmailService()
            email_service.send_email_changed_notification(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                old_email=old_email,
                new_email=user.email
            )

        # Send welcome/congratulations email when a guest is promoted to member
        if old_role == "guest" and user.role == "member":
            self._send_guest_promoted_email(user)
        
        return self._user_to_dict(user)
    
    def suspend_user(self, user_id: str, current_user_role: str) -> Optional[UserResponse]:
        """
        Suspend a user.
        
        Args:
            user_id: ID of user to suspend
            current_user_role: Role of the current user performing the action
        
        Returns:
            UserResponse if successful, None if user not found
        
        Raises:
            ValueError: If trying to suspend an admin without super_admin role
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Check if trying to suspend an admin
        if user.role in ["admin", "super_admin"] and current_user_role != "super_admin":
            raise ValueError("Seuls les super administrateurs peuvent suspendre d'autres administrateurs")
        
        user.status = "suspended"
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        self._invalidate_cache()
        
        # Send email notification to the suspended user
        try:
            email_service = EmailService()
            email_service.send_account_suspended_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}"
            )
        except Exception as e:
            # Log error but don't fail the suspension if email fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send suspension email to {user.email}: {str(e)}")
        
        return self._user_to_dict(user)
    
    def unsuspend_user(self, user_id: str, current_user_role: str) -> Optional[UserResponse]:
        """
        Unsuspend a user (reactivate their account).
        
        Args:
            user_id: ID of user to unsuspend
            current_user_role: Role of the current user performing the action
        
        Returns:
            UserResponse if successful, None if user not found
        
        Raises:
            ValueError: If trying to unsuspend an admin without super_admin role, or if user is not suspended
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Check if user is actually suspended
        if user.status != "suspended":
            raise ValueError("L'utilisateur n'est pas suspendu")
        
        # Check if trying to unsuspend an admin
        if user.role in ["admin", "super_admin"] and current_user_role != "super_admin":
            raise ValueError("Seuls les super administrateurs peuvent réactiver d'autres administrateurs")
        
        user.status = "active"
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        self._invalidate_cache()
        
        # Send email notification to the unsuspended user
        try:
            email_service = EmailService()
            email_service.send_account_unsuspended_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}"
            )
        except Exception as e:
            # Log error but don't fail the unsuspension if email fails
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send unsuspension email to {user.email}: {str(e)}")
        
        return self._user_to_dict(user)
    
    def upgrade_guest_to_member(self, user_id: str) -> Optional[UserResponse]:
        """
        Upgrade a guest user to member.
        
        Args:
            user_id: ID of guest user to upgrade
            
        Returns:
            UserResponse if successful, None if user not found or not a guest
            
        Raises:
            ValueError: If user is not a guest
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        if user.role != "guest":
            raise ValueError("Seuls les invités peuvent être promus membres")
        
        user.role = "member"
        user.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(user)
        self._invalidate_cache()
        self._send_guest_promoted_email(user)
        return self._user_to_dict(user)
    
    def delete_user(self, user_id: str, current_user_role: str) -> bool:
        """
        Delete a user.
        
        Args:
            user_id: ID of user to delete
            current_user_role: Role of the current user performing the action
        
        Returns:
            True if successful, False if user not found
        
        Raises:
            ValueError: If trying to delete an admin without super_admin role
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Check if trying to delete an admin
        if user.role in ["admin", "super_admin"] and current_user_role != "super_admin":
            raise ValueError("Seuls les super administrateurs peuvent supprimer d'autres administrateurs")
        
        self.db.delete(user)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def _user_to_dict(self, user: User, include_history: bool = False) -> UserResponse:
        """
        Convert User model to UserResponse with stats and optionally history.
        
        Args:
            user: User model instance
            include_history: If True, includes poll history, feedbacks history, and session attendance history
        """
        # Calculate user stats
        # Count only completed sessions that the user actually attended
        sessions_count = self.db.query(SessionRegistration).join(
            Session,
            SessionRegistration.session_id == Session.id
        ).filter(
            and_(
                SessionRegistration.user_id == user.id,
                Session.status == "completed",
                SessionRegistration.attended == True
            )
        ).count()
        
        feedbacks_count = self.db.query(Feedback).filter(
            Feedback.submitted_by == user.id
        ).count()
        
        themes_count = self.db.query(Theme).filter(
            Theme.submitted_by == user.id
        ).count()
        
        # Build full name
        name = f"{user.first_name} {user.last_name}".strip()
        
        # Get history data if requested
        poll_history = None
        feedbacks_history = None
        session_attendance_history = None
        
        if include_history:
            # Poll history: Get all polls user voted on with their choices
            # Use eager loading to avoid N+1 queries
            from sqlalchemy.orm import joinedload
            from app.models.poll import PollQuestion
            
            poll_votes = self.db.query(PollVote).options(
                joinedload(PollVote.poll),
                joinedload(PollVote.option)
            ).filter(
                PollVote.user_id == user.id
            ).order_by(PollVote.voted_at.desc()).all()
            
            if poll_votes:
                poll_history = []
                # Group votes by poll
                polls_dict = {}
                user_selected_option_ids = {}  # Track which options user selected per poll
                poll_ids_seen = set()
                
                # Get all unique poll IDs
                poll_ids = list(set(vote.poll_id for vote in poll_votes))
                
                # Batch load all polls with questions and options
                polls_with_data = {}
                if poll_ids:
                    polls = self.db.query(Poll).options(
                        joinedload(Poll.questions).joinedload(PollQuestion.options)
                    ).filter(Poll.id.in_(poll_ids)).all()
                    
                    for poll in polls:
                        polls_with_data[str(poll.id)] = poll
                
                for vote in poll_votes:
                    poll_id = str(vote.poll_id)
                    if poll_id not in polls_dict:
                        poll = polls_with_data.get(poll_id)
                        if poll:
                            # Collect all options from all questions (already eager loaded)
                            all_options = []
                            questions_text = []
                            for question in sorted(poll.questions, key=lambda x: x.order_index):
                                for opt in sorted(question.options, key=lambda x: x.order_index):
                                    all_options.append(opt)
                                questions_text.append(question.question)
                            
                            # Use first question or title as display text
                            poll_question_text = questions_text[0] if questions_text else poll.title
                            
                            polls_dict[poll_id] = {
                                "pollId": poll_id,
                                "pollTitle": poll.title,
                                "pollQuestion": poll_question_text,
                                "votedAt": vote.voted_at,
                                "allChoices": [],
                                "userChoices": []
                            }
                            
                            # Initialize all choices
                            user_selected_option_ids[poll_id] = set()
                            
                            # Add all options
                            for opt in all_options:
                                polls_dict[poll_id]["allChoices"].append({
                                    "optionId": str(opt.id),
                                    "optionLabel": opt.label
                                })
                        else:
                            continue
                    else:
                        # Update votedAt to earliest vote time for this poll
                        if vote.voted_at and (polls_dict[poll_id]["votedAt"] is None or vote.voted_at < polls_dict[poll_id]["votedAt"]):
                            polls_dict[poll_id]["votedAt"] = vote.voted_at
                    
                    # Track user's selected option (already eager loaded)
                    option = vote.option
                    if option:
                        option_id_str = str(option.id)
                        if option_id_str not in user_selected_option_ids[poll_id]:
                            user_selected_option_ids[poll_id].add(option_id_str)
                            polls_dict[poll_id]["userChoices"].append({
                                "optionId": option_id_str,
                                "optionLabel": option.label
                            })
                
                # Convert to list and format dates
                poll_history = []
                for poll_data in polls_dict.values():
                    poll_history.append({
                        "pollId": poll_data["pollId"],
                        "pollTitle": poll_data["pollTitle"],
                        "pollQuestion": poll_data["pollQuestion"],
                        "votedAt": poll_data["votedAt"].isoformat() if poll_data["votedAt"] else None,
                        "allChoices": poll_data["allChoices"],
                        "userChoices": poll_data["userChoices"]
                    })
            
            # Feedbacks history: Get all feedbacks submitted by user
            feedbacks = self.db.query(Feedback).filter(
                Feedback.submitted_by == user.id
            ).order_by(Feedback.submitted_at.desc()).all()
            
            if feedbacks:
                feedbacks_history = []
                for feedback in feedbacks:
                    feedbacks_history.append({
                        "id": str(feedback.id),
                        "category": feedback.category,
                        "type": feedback.type,
                        "subject": feedback.subject,
                        "message": feedback.message,
                        "anonymous": feedback.anonymous,
                        "status": feedback.status,
                        "rating": feedback.rating,
                        "sessionId": str(feedback.session_id) if feedback.session_id else None,
                        "submittedAt": feedback.submitted_at.isoformat() if feedback.submitted_at else None
                    })
            
            # Session attendance history: Get all sessions user registered for
            # Use eager loading to avoid N+1 queries
            registrations = self.db.query(SessionRegistration).options(
                joinedload(SessionRegistration.session)
            ).filter(
                SessionRegistration.user_id == user.id
            ).order_by(SessionRegistration.registered_at.desc()).all()
            
            if registrations:
                session_attendance_history = []
                for reg in registrations:
                    session = reg.session  # Already eager loaded
                    if session:
                        session_attendance_history.append({
                            "sessionId": str(session.id),
                            "sessionTitle": session.title,
                            "sessionDate": session.date.isoformat() if session.date else None,
                            "startTime": session.start_time.strftime("%H:%M:%S") if session.start_time else None,
                            "endTime": session.end_time.strftime("%H:%M:%S") if session.end_time else None,
                            "status": session.status,
                            "registeredAt": reg.registered_at.isoformat() if reg.registered_at else None,
                            "attended": reg.attended,
                            "rating": reg.rating,
                            "comment": reg.comment
                        })
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            firstName=user.first_name,
            lastName=user.last_name,
            name=name,
            phone=user.phone,
            address=user.address,
            postalCode=user.postal_code,
            city=user.city,
            bio=user.bio,
            avatar=user.avatar_url,
            role=user.role,
            status=user.status,
            sessionsCount=sessions_count,
            feedbacksCount=feedbacks_count,
            themesCount=themes_count,
            memberSince=user.member_since.isoformat() if user.member_since else None,
            createdAt=user.created_at.isoformat() if user.created_at else None,
            updatedAt=user.updated_at.isoformat() if user.updated_at else None,
            lastLogin=user.last_login.isoformat() if user.last_login else None,
            pollHistory=poll_history,
            feedbacksHistory=feedbacks_history,
            sessionAttendanceHistory=session_attendance_history
        )

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, distinct
from typing import Optional, List
from datetime import datetime, timedelta, date, timezone
import logging
import uuid

from app.models.theme import Theme, ThemeProposalWindow
from app.models.session import Session as SessionModel
from app.models.poll import Poll, PollOption
from app.schemas.theme import (
    CreateThemeRequest,
    UpdateThemeRequest,
    ThemeResponse,
    ThemeWindowStatusResponse,
    OpenWindowRequest,
    ExtendWindowRequest,
    ThemeWindowResponse
)
from app.schemas.common import PaginatedResponse
from app.services.email_service import ResendEmailService
from app.schemas.user import UserSummary
from app.core.cache import list_cache, dashboard_cache

logger = logging.getLogger(__name__)


class ThemeService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all theme-related caches"""
        list_cache.invalidate_pattern("themes_list")
        dashboard_cache.invalidate_pattern("admin_dashboard")
    
    def get_window_status(self, user_id: Optional[str] = None) -> ThemeWindowStatusResponse:
        """
        Get current theme proposal window status.
        
        Args:
            user_id: Optional user ID to include their proposals for the active window
        
        Returns:
            ThemeWindowStatusResponse with window status and user's proposals (if user_id provided)
        """
        now = datetime.utcnow()
        
        # Find active window
        window = self.db.query(ThemeProposalWindow).filter(
            and_(
                ThemeProposalWindow.is_active == True,
                ThemeProposalWindow.start_date <= now,
                ThemeProposalWindow.end_date >= now
            )
        ).first()
        
        # Get user's proposals for the active window if user_id provided
        user_proposals = None
        if user_id and window:
            user_themes = self.db.query(Theme).filter(
                and_(
                    Theme.submitted_by == user_id,
                    Theme.window_id == window.id
                )
            ).order_by(Theme.submitted_at.desc()).all()
            user_proposals = [self._theme_to_dict(t) for t in user_themes]
        
        if window:
            days_remaining = (window.end_date - now).days
            return ThemeWindowStatusResponse(
                isOpen=True,
                startDate=window.start_date.isoformat(),
                endDate=window.end_date.isoformat(),
                daysRemaining=days_remaining,
                nextOpeningDate=None,
                userProposals=user_proposals
            )
        else:
            # Check for future window
            future_window = self.db.query(ThemeProposalWindow).filter(
                ThemeProposalWindow.start_date > now
            ).order_by(ThemeProposalWindow.start_date).first()
            
            return ThemeWindowStatusResponse(
                isOpen=False,
                startDate=None,
                endDate=None,
                daysRemaining=None,
                nextOpeningDate=future_window.start_date.isoformat() if future_window else None,
                userProposals=user_proposals
            )
    
    def open_window(self, data: OpenWindowRequest, created_by: str) -> ThemeWindowResponse:
        """
        Open a new theme proposal window (Admin only).
        
        Args:
            data: OpenWindowRequest with duration
            created_by: Admin user ID
        
        Returns:
            ThemeWindowResponse
        """
        # Deactivate all existing windows
        self.db.query(ThemeProposalWindow).filter(
            ThemeProposalWindow.is_active == True
        ).update({"is_active": False})
        
        # Create new window
        now = datetime.utcnow()
        end_date = now + timedelta(days=data.duration)
        
        window = ThemeProposalWindow(
            start_date=now,
            end_date=end_date,
            is_active=True,
            created_by=created_by
        )
        self.db.add(window)
        self.db.commit()
        self._invalidate_cache()
        self.db.refresh(window)
        
        # Send email notifications to all active members
        # Check if emails were already sent for a window with the same end_date created recently
        # This prevents duplicate emails if the endpoint is called multiple times concurrently
        # Find the earliest window with this end_date created in the last 10 seconds
        earliest_recent_window = self.db.query(ThemeProposalWindow).filter(
            and_(
                ThemeProposalWindow.end_date == end_date,
                ThemeProposalWindow.created_at >= now - timedelta(seconds=10)
            )
        ).order_by(ThemeProposalWindow.created_at.asc()).first()
        
        # Only send emails if this window is the earliest one with this end_date created in the last 10 seconds
        # This ensures only one set of emails is sent even if multiple requests come in concurrently
        should_send_emails = True
        if earliest_recent_window and earliest_recent_window.id != window.id:
            # Another window with the same end_date was created before this one
            should_send_emails = False
            logger.info(f"Skipping email send - window {earliest_recent_window.id} was created before this one (same end_date, within 10s window)")
        elif earliest_recent_window and earliest_recent_window.id == window.id:
            # This is the earliest window, send emails
            should_send_emails = True
            logger.info(f"Sending emails for earliest window {window.id} with end_date {end_date}")
        
        if should_send_emails:
            from app.models.user import User
            
            email_service = ResendEmailService()
            active_users = self.db.query(User).filter(
                User.status == "active",
                User.role != "guest"
            ).all()
            
            end_date_str = end_date.strftime("%d/%m/%Y")
            logger.info(f"Sending theme window opened emails to {len(active_users)} active users")
            for user in active_users:
                email_service.send_theme_window_opened_email(
                    to_email=user.email,
                    to_name=f"{user.first_name} {user.last_name}",
                    end_date=end_date_str
                )
            logger.info(f"Finished sending theme window opened emails")
        else:
            logger.info(f"Skipped sending theme window opened emails to prevent duplicates")
        
        return ThemeWindowResponse(
            id=str(window.id),
            startDate=window.start_date.isoformat(),
            endDate=window.end_date.isoformat(),
            isActive=window.is_active
        )
    
    def extend_window(self, window_id: str, data: ExtendWindowRequest) -> Optional[ThemeWindowResponse]:
        """Extend an active window"""
        # Handle special case: "current" means the active window
        if window_id == "current":
            window = self.db.query(ThemeProposalWindow).filter(
                ThemeProposalWindow.is_active == True
            ).first()
        else:
            # Try to parse as UUID and query by ID
            try:
                uuid.UUID(window_id)  # Validate UUID format
                window = self.db.query(ThemeProposalWindow).filter(
                    ThemeProposalWindow.id == window_id
                ).first()
            except ValueError:
                # Invalid UUID format
                return None
        
        if not window:
            return None
        
        window.end_date = window.end_date + timedelta(days=data.additionalDays)
        window.updated_at = datetime.utcnow()
        self.db.commit()
        self._invalidate_cache()
        self.db.refresh(window)
        
        return ThemeWindowResponse(
            id=str(window.id),
            startDate=window.start_date.isoformat(),
            endDate=window.end_date.isoformat(),
            isActive=window.is_active
        )
    
    def close_window(self, window_id: str) -> bool:
        """Close a theme proposal window"""
        # Handle special case: "current" means the active window
        if window_id == "current":
            window = self.db.query(ThemeProposalWindow).filter(
                ThemeProposalWindow.is_active == True
            ).first()
        else:
            # Try to parse as UUID and query by ID
            try:
                uuid.UUID(window_id)  # Validate UUID format
                window = self.db.query(ThemeProposalWindow).filter(
                    ThemeProposalWindow.id == window_id
                ).first()
            except ValueError:
                # Invalid UUID format
                return False
        
        if not window:
            return False
        
        window.is_active = False
        window.updated_at = datetime.utcnow()
        self.db.commit()
        self._invalidate_cache()
        
        # Send email notifications to all active members
        from app.models.user import User
        email_service = ResendEmailService()
        active_users = self.db.query(User).filter(
            User.status == "active",
            User.role != "guest"
        ).all()
        
        for user in active_users:
            email_service.send_theme_window_closed_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}"
            )
        
        return True
    
    def get_themes(
        self,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse[ThemeResponse]:
        """Get all themes with filtering"""
        # Check cache
        cache_key = f"themes_list_status:{status or 'all'}_page:{page}_limit:{limit}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Theme)
        
        if status and status != "all":
            query = query.filter(Theme.status == status)
        
        total = query.count()
        offset = (page - 1) * limit
        themes = query.order_by(Theme.created_at.desc()).offset(offset).limit(limit).all()
        
        result = PaginatedResponse(
            data=[self._theme_to_dict(t) for t in themes],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        # Cache the result
        list_cache.set(cache_key, result)
        return result
    
    def get_pending_themes(self) -> List[ThemeResponse]:
        """Get pending themes (Admin only)"""
        themes = self.db.query(Theme).filter(
            Theme.status == "pending"
        ).order_by(Theme.submitted_at.desc()).all()
        
        return [self._theme_to_dict(t) for t in themes]
    
    def get_linked_themes(self) -> List[ThemeResponse]:
        """
        Get themes that are linked to at least one session (regardless of session status).
        Matches themes by title since sessions store theme as a string.
        """
        # Get all unique theme strings from sessions
        session_themes = self.db.query(distinct(SessionModel.theme)).filter(
            SessionModel.theme.isnot(None),
            SessionModel.theme != ""
        ).all()
        
        # Extract theme strings from tuples
        theme_strings = [t[0] for t in session_themes if t[0]]
        
        if not theme_strings:
            return []
        
        # Find themes that match any of these strings (by title)
        themes = self.db.query(Theme).filter(
            Theme.title.in_(theme_strings)
        ).all()
        
        return [self._theme_to_dict(t) for t in themes]
    
    def get_unlinked_themes(self) -> List[ThemeResponse]:
        """
        Get themes that are not linked to any session.
        """
        # Get all unique theme strings from sessions
        session_themes = self.db.query(distinct(SessionModel.theme)).filter(
            SessionModel.theme.isnot(None),
            SessionModel.theme != ""
        ).all()
        
        # Extract theme strings from tuples
        theme_strings = [t[0] for t in session_themes if t[0]]
        
        # Find themes that are NOT in the list of linked theme titles
        if theme_strings:
            themes = self.db.query(Theme).filter(
                ~Theme.title.in_(theme_strings)
            ).all()
        else:
            # If no sessions exist, all themes are unlinked
            themes = self.db.query(Theme).all()
        
        return [self._theme_to_dict(t) for t in themes]
    
    def get_theme_by_id(self, theme_id: str) -> Optional[ThemeResponse]:
        """Get theme by ID"""
        theme = self.db.query(Theme).filter(Theme.id == theme_id).first()
        if not theme:
            return None
        return self._theme_to_dict(theme)
    
    def create_theme(self, data: CreateThemeRequest, user_id: str) -> Optional[ThemeResponse]:
        """
        Create a theme proposal (Member - only when window is open).
        
        Business Logic:
        - Check if window is open
        - Check proposal limit (e.g., 2 per window)
        - Create theme with pending status
        """
        # Check if window is open
        window_status = self.get_window_status()
        if not window_status.isOpen:
            return None  # Window is closed
        
        # Get active window
        now = datetime.utcnow()
        window = self.db.query(ThemeProposalWindow).filter(
            and_(
                ThemeProposalWindow.is_active == True,
                ThemeProposalWindow.start_date <= now,
                ThemeProposalWindow.end_date >= now
            )
        ).first()
        
        if not window:
            return None
        
        # Check proposal limit (max 2 per user per window)
        existing_count = self.db.query(Theme).filter(
            and_(
                Theme.submitted_by == user_id,
                Theme.window_id == window.id
            )
        ).count()
        
        if existing_count >= 2:
            return None  # Limit reached
        
        # Create theme
        theme = Theme(
            title=data.title,
            description=data.description,
            category=data.category,
            status="pending",
            submitted_by=user_id,
            window_id=window.id
        )
        self.db.add(theme)
        self.db.commit()
        self._invalidate_cache()
        self.db.refresh(theme)
        
        return self._theme_to_dict(theme)
    
    def create_theme_directly(self, data: CreateThemeRequest, created_by: str, status: str = "approved") -> ThemeResponse:
        """
        Create a theme directly (Admin only - bypasses proposal window).
        
        Args:
            data: CreateThemeRequest with theme details
            created_by: Admin user ID
            status: Initial status (default: "approved")
        
        Returns:
            ThemeResponse
        """
        # Create theme without window restrictions
        theme = Theme(
            title=data.title,
            description=data.description,
            category=data.category,
            status=status,
            submitted_by=created_by,
            window_id=None,  # No window association for direct creation
            reviewed_by=created_by,  # Admin who creates it is the reviewer
            reviewed_at=datetime.utcnow()  # Auto-approved
        )
        self.db.add(theme)
        self.db.commit()
        self._invalidate_cache()
        self.db.refresh(theme)
        
        return self._theme_to_dict(theme)
    
    def update_theme_status(
        self,
        theme_id: str,
        data: UpdateThemeRequest,
        reviewed_by: str
    ) -> Optional[ThemeResponse]:
        """
        Update theme status (Admin only - Approve/Reject).
        
        Args:
            theme_id: Theme ID
            data: UpdateThemeRequest with status and review notes
            reviewed_by: Admin user ID
        """
        theme = self.db.query(Theme).filter(Theme.id == theme_id).first()
        if not theme:
            return None
        
        theme.status = data.status
        theme.reviewed_at = datetime.utcnow()
        theme.reviewed_by = reviewed_by
        if data.reviewNotes:
            theme.review_notes = data.reviewNotes
        
        theme.updated_at = datetime.utcnow()
        self.db.commit()
        self._invalidate_cache()
        self.db.refresh(theme)
        
        return self._theme_to_dict(theme)
    
    def delete_theme(self, theme_id: str) -> bool:
        """Delete a theme (Admin only)"""
        theme = self.db.query(Theme).filter(Theme.id == theme_id).first()
        if not theme:
            return False
        
        self.db.delete(theme)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def _theme_to_dict(self, theme: Theme) -> ThemeResponse:
        """Convert Theme model to ThemeResponse"""
        submitted_by = None
        if theme.submitted_by_user:
            submitted_by = UserSummary(
                id=str(theme.submitted_by_user.id),
                name=f"{theme.submitted_by_user.first_name} {theme.submitted_by_user.last_name}",
                avatar=theme.submitted_by_user.avatar_url
            )
        
        # Calculate session statistics dynamically from sessions table
        # Match by theme title (sessions store theme as string)
        sessions = self.db.query(SessionModel).filter(
            SessionModel.theme == theme.title
        ).all()
        
        session_count = len(sessions)
        next_session_date = None
        last_session_date = None
        
        if sessions:
            # Get all session dates
            session_dates = [s.date for s in sessions if s.date is not None]
            
            if session_dates:
                today = date.today()
                
                # Separate past and future dates
                past_dates = [d for d in session_dates if d < today]
                future_dates = [d for d in session_dates if d >= today]
                
                # Last session date (most recent past date only)
                if past_dates:
                    past_dates.sort()
                    last_session_date = past_dates[-1]
                
                # Next session date (earliest future date)
                if future_dates:
                    future_dates.sort()
                    next_session_date = future_dates[0]
        
        return ThemeResponse(
            id=str(theme.id),
            title=theme.title,
            description=theme.description,
            category=theme.category,
            status=theme.status,
            submittedBy=submitted_by,
            submittedAt=theme.submitted_at.isoformat() if theme.submitted_at else None,
            reviewedAt=theme.reviewed_at.isoformat() if theme.reviewed_at else None,
            reviewedBy=str(theme.reviewed_by) if theme.reviewed_by else None,
            reviewNotes=theme.review_notes,
            sessionCount=session_count,
            nextSessionDate=next_session_date.isoformat() if next_session_date else None,
            lastSessionDate=last_session_date.isoformat() if last_session_date else None,
            likes=theme.likes,
            createdAt=theme.created_at.isoformat() if theme.created_at else None,
            updatedAt=theme.updated_at.isoformat() if theme.updated_at else None
        )
    
    def create_theme_selection_poll(
        self,
        theme_ids: List[str],
        session_id: str
    ) -> dict:
        """
        Create a poll for theme selection from active window and close the window.
        
        Business Logic:
        - Check if active theme window exists
        - Validate all themes are approved
        - Validate session exists and is upcoming
        - Create poll with predefined title/question
        - Options are theme titles
        - singleResponse=true, sessionId is mandatory
        - Close the theme window
        
        Returns:
            dict with poll data
        """
        # Check if active window exists
        now = datetime.now(timezone.utc)
        window = self.db.query(ThemeProposalWindow).filter(
            and_(
                ThemeProposalWindow.is_active == True,
                ThemeProposalWindow.start_date <= now,
                ThemeProposalWindow.end_date >= now
            )
        ).first()
        
        if not window:
            raise ValueError("No active theme proposal window found")
        
        # Validate all themes exist and are approved
        themes = self.db.query(Theme).filter(
            Theme.id.in_(theme_ids)
        ).all()
        
        if len(themes) != len(theme_ids):
            raise ValueError("Some theme IDs are invalid")
        
        for theme in themes:
            if theme.status != "approved":
                raise ValueError(f"Theme {theme.id} is not approved (status: {theme.status})")
        
        # Validate session exists and is upcoming
        session = self.db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise ValueError("Session not found")
        
        if session.status != "upcoming":
            raise ValueError(f"Session must be upcoming (current status: {session.status})")
        
        # Create poll
        today = date.today()
        end_date = today + timedelta(days=7)  # End date is 7 days from today
        
        poll = Poll(
            title="Sélection du thème de la prochaine session",
            description=None,
            results_visibility="hidden",
            anonymous=False,
            start_date=today,
            end_date=end_date,
            session_id=session_id,
            status="active"
        )
        self.db.add(poll)
        self.db.flush()  # Get poll ID
        
        # Create question for the poll
        from app.models.poll import PollQuestion
        question = PollQuestion(
            poll_id=poll.id,
            question="Quel thème souhaitez-vous aborder?",
            single_response=False,  # Users can select multiple themes
            order_index=0
        )
        self.db.add(question)
        self.db.flush()  # Get question ID
        
        # Create options from themes, linked to the question
        colors = ["primary", "accent", "secondary", "success"]
        for idx, theme in enumerate(themes):
            option = PollOption(
                question_id=question.id,
                label=theme.title,
                color=colors[idx % len(colors)],
                order_index=idx
            )
            self.db.add(option)
        
        # Close the window
        window.is_active = False
        window.updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self._invalidate_cache()
        self.db.refresh(poll)
        
        # Send email notifications to all active members
        from app.models.user import User
        email_service = ResendEmailService()
        active_users = self.db.query(User).filter(
            User.status == "active",
            User.role != "guest"
        ).all()
        
        # Get first question text for email
        first_question_text = question.question
        
        for user in active_users:
            email_service.send_theme_poll_created_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                poll_title=poll.title,
                poll_question=first_question_text
            )
        
        # Get all options from the question
        options = self.db.query(PollOption).filter(
            PollOption.question_id == question.id
        ).order_by(PollOption.order_index).all()
        
        # Return poll data
        return {
            "id": str(poll.id),
            "title": poll.title,
            "question": first_question_text,  # For backward compatibility
            "status": poll.status,
            "sessionId": str(session_id),
            "options": [
                {
                    "id": str(opt.id),
                    "label": opt.label,
                    "color": opt.color,
                    "orderIndex": opt.order_index
                }
                for opt in options
            ],
            "createdAt": poll.created_at.isoformat() if poll.created_at else None
        }


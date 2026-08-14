from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List, Dict
from datetime import datetime, date, time, timezone
import random
import string

from app.models.session import Session, SessionObjective, SessionRegistration
from app.models.work_group import WorkGroup, WorkGroupMember
from app.models.user import User
from app.schemas.session import (
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionResponse,
    SessionDetailResponse,
    WorkGroupCreateRequest,
    WorkGroupResponse
)
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache, dashboard_cache
from app.services.email_service import ResendEmailService


class SessionService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all session-related caches"""
        list_cache.invalidate_pattern("sessions_list")
        dashboard_cache.invalidate_pattern("member_dashboard")
        dashboard_cache.invalidate_pattern("admin_dashboard")
    
    def _calculate_session_status(self, session: Session) -> str:
        """
        Calculate the appropriate session status based on date and time.
        
        Logic:
        - If date is in the past → "completed" (unless cancelled)
        - If date is today and endTime has passed → "completed" (unless cancelled)
        - If date is today and session is currently happening → "ongoing"
        - If date is in the future → "upcoming" (unless cancelled)
        - If status is "cancelled", keep it as "cancelled"
        """
        # If already cancelled, keep it cancelled
        if session.status == "cancelled":
            return "cancelled"
        
        now = datetime.now(timezone.utc)
        today = now.date()
        current_time = now.time()
        
        # If no date is set, keep current status
        if not session.date:
            return session.status
        
        # If date is in the past
        if session.date < today:
            return "completed"
        
        # If date is in the future
        if session.date > today:
            return "upcoming"
        
        # If date is today, check times
        if session.date == today:
            # If we have both start and end times
            if session.start_time and session.end_time:
                # Session hasn't started yet
                if current_time < session.start_time:
                    return "upcoming"
                # Session is currently happening
                elif session.start_time <= current_time <= session.end_time:
                    return "ongoing"
                # Session has ended
                else:
                    return "completed"
            # If we only have end time
            elif session.end_time:
                if current_time <= session.end_time:
                    return "ongoing"
                else:
                    return "completed"
            # If we only have start time
            elif session.start_time:
                if current_time < session.start_time:
                    return "upcoming"
                else:
                    return "ongoing"
            # If no times, consider it as upcoming for today
            else:
                return "upcoming"
        
        # Default: keep current status
        return session.status

    def _is_future_session(self, session: Session) -> bool:
        """
        Return True when a session should be considered future/accessible to guests.
        Future includes upcoming or ongoing sessions.
        """
        calculated_status = self._calculate_session_status(session)
        return calculated_status in ["upcoming", "ongoing"]
    
    def get_sessions(
        self,
        status: Optional[str] = None,
        theme: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        page: int = 1,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> PaginatedResponse[SessionResponse]:
        """Get all sessions with filtering and pagination"""
        # Check if user is a guest
        from app.models.user import User
        is_guest = False
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.role == "guest":
                is_guest = True
        
        # Check cache
        cache_key = f"sessions_list_status:{status or 'all'}_theme:{theme or ''}_search:{search or ''}_dateFrom:{date_from or ''}_dateTo:{date_to or ''}_page:{page}_limit:{limit}_user:{user_id or ''}_guest:{is_guest}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Session)
        
        # For guests, show:
        # - sessions they're registered for
        # - all future sessions (upcoming/ongoing)
        if is_guest and user_id:
            today = datetime.now(timezone.utc).date()
            future_clause = or_(
                Session.status.in_(["upcoming", "ongoing"]),
                Session.date >= today
            )

            query = query.outerjoin(
                SessionRegistration,
                and_(
                    Session.id == SessionRegistration.session_id,
                    SessionRegistration.user_id == user_id
                )
            ).filter(
                or_(
                    SessionRegistration.user_id.isnot(None),
                    future_clause
                )
            ).distinct()
        
        if status and status != "all":
            query = query.filter(Session.status == status)
        
        if theme:
            query = query.filter(Session.theme == theme)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Session.title.ilike(search_term),
                    Session.theme.ilike(search_term)
                )
            )
        
        # Date range filtering
        if date_from:
            query = query.filter(Session.date >= date_from)
        
        if date_to:
            query = query.filter(Session.date <= date_to)
        
        total = query.count()
        offset = (page - 1) * limit
        sessions = query.order_by(Session.date.desc(), Session.created_at.desc()).offset(offset).limit(limit).all()
        
        # Update status for sessions based on date/time (if needed)
        updated_sessions = []
        for session in sessions:
            calculated_status = self._calculate_session_status(session)
            if session.status != calculated_status:
                session.status = calculated_status
                session.updated_at = datetime.now(timezone.utc)
                updated_sessions.append(session)
        
        # Commit status updates if any
        if updated_sessions:
            self.db.commit()
            for session in updated_sessions:
                self.db.refresh(session)
        
        result = PaginatedResponse(
            data=[self._session_to_dict(s, user_id=user_id) for s in sessions],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        # Cache the result
        list_cache.set(cache_key, result)
        return result
    
    def get_session_by_id(self, session_id: str, include_details: bool = False, user_id: Optional[str] = None, include_ratings: bool = False) -> Optional[SessionResponse]:
        """Get session by ID"""
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return None
        
        # Check if user is a guest - guests can access registered sessions
        # and all future sessions (upcoming/ongoing)
        from app.models.user import User
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.role == "guest":
                if not self._is_future_session(session):
                    # For non-future sessions, guest must be registered
                    registration = self.db.query(SessionRegistration).filter(
                        and_(
                            SessionRegistration.session_id == session_id,
                            SessionRegistration.user_id == user_id
                        )
                    ).first()
                    if not registration:
                        return None
        
        # Update status based on date/time if needed
        calculated_status = self._calculate_session_status(session)
        if session.status != calculated_status:
            session.status = calculated_status
            session.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(session)
        
        if include_details:
            return self._session_to_dict(session, include_details=True, user_id=user_id, include_ratings=include_ratings)
        return self._session_to_dict(session, user_id=user_id, include_ratings=include_ratings)
    
    def create_session(self, data: CreateSessionRequest, created_by: str) -> SessionResponse:
        """Create a new session (Admin only)"""
        # Get count of active members at creation time
        active_members_count = self.db.query(User).filter(User.status == "active").count()
        
        session = Session(
            title=data.title,
            description=data.description,
            theme=data.theme,
            type=data.type,
            date=data.date,
            start_time=data.startTime,
            end_time=data.endTime,
            location_id=data.locationId,
            is_online=data.isOnline,
            max_participants=data.maxParticipants,
            active_members_at_creation=active_members_count,  # Store active members count at creation
            status="upcoming"  # Default, will be recalculated below
        )
        
        # Add objectives
        if data.objectives:
            for idx, obj in enumerate(data.objectives):
                session.objectives.append(
                    SessionObjective(
                        objective=obj,
                        order_index=idx
                    )
                )
        
        # Calculate initial status based on date/time
        session.status = self._calculate_session_status(session)
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        # Invalidate caches
        self._invalidate_cache()
        
        return self._session_to_dict(session, user_id=created_by)
    
    def update_session(
        self,
        session_id: str,
        data: UpdateSessionRequest,
        user_id: Optional[str] = None
    ) -> Optional[SessionResponse]:
        """Update session (Admin only)"""
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return None
        
        if data.title is not None:
            session.title = data.title
        if data.description is not None:
            session.description = data.description
        if data.theme is not None:
            session.theme = data.theme
        if data.type is not None:
            session.type = data.type
        if data.date is not None:
            session.date = data.date
        if data.startTime is not None:
            session.start_time = data.startTime
        if data.endTime is not None:
            session.end_time = data.endTime
        if data.isOnline is not None:
            session.is_online = data.isOnline
        if data.maxParticipants is not None:
            session.max_participants = data.maxParticipants
        
        # Update status based on date/time (unless explicitly set)
        if data.status is not None:
            # If status is explicitly provided, use it
            session.status = data.status
        else:
            # Otherwise, calculate status based on date/time
            calculated_status = self._calculate_session_status(session)
            session.status = calculated_status
        
        # Handle location
        if data.locationId is not None:
            session.location_id = data.locationId
        
        # Update objectives
        if data.objectives is not None:
            # Delete existing objectives
            self.db.query(SessionObjective).filter(
                SessionObjective.session_id == session_id
            ).delete()
            # Add new objectives
            for idx, obj in enumerate(data.objectives):
                session.objectives.append(
                    SessionObjective(
                        objective=obj,
                        order_index=idx
                    )
                )
        
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(session)
        
        # Invalidate caches
        self._invalidate_cache()
        
        return self._session_to_dict(session, user_id=user_id)
    
    def cancel_session(self, session_id: str) -> Optional[SessionResponse]:
        """Cancel a session by setting status to cancelled"""
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return None
        
        session.status = "cancelled"
        session.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(session)
        
        # Invalidate caches
        self._invalidate_cache()
        
        return self._session_to_dict(session)
    
    def delete_session(self, session_id: str) -> bool:
        """Delete session (Admin only)"""
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return False
        
        self.db.delete(session)
        self.db.commit()
        
        # Invalidate caches
        self._invalidate_cache()
        
        return True

    def send_session_rating_reminder_for_session(self, session_id: str) -> Optional[dict]:
        """
        Send rating reminder emails for a single session.
        - Only allowed once per session (uses Session.rating_reminder_sent flag).
        - Only sessions with status 'completed' are considered.
        - Only users who attended and have not yet rated are notified.
        """
        from app.models.user import User

        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return None

        # Only for completed sessions
        if session.status != "completed":
            return {"alreadySent": False, "invalidStatus": True}

        # Ensure we only send once
        if getattr(session, "rating_reminder_sent", False):
            return {"alreadySent": True}

        regs = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session.id,
                SessionRegistration.attended.is_(True),
                SessionRegistration.rating.is_(None),
            )
        ).all()

        if not regs:
            # No one to notify, but mark as sent to avoid repeated calls
            session.rating_reminder_sent = True
            self.db.commit()
            return {
                "alreadySent": False,
                "emailsSent": 0,
                "emailsFailed": 0,
                "attendeesWithoutRating": 0,
            }

        email_service = ResendEmailService()
        emails_sent = 0
        emails_failed = 0

        session_date_str = session.date.strftime("%d/%m/%Y") if session.date else ""

        for reg in regs:
            user = self.db.query(User).filter(User.id == reg.user_id).first()
            if not user or user.status != "active":
                continue

            full_name = f"{user.first_name} {user.last_name}".strip() or user.email
            success = email_service.send_session_rating_reminder_email(
                to_email=user.email,
                to_name=full_name,
                session_title=session.title,
                session_date=session_date_str,
                session_id=str(session.id),
            )
            if success:
                emails_sent += 1
            else:
                emails_failed += 1

        session.rating_reminder_sent = True
        self.db.commit()

        return {
            "alreadySent": False,
            "emailsSent": emails_sent,
            "emailsFailed": emails_failed,
            "attendeesWithoutRating": len(regs),
        }
    
    def register_for_session(self, session_id: str, user_id: str) -> bool:
        """Register user for a session"""
        # Check if already registered
        existing = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.user_id == user_id
            )
        ).first()
        
        if existing:
            return False  # Already registered
        
        # Check if session is full
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return False
        
        if session.registered >= session.max_participants:
            return False  # Session is full
        
        # Register
        registration = SessionRegistration(
            session_id=session_id,
            user_id=user_id
        )
        self.db.add(registration)
        
        # Update registered count
        session.registered += 1
        self.db.commit()
        
        # Invalidate caches
        self._invalidate_cache()
        
        return True
    
    def unregister_from_session(self, session_id: str, user_id: str) -> bool:
        """Unregister user from a session"""
        # Find registration
        registration = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.user_id == user_id
            )
        ).first()
        
        if not registration:
            return False  # Not registered
        
        # Get session to update count
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return False
        
        # Delete registration
        self.db.delete(registration)
        
        # Update registered count
        if session.registered > 0:
            session.registered -= 1
        
        self.db.commit()
        
        # Invalidate caches
        self._invalidate_cache()
        
        return True

    def set_attendance(self, session_id: str, user_id: str, attended: bool) -> bool:
        """Admin: mark or unmark a user's attendance for a session.
        If marking present and user is not registered, creates a registration automatically."""
        registration = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.user_id == user_id
            )
        ).first()
        
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return False
        
        # If no registration exists and we're marking as attended, create one
        if not registration:
            if attended:
                # Create new registration with attended=True
                registration = SessionRegistration(
                    session_id=session_id,
                    user_id=user_id,
                    attended=True
                )
                self.db.add(registration)
                # Update registered count
                session.registered += 1
            else:
                # Can't mark absent someone who didn't register
                return False
        else:
            # Update existing registration
            registration.attended = attended
        
        # Recalculate attendance_rate for the session
        total_regs = self.db.query(SessionRegistration).filter(
            SessionRegistration.session_id == session_id
        ).count()
        attended_count = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.attended.is_(True)
            )
        ).count()
        
        if total_regs > 0:
            session.attendance_rate = (attended_count / total_regs) * 100
        else:
            session.attendance_rate = None
        
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def rate_session(self, session_id: str, user_id: str, rating: int, comment: Optional[str] = None) -> bool:
        """Rate a session (user must be registered, marked as attended, and session must be completed/cancelled)"""
        # Find registration
        registration = self.db.query(SessionRegistration).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.user_id == user_id
            )
        ).first()
        
        if not registration:
            return False  # Not registered
        
        # User must have been marked as attended by an admin
        if not registration.attended:
            return False
        
        # Check if session is completed or cancelled
        session = self.db.query(Session).filter(Session.id == session_id).first()
        if not session:
            return False
        
        if session.status not in ["completed", "cancelled"]:
            return False  # Can only rate completed or cancelled sessions
        
        # Update registration with rating
        registration.rating = rating
        registration.comment = comment
        registration.rated_at = datetime.now(timezone.utc)  # Set timestamp when rating is submitted
        
        # Calculate and update session's average_grade
        all_ratings = self.db.query(SessionRegistration.rating).filter(
            and_(
                SessionRegistration.session_id == session_id,
                SessionRegistration.rating.isnot(None)
            )
        ).all()
        
        if all_ratings:
            ratings_list = [r[0] for r in all_ratings if r[0] is not None]
            if ratings_list:
                session.average_grade = sum(ratings_list) / len(ratings_list)
        
        self.db.commit()
        
        # Invalidate caches
        self._invalidate_cache()
        
        return True
    
    def create_work_groups(
        self,
        session_id: str,
        data: WorkGroupCreateRequest
    ) -> List[WorkGroupResponse]:
        """Create work groups for a session"""
        # Get registered users
        registrations = self.db.query(SessionRegistration).filter(
            SessionRegistration.session_id == session_id
        ).all()
        
        if not registrations:
            return []
        
        user_ids = [reg.user_id for reg in registrations]
        
        # Delete existing groups
        self.db.query(WorkGroup).filter(
            WorkGroup.session_id == session_id
        ).delete()
        self.db.commit()
        
        # Create groups
        colors = ["primary", "accent", "secondary", "success"]
        groups = []
        
        for i in range(data.numberOfGroups):
            letter = string.ascii_uppercase[i]
            color = colors[i % len(colors)]
            
            group = WorkGroup(
                session_id=session_id,
                name=f"Groupe {letter}",
                letter=letter,
                color=color
            )
            self.db.add(group)
            groups.append(group)
        
        self.db.flush()  # Get group IDs
        
        # Assign users to groups
        if data.isRandom:
            random.shuffle(user_ids)
        
        for idx, user_id in enumerate(user_ids):
            group_index = idx % data.numberOfGroups
            if data.assignments and str(user_id) in data.assignments:
                group_index = data.assignments[str(user_id)]
            
            member = WorkGroupMember(
                work_group_id=groups[group_index].id,
                user_id=user_id,
                is_leader=(idx % data.numberOfGroups == 0)  # First user in group is leader
            )
            self.db.add(member)
        
        self.db.commit()
        
        # Return groups with members
        return self.get_session_groups(session_id)
    
    def get_session_groups(self, session_id: str) -> List[WorkGroupResponse]:
        """Get work groups for a session"""
        groups = self.db.query(WorkGroup).filter(
            WorkGroup.session_id == session_id
        ).all()
        
        result = []
        for group in groups:
            members = []
            for member in group.members:
                user = self.db.query(User).filter(User.id == member.user_id).first()
                if user:
                    members.append({
                        "id": str(user.id),
                        "name": f"{user.first_name} {user.last_name}",
                        "avatar": user.avatar_url,
                        "isLeader": member.is_leader
                    })
            
            result.append(WorkGroupResponse(
                id=str(group.id),
                name=group.name,
                letter=group.letter,
                color=group.color,
                members=members
            ))
        
        return result
    
    def _session_to_dict(self, session: Session, include_details: bool = False, user_id: Optional[str] = None, include_ratings: bool = False) -> SessionResponse:
        """Convert Session model to SessionResponse"""
        # Check if user is registered for this session
        is_registered = False
        user_registration = None
        if user_id:
            user_registration = self.db.query(SessionRegistration).filter(
                and_(
                    SessionRegistration.session_id == session.id,
                    SessionRegistration.user_id == user_id
                )
            ).first()
            is_registered = user_registration is not None
        
        # Handle location from relationship
        location = None
        if session.location:
            location = {
                "id": str(session.location.id),
                "name": session.location.name,
                "address": session.location.address,
                "instructions": session.location.instructions,
                "latitude": float(session.location.latitude) if session.location.latitude is not None else None,
                "longitude": float(session.location.longitude) if session.location.longitude is not None else None,
                "googlePlaceId": session.location.google_place_id
            }
        
        result = SessionResponse(
            id=str(session.id),
            title=session.title,
            description=session.description,
            theme=session.theme,
            type=session.type,
            date=session.date.isoformat() if session.date else None,
            startTime=session.start_time.strftime("%H:%M") if session.start_time else None,
            endTime=session.end_time.strftime("%H:%M") if session.end_time else None,
            locationId=str(session.location_id) if session.location_id else None,
            location=location,
            isOnline=session.is_online,
            maxParticipants=session.max_participants,
            objectives=[obj.objective for obj in sorted(session.objectives, key=lambda x: x.order_index)] if session.objectives else [],
            registered=session.registered,
            status=session.status,
            attendanceRate=float(session.attendance_rate) if session.attendance_rate else None,
            averageGrade=float(session.average_grade) if session.average_grade else None,
            duration=session.duration,
            isRegistered=is_registered,
            createdAt=session.created_at.isoformat() if session.created_at else None,
            updatedAt=session.updated_at.isoformat() if session.updated_at else None
        )
        
        if include_details:
            # Add work groups, polls, resources, attendants
            result = SessionDetailResponse(**result.model_dump())
            result.workGroups = [self._group_to_dict(g) for g in session.work_groups]
            
            # Get polls for this session
            from app.models.poll import Poll
            polls = self.db.query(Poll).filter(Poll.session_id == session.id).all()
            result.polls = [self._poll_to_dict(p) for p in polls]
            
            # Get resources for this session (only approved resources)
            from app.models.resource import Resource
            resources = self.db.query(Resource).filter(
                and_(
                    Resource.session_id == session.id,
                    Resource.status == "approved"
                )
            ).order_by(Resource.created_at.desc()).all()
            result.resources = [self._resource_to_dict(r) for r in resources]
            
            # Get attendants (registered users)
            attendants = []
            registrations = self.db.query(SessionRegistration).filter(
                SessionRegistration.session_id == session.id
            ).order_by(SessionRegistration.registered_at).all()
            
            # Find current user's registration for their rating
            user_rating = None
            # Use the top-level user_registration if available, otherwise find it from registrations
            if user_id and not user_registration:
                user_registration = next(
                    (reg for reg in registrations if str(reg.user_id) == user_id),
                    None
                )
            if user_registration and user_registration.rating is not None:
                user_rating = {
                    "rating": user_registration.rating,
                    "comment": user_registration.comment,
                    "attended": user_registration.attended
                }
            
            for registration in registrations:
                user = self.db.query(User).filter(User.id == registration.user_id).first()
                if user:
                    attendant_data = {
                        "id": str(user.id),
                        "firstName": user.first_name,
                        "lastName": user.last_name,
                        "name": f"{user.first_name} {user.last_name}",
                        "avatar": user.avatar_url,
                        "attended": registration.attended
                    }
                    attendants.append(attendant_data)
            
            result.attendants = attendants
            
            # Build ratings list for admins
            ratings = []
            if include_ratings:
                for registration in registrations:
                    if registration.rating is not None:
                        user = self.db.query(User).filter(User.id == registration.user_id).first()
                        if user:
                            ratings.append({
                                "userId": str(user.id),
                                "userName": f"{user.first_name} {user.last_name}",
                                "rating": registration.rating,
                                "comment": registration.comment,
                                "attended": registration.attended,
                                "ratedAt": registration.registered_at.isoformat() if registration.registered_at else None
                            })
            
            # Add user's own rating and admin ratings to result
            result_dict = result.model_dump()
            if user_rating:
                result_dict["userRating"] = user_rating
            if include_ratings:
                result_dict["ratings"] = ratings
                result_dict["totalRatings"] = len(ratings)
                result_dict["ratingReminderSent"] = getattr(session, "rating_reminder_sent", False)
            
            # Add attended field for the current user (if registered)
            if user_registration:
                result_dict["attended"] = user_registration.attended
            else:
                result_dict["attended"] = None
            
            # Recreate result with all fields
            if user_rating or include_ratings or user_registration:
                result = SessionDetailResponse(**result_dict)
        
        return result
    
    def _group_to_dict(self, group: WorkGroup) -> dict:
        """Convert WorkGroup to dict"""
        return {
            "id": str(group.id),
            "name": group.name,
            "letter": group.letter,
            "color": group.color,
            "members": [
                {
                    "id": str(m.user.id),
                    "name": f"{m.user.first_name} {m.user.last_name}",
                    "avatar": m.user.avatar_url,
                    "isLeader": m.is_leader
                }
                for m in group.members
            ]
        }
    
    def _poll_to_dict(self, poll) -> dict:
        """Convert Poll to dict for session detail"""
        from app.models.poll import PollQuestion, PollOption
        
        # Get all questions and their options
        questions = self.db.query(PollQuestion).filter(
            PollQuestion.poll_id == poll.id
        ).order_by(PollQuestion.order_index).all()
        
        # Build questions list with options
        questions_list = []
        for question in questions:
            options = self.db.query(PollOption).filter(
                    PollOption.question_id == question.id
            ).order_by(PollOption.order_index).all()
            
            questions_list.append({
                "id": str(question.id),
                "question": question.question,
                "description": question.description,
                "singleResponse": question.single_response,
                "orderIndex": question.order_index,
                "options": [
                    {
                        "id": str(opt.id),
                        "label": opt.label,
                        "votes": opt.votes,
                        "percentage": float(opt.percentage) if opt.percentage else 0.0,
                        "color": opt.color,
                        "orderIndex": opt.order_index
                    }
                    for opt in options
                ]
            })
        
        # Use first question text and singleResponse for backward compatibility
        first_question_text = questions_list[0]["question"] if questions_list else poll.title
        first_question_single_response = questions_list[0]["singleResponse"] if questions_list else True
        
        return {
            "id": str(poll.id),
            "title": poll.title,
            "question": first_question_text,  # For backward compatibility
            "description": poll.description,
            "status": poll.status,
            "totalResponses": poll.total_responses,
            "resultsVisibility": poll.results_visibility,
            "anonymous": poll.anonymous,
            "singleResponse": first_question_single_response,  # From first question for backward compatibility
            "startDate": poll.start_date.isoformat() if poll.start_date else None,
            "endDate": poll.end_date.isoformat() if poll.end_date else None,
            "daysLeft": poll.days_left,
            "questions": questions_list,  # New: full questions structure
            "options": questions_list[0]["options"] if questions_list else [],  # For backward compatibility
            "createdAt": poll.created_at.isoformat() if poll.created_at else None,
            "updatedAt": poll.updated_at.isoformat() if poll.updated_at else None
        }
    
    def _resource_to_dict(self, resource) -> dict:
        """Convert Resource to dict for session detail"""
        return {
            "id": str(resource.id),
            "title": resource.title,
            "description": resource.description,
            "type": resource.type,
            "link": resource.link,
            "folderDescription": resource.folder_description,
            "category": resource.category,
            "sessionId": str(resource.session_id) if resource.session_id else None,
            "status": resource.status,
            "reviewedBy": str(resource.reviewed_by) if resource.reviewed_by else None,
            "reviewedAt": resource.reviewed_at.isoformat() if resource.reviewed_at else None,
            "reviewNotes": resource.review_notes,
            "filePath": resource.file_path,
            "fileSize": resource.file_size,
            "createdAt": resource.created_at.isoformat() if resource.created_at else None,
            "updatedAt": resource.updated_at.isoformat() if resource.updated_at else None
        }

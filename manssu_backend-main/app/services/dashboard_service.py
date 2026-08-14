from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import Dict, List, Optional
from datetime import datetime, timedelta, timezone, date

from app.models.theme import Theme, ThemeProposalWindow
from app.models.resource import Resource
from app.models.feedback import Feedback
from app.models.user import User
from app.models.session import Session, SessionRegistration
from app.models.poll import Poll, PollVote, PollOption, PollQuestion
from app.models.location import Location
from app.core.cache import dashboard_cache


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_member_dashboard(self, user_id: str) -> Dict:
        """
        Get member dashboard data.
        
        Args:
            user_id: Current user ID
        
        Returns:
            Dictionary with user-specific dashboard data
        """
        # Check cache
        cache_key = f"member_dashboard_{user_id}"
        cached_data = dashboard_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        
        # Stats
        active_members = self.db.query(User).filter(
            User.status == "active"
        ).count()  # All active users (members + admins)
        
        # Total completed sessions count (only completed, not cancelled)
        completed_sessions = self.db.query(Session).filter(
            Session.status == "completed"
        ).count()
        
        # New resources in last 7 days
        # Compare dates to avoid timezone issues
        new_resources = self.db.query(Resource).filter(
            and_(
                Resource.status == "approved",
                func.date(Resource.created_at) >= seven_days_ago.date()
            )
        ).count()
        
        # Global participation rate for sessions (%)
        # Now calculated as the **average attendance rate** across all completed sessions.
        # Each session has its own attendance_rate (percentage of active members at creation who attended),
        # and we take the average of these values.
        participation_data = self.db.query(
            func.avg(Session.attendance_rate).label("avg_attendance_rate")
        ).filter(
            and_(
                Session.status == "completed",
                Session.attendance_rate.isnot(None),
            )
        ).first()
        
        participation_rate = 0
        if participation_data and participation_data.avg_attendance_rate is not None:
            participation_rate = round(float(participation_data.avg_attendance_rate))
        
        # Upcoming sessions (next 2-3, all upcoming sessions, not just registered)
        # Eager load location to avoid N+1 queries
        upcoming_sessions = self.db.query(Session).options(
            joinedload(Session.location)
        ).filter(
            Session.status == "upcoming"
        ).order_by(Session.date.asc(), Session.start_time.asc()).limit(3).all()
        
        # Get all session IDs for batch registration check (keep as UUIDs)
        session_ids = [s.id for s in upcoming_sessions]
        
        # Batch query all registrations for this user and these sessions
        registered_session_ids = set()
        if session_ids:
            # Convert user_id to UUID if it's a string
            from uuid import UUID as UUIDType
            user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
            
            registrations = self.db.query(SessionRegistration.session_id).filter(
                and_(
                    SessionRegistration.session_id.in_(session_ids),
                    SessionRegistration.user_id == user_uuid
                )
            ).all()
            registered_session_ids = {reg.session_id for reg in registrations}
        
        # Build sessions list
        upcoming_sessions_list = []
        for session in upcoming_sessions:
            is_registered = session.id in registered_session_ids
            
            # Get location (already eager loaded)
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
            
            upcoming_sessions_list.append({
                "id": str(session.id),
                "title": session.title,
                "date": session.date.isoformat() if session.date else None,
                "startTime": session.start_time.strftime("%H:%M") if session.start_time else None,
                "endTime": session.end_time.strftime("%H:%M") if session.end_time else None,
                "location": location,
                "registered": session.registered,
                "maxParticipants": session.max_participants,
                "isRegistered": is_registered,
                "status": session.status
            })
        
        # Active polls (status: 'active')
        # Eager load questions, options, and votes to avoid N+1 queries
        active_polls = self.db.query(Poll).options(
            joinedload(Poll.questions).joinedload(PollQuestion.options),
            joinedload(Poll.votes)
        ).filter(
            Poll.status == "active"
        ).order_by(Poll.created_at.desc()).all()
        
        # Get all poll IDs for batch user vote lookup (keep as UUIDs for query)
        poll_ids = [p.id for p in active_polls]
        
        # Batch query all user votes for these polls
        user_votes_by_poll = {}
        if poll_ids and user_id:
            # Convert user_id to UUID if it's a string
            from uuid import UUID as UUIDType
            user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
            
            user_votes = self.db.query(PollVote).join(PollOption).filter(
                and_(
                    PollVote.poll_id.in_(poll_ids),
                    PollVote.user_id == user_uuid
                )
            ).options(
                joinedload(PollVote.option)
            ).all()
            
            # Group votes by poll_id and question_id
            for vote in user_votes:
                poll_id_str = str(vote.poll_id)
                question_id_str = str(vote.question_id)
                if poll_id_str not in user_votes_by_poll:
                    user_votes_by_poll[poll_id_str] = {}
                if question_id_str not in user_votes_by_poll[poll_id_str]:
                    user_votes_by_poll[poll_id_str][question_id_str] = []
                user_votes_by_poll[poll_id_str][question_id_str].append({
                    "optionId": str(vote.option_id),
                    "optionLabel": vote.option.label if vote.option else None,
                    "votedAt": vote.voted_at.isoformat() if vote.voted_at else None
                })
        
        # Calculate total members once
        total_members = active_members
        
        # Batch calculate unique voters for all polls at once
        from sqlalchemy import distinct
        voter_counts = self.db.query(
            PollVote.poll_id,
            func.count(distinct(PollVote.user_id)).label('voter_count')
        ).filter(
            PollVote.poll_id.in_(poll_ids)
        ).group_by(PollVote.poll_id).all()
        
        voter_counts_dict = {str(poll_id): count for poll_id, count in voter_counts}
        
        # Build polls list
        active_polls_list = []
        today = date.today()
        for poll in active_polls:
            poll_id_str = str(poll.id)
            
            # Get unique voters count from batch query
            unique_voters = voter_counts_dict.get(poll_id_str, 0)
            
            # Calculate participation
            participation = None
            if total_members > 0 and unique_voters > 0:
                participation = float((unique_voters / total_members) * 100)
            
            # Get user's vote for this poll (first question only for dashboard)
            user_vote = None
            if poll_id_str in user_votes_by_poll and poll.questions:
                first_question_id = str(poll.questions[0].id)
                if first_question_id in user_votes_by_poll[poll_id_str]:
                    votes = user_votes_by_poll[poll_id_str][first_question_id]
                    if votes:
                        first_question = poll.questions[0]
                        if first_question.single_response:
                            user_vote = votes[0] if votes else None
                        else:
                            user_vote = votes
            
            # Calculate days left
            days_left = None
            if poll.end_date:
                days_left = (poll.end_date - today).days
            
            # Get first question text for display
            first_question_text = poll.questions[0].question if poll.questions else None
            
            active_polls_list.append({
                "id": poll_id_str,
                "title": poll.title,
                "question": first_question_text,
                "status": poll.status,
                "totalResponses": unique_voters,
                "totalMembers": total_members,
                "participation": participation,
                "daysLeft": days_left,
                "userVote": user_vote
            })
        
        # Recent resources (latest 3-5 approved resources)
        recent_resources = self.db.query(Resource).filter(
            Resource.status == "approved"
        ).order_by(Resource.created_at.desc()).limit(5).all()
        
        recent_resources_list = []
        for resource in recent_resources:
            recent_resources_list.append({
                "id": str(resource.id),
                "title": resource.title,
                "type": resource.type,
                "category": resource.category,
                "createdAt": resource.created_at.isoformat() if resource.created_at else None
            })
        
        # Theme window status
        from app.services.theme_service import ThemeService
        theme_service = ThemeService(self.db)
        window_status = theme_service.get_window_status()
        
        theme_window = {
            "isOpen": window_status.isOpen,
            "closesAt": window_status.endDate if window_status.isOpen else None,
            "daysUntilClose": window_status.daysRemaining if window_status.isOpen else None
        }
        
        result = {
            "stats": {
                "activeMembers": active_members,
                "sessionsCompleted": completed_sessions,
                "newResources": new_resources,
                "participationRate": participation_rate
            },
            "upcomingSessions": upcoming_sessions_list,
            "activePolls": active_polls_list,
            "recentResources": recent_resources_list,
            "themeWindow": theme_window
        }
        
        # Cache the result
        dashboard_cache.set(cache_key, result)
        return result
    
    def get_admin_dashboard(self) -> Dict:
        """
        Get admin dashboard data.
        
        Returns:
            Dictionary with stats and recent data
        """
        # Check cache
        cache_key = "admin_dashboard"
        cached_data = dashboard_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        today = now.date()
        
        # Stats
        pending_themes = self.db.query(Theme).filter(
            Theme.status == "pending"
        ).count()
        
        pending_resources = self.db.query(Resource).filter(
            Resource.status == "pending"
        ).count()
        
        # Recent feedbacks - compare dates to avoid timezone issues
        recent_feedbacks = self.db.query(Feedback).filter(
            func.date(Feedback.submitted_at) >= seven_days_ago.date()
        ).count()
        
        total_members = self.db.query(User).count()  # All users (members + admins)
        
        # Pending themes (top 3-5)
        pending_themes_list = self.db.query(Theme).filter(
            Theme.status == "pending"
        ).order_by(Theme.submitted_at.desc()).limit(5).all()
        
        # Batch query all users for themes to avoid N+1
        theme_user_ids = [t.submitted_by for t in pending_themes_list if t.submitted_by]
        theme_users = {}
        if theme_user_ids:
            theme_users_query = self.db.query(User).filter(User.id.in_(theme_user_ids)).all()
            theme_users = {str(u.id): u for u in theme_users_query}
        
        pending_themes_data = []
        for theme in pending_themes_list:
            proposed_by = None
            if theme.submitted_by:
                user = theme_users.get(str(theme.submitted_by))
                if user:
                    proposed_by = {
                        "id": str(user.id),
                        "name": f"{user.first_name} {user.last_name}",
                        "avatar": user.avatar_url
                    }
            
            days_ago = None
            if theme.submitted_at:
                days_ago = (today - theme.submitted_at.date()).days
            
            pending_themes_data.append({
                "id": str(theme.id),
                "title": theme.title,
                "proposedBy": proposed_by,
                "createdAt": theme.submitted_at.isoformat() if theme.submitted_at else None,
                "daysAgo": days_ago
            })
        
        # Active polls - optimize to avoid calling get_poll_by_id for each poll
        active_polls = self.db.query(Poll).filter(
            Poll.status == "active"
        ).order_by(Poll.created_at.desc()).all()
        
        # Batch calculate unique voters for all polls
        poll_ids = [p.id for p in active_polls]
        voter_counts = {}
        if poll_ids:
            voter_counts_data = self.db.query(
                PollVote.poll_id,
                func.count(func.distinct(PollVote.user_id)).label('voter_count')
            ).filter(
                PollVote.poll_id.in_(poll_ids)
            ).group_by(PollVote.poll_id).all()
            
            voter_counts = {str(poll_id): count for poll_id, count in voter_counts_data}
        
        # Calculate total members once
        total_members = self.db.query(User).filter(User.status == "active").count()
        
        active_polls_data = []
        for poll in active_polls:
            poll_id_str = str(poll.id)
            
            # Get unique voters count from batch query
            unique_voters = voter_counts.get(poll_id_str, 0)
            
            # Calculate participation
            participation = None
            if total_members > 0 and unique_voters > 0:
                participation = float((unique_voters / total_members) * 100)
            
            # Calculate days left
            days_left = None
            if poll.end_date:
                days_left = (poll.end_date - today).days
            
            active_polls_data.append({
                "id": poll_id_str,
                "title": poll.title,
                "totalResponses": unique_voters,
                "totalMembers": total_members,
                "participation": participation,
                "daysLeft": days_left
            })
        
        # Pending resources (top 3-5)
        pending_resources_list = self.db.query(Resource).filter(
            Resource.status == "pending"
        ).order_by(Resource.created_at.desc()).limit(5).all()
        
        # Batch query all users for resources to avoid N+1
        resource_user_ids = [r.created_by for r in pending_resources_list if r.created_by]
        resource_users = {}
        if resource_user_ids:
            resource_users_query = self.db.query(User).filter(User.id.in_(resource_user_ids)).all()
            resource_users = {str(u.id): u for u in resource_users_query}
        
        pending_resources_data = []
        for resource in pending_resources_list:
            submitted_by = None
            if resource.created_by:
                user = resource_users.get(str(resource.created_by))
                if user:
                    submitted_by = {
                        "id": str(user.id),
                        "name": f"{user.first_name} {user.last_name}"
                    }
            
            days_ago = None
            if resource.created_at:
                days_ago = (today - resource.created_at.date()).days
            
            pending_resources_data.append({
                "id": str(resource.id),
                "title": resource.title,
                "type": resource.type,
                "submittedBy": submitted_by,
                "createdAt": resource.created_at.isoformat() if resource.created_at else None,
                "daysAgo": days_ago
            })
        
        # Recent feedbacks (latest 3-5)
        recent_feedbacks_list = self.db.query(Feedback).filter(
            func.date(Feedback.submitted_at) >= seven_days_ago.date()
        ).order_by(Feedback.submitted_at.desc()).limit(5).all()
        
        # Batch query all users for feedbacks to avoid N+1
        feedback_user_ids = [f.submitted_by for f in recent_feedbacks_list if f.submitted_by and not f.anonymous]
        feedback_users = {}
        if feedback_user_ids:
            feedback_users_query = self.db.query(User).filter(User.id.in_(feedback_user_ids)).all()
            feedback_users = {str(u.id): u for u in feedback_users_query}
        
        recent_feedbacks_data = []
        for feedback in recent_feedbacks_list:
            submitted_by = None
            if feedback.submitted_by and not feedback.anonymous:
                user = feedback_users.get(str(feedback.submitted_by))
                if user:
                    submitted_by = {
                        "id": str(user.id),
                        "name": f"{user.first_name} {user.last_name}",
                        "avatar": user.avatar_url
                    }
            
            # Calculate time ago
            time_ago = None
            if feedback.submitted_at:
                # Ensure both datetimes are timezone-aware
                submitted_at = feedback.submitted_at
                if submitted_at.tzinfo is None:
                    # If naive, assume it's UTC
                    submitted_at = submitted_at.replace(tzinfo=timezone.utc)
                
                delta = now - submitted_at
                if delta.days > 0:
                    time_ago = f"Il y a {delta.days}j"
                elif delta.seconds >= 3600:
                    hours = delta.seconds // 3600
                    time_ago = f"Il y a {hours}h"
                elif delta.seconds >= 60:
                    minutes = delta.seconds // 60
                    time_ago = f"Il y a {minutes}min"
                else:
                    time_ago = "À l'instant"
            
            recent_feedbacks_data.append({
                "id": str(feedback.id),
                "subject": feedback.subject,
                "message": feedback.message,
                "category": feedback.category,
                "submittedBy": submitted_by,
                "submittedAt": feedback.submitted_at.isoformat() if feedback.submitted_at else None,
                "status": feedback.status,
                "timeAgo": time_ago
            })
        
        # Upcoming sessions (next 2-3)
        upcoming_sessions = self.db.query(Session).filter(
            Session.status == "upcoming"
        ).order_by(Session.date.asc(), Session.start_time.asc()).limit(3).all()
        
        upcoming_sessions_data = []
        for session in upcoming_sessions:
            upcoming_sessions_data.append({
                "id": str(session.id),
                "title": session.title,
                "date": session.date.isoformat() if session.date else None,
                "registered": session.registered,
                "maxParticipants": session.max_participants,
                "status": session.status
            })
        
        result = {
            "stats": {
                "pendingThemes": pending_themes,
                "pendingResources": pending_resources,
                "recentFeedbacks": recent_feedbacks,
                "totalMembers": total_members
            },
            "pendingThemes": pending_themes_data,
            "activePolls": active_polls_data,
            "pendingResources": pending_resources_data,
            "recentFeedbacks": recent_feedbacks_data,
            "upcomingSessions": upcoming_sessions_data
        }
        
        # Cache the result
        dashboard_cache.set(cache_key, result)
        return result

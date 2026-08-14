from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from datetime import datetime, date, timezone
from app.services.email_service import ResendEmailService

from app.models.poll import Poll, PollQuestion, PollOption, PollVote
from app.models.user import User
from app.models.session import SessionRegistration, Session
from app.schemas.poll import (
    CreatePollRequest,
    UpdatePollRequest,
    PollResponse,
    PollDetailResponse,
    PollQuestionResponse,
    PollOptionResponse,
    VoteRequest,
    VoteResponse,
    SingleVoteRequest,
    SingleVoteResponse
)
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache, dashboard_cache


class PollService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all poll-related caches"""
        list_cache.invalidate_pattern("polls_list")
        dashboard_cache.invalidate_pattern("member_dashboard")
        dashboard_cache.invalidate_pattern("admin_dashboard")
    
    def get_polls(
        self,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        user_id: Optional[str] = None
    ) -> PaginatedResponse[PollResponse]:
        """Get all polls with filtering and pagination"""
        # Check if user is a guest or member - they have restricted visibility
        from app.models.user import User
        from app.models.session import SessionRegistration
        
        is_guest = False
        is_member = False
        user_session_ids = []
        
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user:
                if user.role == "guest":
                    is_guest = True
                elif user.role == "member":
                    is_member = True
                
                # Get all sessions the user is registered for (for both guests and members)
                if is_guest or is_member:
                    registrations = self.db.query(SessionRegistration).filter(
                        SessionRegistration.user_id == user_id
                    ).all()
                    user_session_ids = [str(reg.session_id) for reg in registrations]
        
        # Check cache
        cache_key = f"polls_list_status:{status or 'all'}_page:{page}_limit:{limit}_user:{user_id or ''}_guest:{is_guest}_member:{is_member}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Poll)
        
        # For guests, only show polls from their sessions
        if is_guest:
            if user_session_ids:
                query = query.filter(Poll.session_id.in_(user_session_ids))
            else:
                # Guest has no sessions, return empty result
                return PaginatedResponse(
                    data=[],
                    total=0,
                    page=page,
                    limit=limit,
                    totalPages=0
                )
        
        # For members, show polls that are either:
        # 1. Not related to any session (session_id IS NULL), OR
        # 2. Related to a session they are registered for
        if is_member:
            if user_session_ids:
                # Show polls with no session OR polls from registered sessions
                query = query.filter(
                    or_(
                        Poll.session_id.is_(None),
                        Poll.session_id.in_(user_session_ids)
                    )
                )
            else:
                # Member has no registered sessions, only show polls with no session
                query = query.filter(Poll.session_id.is_(None))
        
        if status and status != "all":
            query = query.filter(Poll.status == status)
        
        total = query.count()
        offset = (page - 1) * limit
        
        # Eager load questions and options to avoid N+1 queries
        from sqlalchemy.orm import joinedload
        polls = query.options(
            joinedload(Poll.questions).joinedload(PollQuestion.options)
        ).order_by(Poll.created_at.desc()).offset(offset).limit(limit).all()
        
        # Calculate total_members once (used for all polls)
        total_members = self.db.query(User).filter(User.status == "active").count()
        
        # Batch calculate unique_voters for all polls at once
        poll_ids = [p.id for p in polls]
        voter_counts = {}
        if poll_ids:
            voter_counts_data = self.db.query(
                PollVote.poll_id,
                func.count(func.distinct(PollVote.user_id)).label('voter_count')
            ).filter(
                PollVote.poll_id.in_(poll_ids)
            ).group_by(PollVote.poll_id).all()
            
            voter_counts = {str(poll_id): count for poll_id, count in voter_counts_data}
        
        # Batch query all user votes for all polls to avoid N+1
        user_votes_by_poll = {}
        if user_id and poll_ids:
            from uuid import UUID as UUIDType
            user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
            
            all_user_votes = self.db.query(PollVote).options(
                joinedload(PollVote.option)
            ).filter(
                and_(
                    PollVote.poll_id.in_(poll_ids),
                    PollVote.user_id == user_uuid
                )
            ).order_by(PollVote.voted_at).all()
            
            # Group votes by poll_id and question_id
            for vote in all_user_votes:
                poll_id_str = str(vote.poll_id)
                question_id_str = str(vote.question_id)
                if poll_id_str not in user_votes_by_poll:
                    user_votes_by_poll[poll_id_str] = {}
                if question_id_str not in user_votes_by_poll[poll_id_str]:
                    user_votes_by_poll[poll_id_str][question_id_str] = []
                user_votes_by_poll[poll_id_str][question_id_str].append(vote)
        
        # Build poll responses with pre-calculated data
        poll_responses = []
        today = date.today()
        for poll in polls:
            poll_id_str = str(poll.id)
            
            # Get unique voters count from batch query
            unique_voters = voter_counts.get(poll_id_str, 0)
            
            # Calculate participation
            participation = None
            if total_members > 0 and unique_voters > 0:
                participation = float((unique_voters / total_members) * 100)
            
            # Get user votes for this poll
            poll_user_votes = user_votes_by_poll.get(poll_id_str, {})
            
            # Build questions with options and user votes
            questions = []
            if poll.questions:
                # Check if poll is closed or over
                is_closed = poll.status == "completed"
                is_over = poll.end_date is not None and poll.end_date < today
                
                # Show results based on visibility
                show_results = (
                    poll.results_visibility == "realtime" or 
                    is_closed or 
                    is_over
                )
                
                for question in sorted(poll.questions, key=lambda x: x.order_index):
                    # Get options (already eager loaded)
                    options = [
                        PollOptionResponse(
                            id=str(opt.id),
                            label=opt.label,
                            votes=opt.votes if show_results else 0,
                            percentage=float(opt.percentage) if (show_results and opt.percentage) else 0.0,
                            color=opt.color,
                            orderIndex=opt.order_index
                        )
                        for opt in sorted(question.options, key=lambda x: x.order_index)
                    ]
                    
                    # Get user's vote(s) for this question
                    user_vote_for_question = None
                    if user_id:
                        question_id_str = str(question.id)
                        votes = poll_user_votes.get(question_id_str, [])
                        
                        if votes:
                            if question.single_response:
                                vote = votes[0]
                                option = vote.option
                                if option:
                                    user_vote_for_question = {
                                        "optionId": str(option.id),
                                        "optionLabel": option.label,
                                        "votedAt": vote.voted_at.isoformat() if vote.voted_at else None
                                    }
                            else:
                                user_vote_for_question = []
                                for vote in votes:
                                    option = vote.option
                                    if option:
                                        user_vote_for_question.append({
                                            "optionId": str(option.id),
                                            "optionLabel": option.label,
                                            "votedAt": vote.voted_at.isoformat() if vote.voted_at else None
                                        })
                    
                    questions.append(
                        PollQuestionResponse(
                            id=str(question.id),
                            question=question.question,
                            description=question.description,
                            singleResponse=question.single_response,
                            orderIndex=question.order_index,
                            options=options,
                            userVote=user_vote_for_question
                        )
                    )
            
            # Calculate days left
            days_left = None
            if poll.end_date:
                days_left = (poll.end_date - today).days
            
            poll_responses.append(
                PollResponse(
                    id=poll_id_str,
                    title=poll.title,
                    description=poll.description,
                    status=poll.status,
                    totalResponses=unique_voters,
                    totalMembers=total_members,
                    participation=participation,
                    resultsVisibility=poll.results_visibility,
                    anonymous=poll.anonymous,
                    startDate=poll.start_date.isoformat() if poll.start_date else None,
                    endDate=poll.end_date.isoformat() if poll.end_date else None,
                    daysLeft=days_left,
                    questions=questions,
                    createdAt=poll.created_at.isoformat() if poll.created_at else None,
                    updatedAt=poll.updated_at.isoformat() if poll.updated_at else None
                )
            )
        
        result = PaginatedResponse(
            data=poll_responses,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        # Cache the result
        list_cache.set(cache_key, result)
        return result
    
    def get_poll_by_id(self, poll_id: str, user_id: Optional[str] = None) -> Optional[PollResponse]:
        """Get poll by ID with options, votes, and voters"""
        poll = self.db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return None
        
        # Check if user is a guest - guests can only access polls from their sessions
        from app.models.user import User
        from app.models.session import SessionRegistration
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user and user.role == "guest":
                # Check if poll is from a session the guest is registered for
                if poll.session_id:
                    registration = self.db.query(SessionRegistration).filter(
                        and_(
                            SessionRegistration.session_id == poll.session_id,
                            SessionRegistration.user_id == user_id
                        )
                    ).first()
                    if not registration:
                        return None  # Guest not registered for this poll's session
        
        return self._poll_to_dict(poll, include_details=True, include_voters=True, user_id=user_id)
    
    def create_poll(self, data: CreatePollRequest) -> PollResponse:
        """Create a new poll with multiple questions and their options"""
        poll = Poll(
            title=data.title,
            description=data.description,
            results_visibility=data.resultsVisibility,
            anonymous=data.anonymous,
            start_date=data.startDate,
            end_date=data.endDate,
            session_id=data.sessionId,
            status="active"
        )
        self.db.add(poll)
        self.db.flush()  # Get poll ID
        
        # Create questions with their options
        colors = ["primary", "accent", "secondary", "success"]
        for question_idx, question_data in enumerate(data.questions):
            question = PollQuestion(
                poll_id=poll.id,
                question=question_data.question,
                description=question_data.description,
                single_response=question_data.singleResponse,
                order_index=question_idx
            )
            self.db.add(question)
            self.db.flush()  # Get question ID
            
            # Create options for this question
            for option_idx, option_data in enumerate(question_data.options):
                option = PollOption(
                    question_id=question.id,
                    label=option_data.label,
                    color=option_data.color or colors[option_idx % len(colors)],
                    order_index=option_idx
                )
                self.db.add(option)
        
        self.db.commit()
        self.db.refresh(poll)
        
        # Invalidate caches
        self._invalidate_cache()
        
        # Send email notifications to all active members
        from app.models.user import User
        email_service = ResendEmailService()
        active_users = self.db.query(User).filter(
            User.status == "active",
            User.role != "guest"
        ).all()
        
        end_date_str = None
        if poll.end_date:
            end_date_str = poll.end_date.strftime("%d/%m/%Y")
        
        # Use first question for email notification
        first_question_text = data.questions[0].question if data.questions else "Nouveau sondage"
        
        for user in active_users:
            email_service.send_poll_created_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                poll_title=poll.title,
                poll_question=first_question_text,
                end_date=end_date_str
            )
        
        return self._poll_to_dict(poll, include_details=True)
    
    def update_poll(
        self,
        poll_id: str,
        data: UpdatePollRequest
    ) -> Optional[PollResponse]:
        """Update poll"""
        poll = self.db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return None
        
        if data.title is not None:
            poll.title = data.title
        if data.description is not None:
            poll.description = data.description
        if data.status is not None:
            poll.status = data.status
        if data.resultsVisibility is not None:
            poll.results_visibility = data.resultsVisibility
        if data.endDate is not None:
            poll.end_date = data.endDate
        
        poll.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(poll)
        self._invalidate_cache()
        
        return self._poll_to_dict(poll, include_details=True)
    
    def _vote_on_question(
        self,
        poll_id: str,
        vote_data: SingleVoteRequest,
        user_id: str,
        poll: Poll
    ) -> Optional[SingleVoteResponse]:
        """
        Helper method to vote on a single question.
        Returns SingleVoteResponse or None if validation fails.
        """
        # Validate question belongs to poll
        question = self.db.query(PollQuestion).filter(
            and_(
                PollQuestion.id == vote_data.questionId,
                PollQuestion.poll_id == poll_id
            )
        ).first()
        
        if not question:
            return None  # Question doesn't belong to poll
        
        # Determine which option IDs to process
        if vote_data.optionIds:
            option_ids = vote_data.optionIds
        elif vote_data.optionId:
            option_ids = [vote_data.optionId]
        else:
            return None  # No option provided
        
        # Validate all options belong to the question
        options = self.db.query(PollOption).filter(
            and_(
                PollOption.id.in_(option_ids),
                PollOption.question_id == vote_data.questionId
            )
        ).all()
        
        if len(options) != len(option_ids):
            return None  # Some options are invalid
        
        # For single_response questions, only allow one option per question
        if question.single_response:
            if len(option_ids) > 1:
                return None  # Multiple options not allowed for single response questions
            option_id = option_ids[0]
            
            # Check if user already voted on this question
            existing_vote = self.db.query(PollVote).filter(
                and_(
                    PollVote.question_id == vote_data.questionId,
                    PollVote.user_id == user_id
                )
            ).first()
            
            if existing_vote:
                # Update existing vote
                old_option_id = existing_vote.option_id
                if old_option_id != option_id:
                    existing_vote.option_id = option_id
                    existing_vote.voted_at = datetime.now(timezone.utc)
                    
                    # Update old option votes
                    old_option = self.db.query(PollOption).filter(
                        PollOption.id == old_option_id
                    ).first()
                    if old_option:
                        old_option.votes = max(0, old_option.votes - 1)
                    
                    # Update new option votes
                    option = self.db.query(PollOption).filter(PollOption.id == option_id).first()
                    if option:
                        option.votes += 1
            else:
                # Create new vote
                vote = PollVote(
                    poll_id=poll_id,
                    question_id=vote_data.questionId,
                    option_id=option_id,
                    user_id=user_id
                )
                self.db.add(vote)
                
                # Update option votes
                option = self.db.query(PollOption).filter(PollOption.id == option_id).first()
                if option:
                    option.votes += 1
        else:
            # Multiple responses allowed - replace all existing votes for this question with new set
            # Get existing votes for this user and question
            existing_votes = self.db.query(PollVote).filter(
                and_(
                    PollVote.question_id == vote_data.questionId,
                    PollVote.user_id == user_id
                )
            ).all()
            
            # Convert to sets of UUID strings for comparison
            existing_option_ids = {str(v.option_id) for v in existing_votes}
            new_option_ids = {str(oid) for oid in option_ids}
            
            # Remove votes for options that are no longer selected
            for vote in existing_votes:
                vote_option_id_str = str(vote.option_id)
                if vote_option_id_str not in new_option_ids:
                    # Decrement vote count for this option
                    old_option = self.db.query(PollOption).filter(
                        PollOption.id == vote.option_id
                    ).first()
                    if old_option:
                        old_option.votes = max(0, old_option.votes - 1)
                    self.db.delete(vote)
            
            # Add votes for new options and update timestamps for existing ones
            for option_id in option_ids:
                option_id_str = str(option_id)
                
                if option_id_str not in existing_option_ids:
                    # New vote - check if it already exists (race condition check)
                    existing_vote = self.db.query(PollVote).filter(
                        and_(
                            PollVote.question_id == vote_data.questionId,
                            PollVote.user_id == user_id,
                            PollVote.option_id == option_id
                        )
                    ).first()
                    
                    if not existing_vote:
                        vote = PollVote(
                            poll_id=poll_id,
                            question_id=vote_data.questionId,
                            option_id=option_id,
                            user_id=user_id
                        )
                        self.db.add(vote)
                        
                        # Update option votes
                        option = self.db.query(PollOption).filter(PollOption.id == option_id).first()
                        if option:
                            option.votes += 1
                else:
                    # Option already voted - just update timestamp (user is revoting)
                    existing_vote = self.db.query(PollVote).filter(
                        and_(
                            PollVote.question_id == vote_data.questionId,
                            PollVote.user_id == user_id,
                            PollVote.option_id == option_id
                        )
                    ).first()
                    if existing_vote:
                        existing_vote.voted_at = datetime.now(timezone.utc)
        
        # Recalculate percentages for all options in this question (based on total votes for the question)
        question_total_votes = sum(opt.votes for opt in question.options)
        if question_total_votes > 0:
            for opt in question.options:
                opt.percentage = (opt.votes / question_total_votes) * 100
        
        # Return response
        if question.single_response:
            return SingleVoteResponse(
                questionId=str(vote_data.questionId),
                optionId=option_ids[0] if option_ids else None
            )
        else:
            return SingleVoteResponse(
                questionId=str(vote_data.questionId),
                optionIds=option_ids
            )
    
    def vote_on_poll(
        self,
        poll_id: str,
        data: VoteRequest,
        user_id: str
    ) -> Optional[VoteResponse]:
        """
        Vote on multiple poll questions at once.
        
        Business Logic:
        - Check if poll is active
        - Process each vote in the votes array
        - Validate all questions belong to poll
        - For each question, validate and process votes
        - Update option votes and percentages
        - Update poll statistics
        """
        poll = self.db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return None
        
        # Check if poll is active
        today = date.today()
        if poll.status != "active" or poll.start_date > today:
            return None
        if poll.end_date and poll.end_date < today:
            poll.status = "completed"
            self.db.commit()
            self._invalidate_cache()
            return None
        
        # First, validate all votes before processing any
        # This ensures we don't commit partial votes if any validation fails
        from app.models.poll import PollQuestion, PollOption
        for vote_data in data.votes:
            # Validate question belongs to poll
            question = self.db.query(PollQuestion).filter(
                and_(
                    PollQuestion.id == vote_data.questionId,
                    PollQuestion.poll_id == poll_id
                )
            ).first()
            
            if not question:
                return None  # Question doesn't belong to poll
            
            # Determine which option IDs to process
            if vote_data.optionIds:
                option_ids = vote_data.optionIds
            elif vote_data.optionId:
                option_ids = [vote_data.optionId]
            else:
                return None  # No option provided
            
            # Validate all options belong to the question
            options = self.db.query(PollOption).filter(
                and_(
                    PollOption.id.in_(option_ids),
                    PollOption.question_id == vote_data.questionId
                )
            ).all()
            
            if len(options) != len(option_ids):
                return None  # Some options are invalid
            
            # For single_response questions, only allow one option per question
            if question.single_response:
                if len(option_ids) > 1:
                    return None  # Multiple options not allowed for single response questions
        
        # All votes are valid, now process them
        vote_responses = []
        for vote_data in data.votes:
            vote_response = self._vote_on_question(poll_id, vote_data, user_id, poll)
            if vote_response:
                vote_responses.append(vote_response)
        
        # If no votes were successfully processed, or not all votes succeeded, rollback
        if not vote_responses or len(vote_responses) != len(data.votes):
            # Rollback any partial changes
            self.db.rollback()
            return None
        
        # Calculate total_responses as number of unique voters across all questions in the poll
        unique_voters = self.db.query(func.count(func.distinct(PollVote.user_id))).filter(
            PollVote.poll_id == poll_id
        ).scalar() or 0
        poll.total_responses = unique_voters
        
        # Update participation based on unique voters
        # totalMembers is always total active users
        total_members = self.db.query(User).filter(User.status == "active").count()
        
        if total_members > 0 and unique_voters > 0:
            poll.participation = (unique_voters / total_members) * 100
        else:
            poll.participation = None
        
        # Update days left
        if poll.end_date:
            poll.days_left = (poll.end_date - today).days
        
        poll.updated_at = datetime.now(timezone.utc)
        
        try:
            self.db.commit()
            self._invalidate_cache()
        except IntegrityError:
            # Race condition: another request already created/modified votes
            # Rollback and retry
            self.db.rollback()
            # For now, return None - could implement retry logic here
            return None
        
        # Return response
        return VoteResponse(
            message="Votes enregistrés avec succès",
            pollId=str(poll_id),
            votes=vote_responses
        )
    
    def close_poll(self, poll_id: str) -> Optional[PollResponse]:
        """Close a poll by setting status to completed"""
        poll = self.db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return None
        
        poll.status = "completed"
        poll.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(poll)
        self._invalidate_cache()
        
        return self._poll_to_dict(poll, include_details=True)
    
    def delete_poll(self, poll_id: str) -> bool:
        """Delete poll"""
        poll = self.db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            return False
        
        self.db.delete(poll)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    def send_poll_reminders(
        self,
        poll_id: str,
        session_only: bool = False
    ) -> dict:
        """
        Send reminder emails to members who haven't voted on a poll.
        
        Args:
            poll_id: Poll ID
            session_only: If True and poll is linked to a session, only notify registered users
        
        Returns:
            dict with counts of emails sent
        """
        poll = self.db.query(Poll).filter(Poll.id == poll_id).first()
        if not poll:
            raise ValueError("Poll not found")
        
        if poll.status != "active":
            raise ValueError("Can only send reminders for active polls")
        
        # Get users who have voted
        from sqlalchemy import and_, not_, distinct
        from app.models.user import User
        from app.models.session import SessionRegistration
        
        voted_votes = self.db.query(PollVote.user_id).filter(
            PollVote.poll_id == poll_id
        ).distinct().all()
        voted_user_ids = {str(v[0]) for v in voted_votes}
        
        # Determine target users
        if session_only and poll.session_id:
            # Only notify users registered for the session who haven't voted
            registrations = self.db.query(SessionRegistration).filter(
                SessionRegistration.session_id == poll.session_id
            ).all()
            registered_user_ids = {str(reg.user_id) for reg in registrations}
            target_user_ids = registered_user_ids - voted_user_ids
            
            if not target_user_ids:
                target_users = []
            else:
                target_users = self.db.query(User).filter(
                    and_(
                        User.id.in_(list(target_user_ids)),
                        User.status == "active",
                        User.role != "guest"
                    )
                ).all()
        else:
            # Notify all active users who haven't voted
            if voted_user_ids:
                target_users = self.db.query(User).filter(
                    and_(
                        User.status == "active",
                        User.role != "guest",
                        ~User.id.in_(list(voted_user_ids))
                    )
                ).all()
            else:
                # No one has voted yet, notify all active users
                target_users = self.db.query(User).filter(
                    and_(
                        User.status == "active",
                        User.role != "guest"
                    )
                ).all()
        
        # Send reminder emails
        email_service = ResendEmailService()
        
        end_date_str = None
        if poll.end_date:
            end_date_str = poll.end_date.strftime("%d/%m/%Y")
        
        emails_sent = 0
        emails_failed = 0
        
        # Use first question for email notification
        first_question_text = poll.questions[0].question if poll.questions else "Nouveau sondage"
        
        for user in target_users:
            success = email_service.send_poll_reminder_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                poll_title=poll.title,
                poll_question=first_question_text,
                end_date=end_date_str
            )
            if success:
                emails_sent += 1
            else:
                emails_failed += 1
        
        return {
            "emailsSent": emails_sent,
            "emailsFailed": emails_failed,
            "totalTargeted": len(target_users)
        }
    
    def _poll_to_dict(self, poll: Poll, include_details: bool = False, include_voters: bool = False, user_id: Optional[str] = None, respect_results_visibility: bool = False) -> PollResponse:
        """Convert Poll model to PollResponse
        
        Args:
            respect_results_visibility: If True, hide vote counts/percentages when results_visibility is "hidden".
                                       Only used for list endpoint. Detail endpoint always shows results.
                                       Results are always shown if poll is closed (status="completed") or over (endDate passed).
        """
        questions = None
        if include_details:
            # Check if poll is closed or over
            today = date.today()
            is_closed = poll.status == "completed"
            is_over = poll.end_date is not None and poll.end_date < today
            
            # Show results if:
            # 1. Not respecting visibility (detail endpoint)
            # 2. Visibility is "realtime"
            # 3. Poll is closed or over (always show results for closed/over polls)
            show_results = (
                not respect_results_visibility or 
                poll.results_visibility == "realtime" or 
                is_closed or 
                is_over
            )
            
            # Batch query all user votes for all questions in this poll to avoid N+1
            user_votes_by_question = {}
            if user_id:
                from uuid import UUID as UUIDType
                user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
                question_ids = [q.id for q in poll.questions]
                
                if question_ids:
                    # Eager load options to avoid additional queries
                    from sqlalchemy.orm import joinedload
                    all_user_votes = self.db.query(PollVote).options(
                        joinedload(PollVote.option)
                    ).filter(
                        and_(
                            PollVote.poll_id == poll.id,
                            PollVote.user_id == user_uuid,
                            PollVote.question_id.in_(question_ids)
                        )
                    ).order_by(PollVote.voted_at).all()
                    
                    # Group votes by question_id
                    for vote in all_user_votes:
                        question_id_str = str(vote.question_id)
                        if question_id_str not in user_votes_by_question:
                            user_votes_by_question[question_id_str] = []
                        user_votes_by_question[question_id_str].append(vote)
            
            # Build questions with their options
            questions = []
            for question in sorted(poll.questions, key=lambda x: x.order_index):
                # Get options for this question
                options = [
                    PollOptionResponse(
                        id=str(opt.id),
                        label=opt.label,
                        votes=opt.votes if show_results else 0,
                        percentage=float(opt.percentage) if (show_results and opt.percentage) else 0.0,
                        color=opt.color,
                        orderIndex=opt.order_index
                    )
                    for opt in sorted(question.options, key=lambda x: x.order_index)
                ]
                
                # Get user's vote(s) for this question if user_id is provided
                user_vote_for_question = None
                if user_id:
                    question_id_str = str(question.id)
                    votes = user_votes_by_question.get(question_id_str, [])
                    
                    if votes:
                        if question.single_response:
                            # Single response: return single vote object
                            vote = votes[0]
                            # Use eager-loaded option (no additional query)
                            option = vote.option
                            if option:
                                user_vote_for_question = {
                                    "optionId": str(option.id),
                                    "optionLabel": option.label,
                                    "votedAt": vote.voted_at.isoformat() if vote.voted_at else None
                                }
                        else:
                            # Multiple response: return list of votes
                            user_vote_for_question = []
                            for vote in votes:
                                # Use eager-loaded option (no additional query)
                                option = vote.option
                                if option:
                                    user_vote_for_question.append({
                                        "optionId": str(option.id),
                                        "optionLabel": option.label,
                                        "votedAt": vote.voted_at.isoformat() if vote.voted_at else None
                                    })
                
                questions.append(
                    PollQuestionResponse(
                        id=str(question.id),
                        question=question.question,
                        description=question.description,
                        singleResponse=question.single_response,
                        orderIndex=question.order_index,
                        options=options,
                        userVote=user_vote_for_question
                    )
                )
        
        # Calculate totalMembers - always total active users
        total_members = self.db.query(User).filter(User.status == "active").count()
        
        # Calculate total_responses as number of unique voters (not total votes)
        unique_voters = self.db.query(func.count(func.distinct(PollVote.user_id))).filter(
            PollVote.poll_id == poll.id
        ).scalar() or 0
        
        # Calculate participation based on unique voters
        participation = None
        if total_members > 0 and unique_voters > 0:
            participation = (unique_voters / total_members) * 100
        
        # Get voters if requested - group by voter and show questions answered
        voters = None
        if include_voters:
            # Eager load votes with user, question, and option to avoid N+1 queries
            from sqlalchemy.orm import joinedload
            all_votes = self.db.query(PollVote).options(
                joinedload(PollVote.user),
                joinedload(PollVote.question),
                joinedload(PollVote.option)
            ).filter(
                PollVote.poll_id == poll.id
            ).order_by(PollVote.voted_at).all()
            
            # Group votes by user_id
            voters_dict = {}
            for vote in all_votes:
                # Access eager-loaded relationships (no additional queries)
                user = vote.user
                question = vote.question
                option = vote.option
                
                if user and question and option:
                    user_id_str = str(user.id)
                    
                    # Initialize voter if not seen before
                    if user_id_str not in voters_dict:
                        voters_dict[user_id_str] = {
                            "id": user_id_str,
                            "firstName": user.first_name,
                            "lastName": user.last_name,
                            "name": f"{user.first_name} {user.last_name}",
                            "avatar": user.avatar_url,
                            "questions": {}  # Dictionary to group by question_id
                        }
                    
                    # Initialize question in voter's questions if not seen
                    question_id_str = str(question.id)
                    if question_id_str not in voters_dict[user_id_str]["questions"]:
                        voters_dict[user_id_str]["questions"][question_id_str] = {
                            "questionId": question_id_str,
                            "question": question.question,
                            "options": []
                        }
                    
                    # Add option to question's options list
                    voters_dict[user_id_str]["questions"][question_id_str]["options"].append({
                        "optionId": str(option.id),
                        "optionLabel": option.label,
                        "votedAt": vote.voted_at.isoformat() if vote.voted_at else None
                    })
            
            # Convert to list format: array of voters, each with array of questions
            voters_list = []
            for voter_data in voters_dict.values():
                # Convert questions dict to list
                questions_list = list(voter_data["questions"].values())
                voters_list.append({
                    "id": voter_data["id"],
                    "firstName": voter_data["firstName"],
                    "lastName": voter_data["lastName"],
                    "name": voter_data["name"],
                    "avatar": voter_data["avatar"],
                    "questions": questions_list
                })
            
            voters = voters_list
        
        # Use PollDetailResponse if voters are included
        if include_voters:
            result = PollDetailResponse(
                id=str(poll.id),
                title=poll.title,
                description=poll.description,
                status=poll.status,
                totalResponses=unique_voters,  # Number of unique voters, not total votes
                totalMembers=total_members,
                participation=float(participation) if participation is not None else None,
                resultsVisibility=poll.results_visibility,
                anonymous=poll.anonymous,
                startDate=poll.start_date.isoformat() if poll.start_date else None,
                endDate=poll.end_date.isoformat() if poll.end_date else None,
                daysLeft=poll.days_left,
                questions=questions,
                voters=voters,
                createdAt=poll.created_at.isoformat() if poll.created_at else None,
                updatedAt=poll.updated_at.isoformat() if poll.updated_at else None
            )
        else:
            result = PollResponse(
                id=str(poll.id),
                title=poll.title,
                description=poll.description,
                status=poll.status,
                totalResponses=unique_voters,  # Number of unique voters, not total votes
                totalMembers=total_members,
                participation=float(participation) if participation is not None else None,
                resultsVisibility=poll.results_visibility,
                anonymous=poll.anonymous,
                startDate=poll.start_date.isoformat() if poll.start_date else None,
                endDate=poll.end_date.isoformat() if poll.end_date else None,
                daysLeft=poll.days_left,
                questions=questions,
                createdAt=poll.created_at.isoformat() if poll.created_at else None,
                updatedAt=poll.updated_at.isoformat() if poll.updated_at else None
            )
        
        return result


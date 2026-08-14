from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime

from app.models.feedback import Feedback
from app.schemas.feedback import CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackResponse
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache, dashboard_cache
from app.services.email_service import ResendEmailService


class FeedbackService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all feedback-related caches"""
        list_cache.invalidate_pattern("feedbacks_list")
        dashboard_cache.invalidate_pattern("admin_dashboard")
    
    def get_feedbacks(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse[FeedbackResponse]:
        """Get all feedbacks with filtering and pagination"""
        # Check cache
        cache_key = f"feedbacks_list_status:{status or 'all'}_category:{category or 'all'}_page:{page}_limit:{limit}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Feedback)
        
        if status and status != "all":
            query = query.filter(Feedback.status == status)
        
        if category and category != "all":
            query = query.filter(Feedback.category == category)
        
        total = query.count()
        offset = (page - 1) * limit
        feedbacks = query.order_by(Feedback.submitted_at.desc()).offset(offset).limit(limit).all()
        
        return PaginatedResponse(
            data=[self._feedback_to_dict(f) for f in feedbacks],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
    
    def get_user_feedbacks(
        self,
        user_id: str,
        status: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse[FeedbackResponse]:
        """Get feedbacks submitted by a specific user"""
        query = self.db.query(Feedback).filter(Feedback.submitted_by == user_id)
        
        if status and status != "all":
            query = query.filter(Feedback.status == status)
        
        if category and category != "all":
            query = query.filter(Feedback.category == category)
        
        total = query.count()
        offset = (page - 1) * limit
        feedbacks = query.order_by(Feedback.submitted_at.desc()).offset(offset).limit(limit).all()
        
        return PaginatedResponse(
            data=[self._feedback_to_dict(f) for f in feedbacks],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
    
    def get_feedback_by_id(self, feedback_id: str) -> Optional[FeedbackResponse]:
        """Get feedback by ID"""
        feedback = self.db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            return None
        return self._feedback_to_dict(feedback)
    
    def create_feedback(
        self,
        data: CreateFeedbackRequest,
        user_id: Optional[str] = None
    ) -> FeedbackResponse:
        """Create a new feedback"""
        feedback = Feedback(
            category=data.category,
            type=data.type,
            subject=data.subject,
            message=data.message,
            anonymous=data.anonymous,
            rating=data.rating,
            session_id=data.sessionId,
            submitted_by=user_id if not data.anonymous else None
        )
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        self._invalidate_cache()

        # Notify all active admins about the new feedback
        from app.models.user import User

        email_service = ResendEmailService()

        active_admins = self.db.query(User).filter(
            User.status == "active",
            User.role.in_(["admin", "super_admin"])
        ).all()

        for admin in active_admins:
            full_name = f"{admin.first_name} {admin.last_name}".strip() or admin.email
            email_service.send_feedback_created_email(
                to_email=admin.email,
                to_name=full_name,
                subject_line=feedback.subject,
                category=feedback.category,
                feedback_type=feedback.type,
                rating=feedback.rating,
            )

        return self._feedback_to_dict(feedback)
    
    def update_feedback_status(
        self,
        feedback_id: str,
        data: UpdateFeedbackRequest
    ) -> Optional[FeedbackResponse]:
        """Update feedback status"""
        feedback = self.db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            return None
        
        feedback.status = data.status
        feedback.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(feedback)
        self._invalidate_cache()
        return self._feedback_to_dict(feedback)
    
    def delete_feedback(self, feedback_id: str) -> bool:
        """Delete feedback"""
        feedback = self.db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            return False
        
        self.db.delete(feedback)
        self.db.commit()
        return True
    
    def _feedback_to_dict(self, feedback: Feedback) -> FeedbackResponse:
        """Convert Feedback model to FeedbackResponse"""
        return FeedbackResponse(
            id=str(feedback.id),
            category=feedback.category,
            type=feedback.type,
            subject=feedback.subject,
            message=feedback.message,
            anonymous=feedback.anonymous,
            rating=feedback.rating,
            sessionId=str(feedback.session_id) if feedback.session_id else None,
            submittedBy=str(feedback.submitted_by) if feedback.submitted_by else None,
            submittedAt=feedback.submitted_at.isoformat() if feedback.submitted_at else None,
            status=feedback.status,
            createdAt=feedback.created_at.isoformat() if feedback.created_at else None,
            updatedAt=feedback.updated_at.isoformat() if feedback.updated_at else None
        )


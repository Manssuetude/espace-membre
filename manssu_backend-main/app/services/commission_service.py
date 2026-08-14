from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List, Tuple
from datetime import datetime
from uuid import UUID

from app.models.commission import Commission, CommissionMember, CommissionApplication
from app.models.user import User
from app.schemas.commission import (
    CreateCommissionRequest,
    UpdateCommissionRequest,
    CommissionSummaryResponse,
    CommissionDetailResponse,
    CommissionMemberResponse,
    CreateApplicationRequest,
    ApplicationResponse,
    MyApplicationResponse,
    MyCommissionResponse,
    CommissionUserSummary,
)
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache


class CommissionService:
    def __init__(self, db: Session):
        self.db = db
    
    def _invalidate_cache(self):
        """Invalidate all commission-related caches"""
        list_cache.invalidate_pattern("commissions_list")
        list_cache.invalidate_pattern("commission_detail")
    
    # ============ Commission CRUD (Super Admin) ============
    
    def get_commissions(
        self,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        current_user_id: Optional[str] = None
    ) -> PaginatedResponse[CommissionSummaryResponse]:
        """Get all commissions with filtering and pagination"""
        cache_key = f"commissions_list_status:{status or 'all'}_page:{page}_limit:{limit}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data
        
        query = self.db.query(Commission).options(
            joinedload(Commission.leader),
            joinedload(Commission.members),
            joinedload(Commission.applications)
        )
        
        if status and status != "all":
            query = query.filter(Commission.status == status)
        
        total = self.db.query(Commission).filter(
            Commission.status == status if status and status != "all" else True
        ).count()
        
        offset = (page - 1) * limit
        commissions = query.order_by(Commission.created_at.desc()).offset(offset).limit(limit).all()
        
        result = PaginatedResponse(
            data=[self._commission_to_summary(c) for c in commissions],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
        
        list_cache.set(cache_key, result)
        return result
    
    def get_commission_by_id(
        self,
        commission_id: str,
        current_user_id: Optional[str] = None,
        include_applications: bool = False
    ) -> Optional[CommissionDetailResponse]:
        """Get commission by ID with full details"""
        commission = self.db.query(Commission).options(
            joinedload(Commission.leader),
            joinedload(Commission.members).joinedload(CommissionMember.user),
            joinedload(Commission.applications).joinedload(CommissionApplication.user),
            joinedload(Commission.applications).joinedload(CommissionApplication.reviewed_by)
        ).filter(Commission.id == commission_id).first()
        
        if not commission:
            return None
        
        return self._commission_to_detail(
            commission, 
            current_user_id=current_user_id,
            include_applications=include_applications
        )
    
    def create_commission(self, data: CreateCommissionRequest) -> CommissionDetailResponse:
        """Create a new commission (super admin only)"""
        commission = Commission(
            name=data.name,
            description=data.description,
            max_members=data.maxMembers,
            status="active"
        )
        self.db.add(commission)
        self.db.commit()
        self.db.refresh(commission)
        self._invalidate_cache()
        return self._commission_to_detail(commission)
    
    def update_commission(
        self,
        commission_id: str,
        data: UpdateCommissionRequest,
        current_user_id: str
    ) -> Tuple[Optional[CommissionDetailResponse], Optional[str]]:
        """
        Update commission details (super admin or leader).
        Returns (result, error_message).
        """
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        # Check authorization: current user must be super_admin or leader
        current_user = self.db.query(User).filter(User.id == current_user_id).first()
        is_super_admin = current_user and current_user.role == "super_admin"
        is_leader = str(commission.leader_id) == current_user_id if commission.leader_id else False
        
        if not is_super_admin and not is_leader:
            return None, "Not authorized to update this commission"
        
        # Only super_admin can change status
        if data.status is not None and not is_super_admin:
            return None, "Only super admins can change commission status"
        
        if data.name is not None:
            # Check uniqueness
            existing = self.db.query(Commission).filter(
                Commission.name == data.name,
                Commission.id != commission_id
            ).first()
            if existing:
                return None, "A commission with this name already exists"
            commission.name = data.name
        
        if data.description is not None:
            commission.description = data.description
        
        if data.maxMembers is not None:
            commission.max_members = data.maxMembers
        
        if data.status is not None:
            commission.status = data.status
        
        commission.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(commission)
        self._invalidate_cache()
        
        return self._commission_to_detail(commission, current_user_id=current_user_id), None
    
    def delete_commission(self, commission_id: str) -> bool:
        """Delete a commission (super admin only)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return False
        
        self.db.delete(commission)
        self.db.commit()
        self._invalidate_cache()
        return True
    
    # ============ Leader Management (Super Admin) ============
    
    def assign_leader(
        self,
        commission_id: str,
        user_id: str
    ) -> Tuple[Optional[CommissionDetailResponse], Optional[str]]:
        """Assign a leader to a commission (super admin only)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None, "User not found"
        
        if user.status != "active":
            return None, "Cannot assign an inactive user as leader"
        
        if user.role == "guest":
            return None, "Guests cannot be commission leaders"
        
        commission.leader_id = UUID(user_id)
        commission.updated_at = datetime.utcnow()
        
        # If leader is not already a member, add them
        existing_member = self.db.query(CommissionMember).filter(
            CommissionMember.commission_id == commission_id,
            CommissionMember.user_id == user_id
        ).first()
        
        if not existing_member:
            member = CommissionMember(
                commission_id=UUID(commission_id),
                user_id=UUID(user_id)
            )
            self.db.add(member)
        
        self.db.commit()
        self.db.refresh(commission)
        self._invalidate_cache()
        
        return self._commission_to_detail(commission), None
    
    def remove_leader(self, commission_id: str) -> Tuple[Optional[CommissionDetailResponse], Optional[str]]:
        """Remove the leader from a commission (super admin only)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        commission.leader_id = None
        commission.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(commission)
        self._invalidate_cache()
        
        return self._commission_to_detail(commission), None
    
    # ============ Application Management ============
    
    def apply_to_commission(
        self,
        commission_id: str,
        user_id: str,
        data: CreateApplicationRequest
    ) -> Tuple[Optional[ApplicationResponse], Optional[str]]:
        """Apply to join a commission"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        if commission.status != "active":
            return None, "This commission is not accepting applications"
        
        # Check if user is already a member
        existing_member = self.db.query(CommissionMember).filter(
            CommissionMember.commission_id == commission_id,
            CommissionMember.user_id == user_id
        ).first()
        if existing_member:
            return None, "You are already a member of this commission"
        
        # Check for pending application
        existing_application = self.db.query(CommissionApplication).filter(
            CommissionApplication.commission_id == commission_id,
            CommissionApplication.user_id == user_id,
            CommissionApplication.status == "pending"
        ).first()
        if existing_application:
            return None, "You already have a pending application for this commission"
        
        # Check guest restriction
        user = self.db.query(User).filter(User.id == user_id).first()
        if user and user.role == "guest":
            return None, "Guests cannot apply to commissions"
        
        application = CommissionApplication(
            commission_id=UUID(commission_id),
            user_id=UUID(user_id),
            reason=data.reason,
            status="pending"
        )
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        self._invalidate_cache()
        
        # Load user for response
        application = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.user)
        ).filter(CommissionApplication.id == application.id).first()
        
        # Send email notification to leader and super admins
        self._notify_application_created(commission, user)
        
        return self._application_to_response(application), None
    
    def withdraw_application(self, commission_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
        """Withdraw a pending application"""
        application = self.db.query(CommissionApplication).filter(
            CommissionApplication.commission_id == commission_id,
            CommissionApplication.user_id == user_id,
            CommissionApplication.status == "pending"
        ).first()
        
        if not application:
            return False, "No pending application found"
        
        self.db.delete(application)
        self.db.commit()
        self._invalidate_cache()
        return True, None
    
    def get_applications(
        self,
        commission_id: str,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> Tuple[Optional[PaginatedResponse[ApplicationResponse]], Optional[str]]:
        """Get applications for a commission (super admin or leader)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        query = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.user),
            joinedload(CommissionApplication.reviewed_by)
        ).filter(CommissionApplication.commission_id == commission_id)
        
        if status and status != "all":
            query = query.filter(CommissionApplication.status == status)
        
        total = self.db.query(CommissionApplication).filter(
            CommissionApplication.commission_id == commission_id,
            CommissionApplication.status == status if status and status != "all" else True
        ).count()
        
        offset = (page - 1) * limit
        applications = query.order_by(CommissionApplication.created_at.desc()).offset(offset).limit(limit).all()
        
        return PaginatedResponse(
            data=[self._application_to_response(a) for a in applications],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        ), None
    
    def approve_application(
        self,
        commission_id: str,
        application_id: str,
        reviewer_id: str
    ) -> Tuple[Optional[ApplicationResponse], Optional[str]]:
        """Approve an application (super admin or leader)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        application = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.user)
        ).filter(
            CommissionApplication.id == application_id,
            CommissionApplication.commission_id == commission_id
        ).first()
        
        if not application:
            return None, "Application not found"
        
        if application.status != "pending":
            return None, "This application has already been processed"
        
        # Check max members
        if commission.max_members:
            current_count = self.db.query(CommissionMember).filter(
                CommissionMember.commission_id == commission_id
            ).count()
            if current_count >= commission.max_members:
                return None, "Commission has reached maximum member capacity"
        
        # Approve and add member
        application.status = "approved"
        application.reviewed_at = datetime.utcnow()
        application.reviewed_by_id = UUID(reviewer_id)
        
        member = CommissionMember(
            commission_id=UUID(commission_id),
            user_id=application.user_id
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(application)
        self._invalidate_cache()
        
        # Send approval email to applicant
        self._notify_application_approved(application.user, commission)
        
        # Reload with reviewer
        application = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.user),
            joinedload(CommissionApplication.reviewed_by)
        ).filter(CommissionApplication.id == application_id).first()
        
        return self._application_to_response(application), None
    
    def reject_application(
        self,
        commission_id: str,
        application_id: str,
        reviewer_id: str,
        rejection_reason: Optional[str] = None
    ) -> Tuple[Optional[ApplicationResponse], Optional[str]]:
        """Reject an application (super admin or leader)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        application = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.user)
        ).filter(
            CommissionApplication.id == application_id,
            CommissionApplication.commission_id == commission_id
        ).first()
        
        if not application:
            return None, "Application not found"
        
        if application.status != "pending":
            return None, "This application has already been processed"
        
        application.status = "rejected"
        application.reviewed_at = datetime.utcnow()
        application.reviewed_by_id = UUID(reviewer_id)
        application.rejection_reason = rejection_reason
        
        self.db.commit()
        self.db.refresh(application)
        self._invalidate_cache()
        
        # Send rejection email to applicant
        self._notify_application_rejected(application.user, commission, rejection_reason)
        
        # Reload with reviewer
        application = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.user),
            joinedload(CommissionApplication.reviewed_by)
        ).filter(CommissionApplication.id == application_id).first()
        
        return self._application_to_response(application), None
    
    # ============ Member Management ============
    
    def add_member(
        self,
        commission_id: str,
        user_id: str
    ) -> Tuple[Optional[CommissionMemberResponse], Optional[str]]:
        """Add a member directly to a commission (super admin or leader)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return None, "Commission not found"
        
        if commission.status != "active":
            return None, "Cannot add members to an archived commission"
        
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None, "User not found"
        
        if user.status != "active":
            return None, "Cannot add an inactive user"
        
        if user.role == "guest":
            return None, "Guests cannot be commission members"
        
        # Check if already a member
        existing_member = self.db.query(CommissionMember).filter(
            CommissionMember.commission_id == commission_id,
            CommissionMember.user_id == user_id
        ).first()
        if existing_member:
            return None, "User is already a member of this commission"
        
        # Check max members
        if commission.max_members:
            current_count = self.db.query(CommissionMember).filter(
                CommissionMember.commission_id == commission_id
            ).count()
            if current_count >= commission.max_members:
                return None, "Commission has reached maximum member capacity"
        
        # Add member
        member = CommissionMember(
            commission_id=UUID(commission_id),
            user_id=UUID(user_id)
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        self._invalidate_cache()
        
        # Reload with user
        member = self.db.query(CommissionMember).options(
            joinedload(CommissionMember.user)
        ).filter(CommissionMember.id == member.id).first()
        
        return self._member_to_response(member), None
    
    def remove_member(
        self,
        commission_id: str,
        user_id: str,
        remover_id: str
    ) -> Tuple[bool, Optional[str]]:
        """Remove a member from a commission (super admin or leader)"""
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if not commission:
            return False, "Commission not found"
        
        # Cannot remove the leader via this endpoint
        if commission.leader_id and str(commission.leader_id) == user_id:
            return False, "Cannot remove the commission leader. Use the remove leader endpoint instead."
        
        member = self.db.query(CommissionMember).filter(
            CommissionMember.commission_id == commission_id,
            CommissionMember.user_id == user_id
        ).first()
        
        if not member:
            return False, "User is not a member of this commission"
        
        self.db.delete(member)
        self.db.commit()
        self._invalidate_cache()
        return True, None
    
    # ============ User-facing endpoints ============
    
    def get_my_commissions(self, user_id: str) -> List[MyCommissionResponse]:
        """Get commissions the user is a member of"""
        memberships = self.db.query(CommissionMember).options(
            joinedload(CommissionMember.commission).joinedload(Commission.members)
        ).filter(CommissionMember.user_id == user_id).all()
        
        result = []
        for membership in memberships:
            commission = membership.commission
            result.append(MyCommissionResponse(
                id=str(commission.id),
                name=commission.name,
                description=commission.description,
                status=commission.status,
                isLeader=str(commission.leader_id) == user_id if commission.leader_id else False,
                memberCount=len(commission.members),
                joinedAt=membership.joined_at.isoformat() if membership.joined_at else datetime.utcnow().isoformat()
            ))
        
        return result
    
    def get_my_applications(self, user_id: str) -> List[MyApplicationResponse]:
        """Get user's commission applications"""
        applications = self.db.query(CommissionApplication).options(
            joinedload(CommissionApplication.commission)
        ).filter(CommissionApplication.user_id == user_id).order_by(
            CommissionApplication.created_at.desc()
        ).all()
        
        return [
            MyApplicationResponse(
                id=str(a.id),
                commissionId=str(a.commission_id),
                commissionName=a.commission.name if a.commission else "Unknown",
                reason=a.reason,
                status=a.status,
                createdAt=a.created_at.isoformat() if a.created_at else datetime.utcnow().isoformat(),
                reviewedAt=a.reviewed_at.isoformat() if a.reviewed_at else None,
                rejectionReason=a.rejection_reason
            )
            for a in applications
        ]
    
    # ============ Authorization Helpers ============
    
    def is_leader_or_super_admin(self, commission_id: str, user_id: str) -> bool:
        """Check if user is the commission leader or a super admin"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if user and user.role == "super_admin":
            return True
        
        commission = self.db.query(Commission).filter(Commission.id == commission_id).first()
        if commission and commission.leader_id and str(commission.leader_id) == user_id:
            return True
        
        return False
    
    # ============ Response Builders ============
    
    def _user_to_summary(self, user: User) -> CommissionUserSummary:
        """Convert User model to CommissionUserSummary"""
        return CommissionUserSummary(
            id=str(user.id),
            firstName=user.first_name,
            lastName=user.last_name,
            email=user.email,
            avatarUrl=user.avatar_url
        )
    
    def _member_to_response(self, member: CommissionMember) -> CommissionMemberResponse:
        """Convert CommissionMember to response"""
        return CommissionMemberResponse(
            id=str(member.id),
            user=self._user_to_summary(member.user),
            joinedAt=member.joined_at.isoformat() if member.joined_at else datetime.utcnow().isoformat()
        )
    
    def _application_to_response(self, application: CommissionApplication) -> ApplicationResponse:
        """Convert CommissionApplication to response"""
        return ApplicationResponse(
            id=str(application.id),
            user=self._user_to_summary(application.user),
            reason=application.reason,
            status=application.status,
            createdAt=application.created_at.isoformat() if application.created_at else datetime.utcnow().isoformat(),
            reviewedAt=application.reviewed_at.isoformat() if application.reviewed_at else None,
            reviewedBy=self._user_to_summary(application.reviewed_by) if application.reviewed_by else None,
            rejectionReason=application.rejection_reason
        )
    
    def _commission_to_summary(self, commission: Commission) -> CommissionSummaryResponse:
        """Convert Commission to summary response"""
        pending_count = len([a for a in commission.applications if a.status == "pending"]) if commission.applications else 0
        
        return CommissionSummaryResponse(
            id=str(commission.id),
            name=commission.name,
            description=commission.description,
            status=commission.status,
            maxMembers=commission.max_members,
            memberCount=len(commission.members) if commission.members else 0,
            pendingApplicationsCount=pending_count,
            leader=self._user_to_summary(commission.leader) if commission.leader else None,
            createdAt=commission.created_at.isoformat() if commission.created_at else datetime.utcnow().isoformat(),
            updatedAt=commission.updated_at.isoformat() if commission.updated_at else datetime.utcnow().isoformat()
        )
    
    def _commission_to_detail(
        self,
        commission: Commission,
        current_user_id: Optional[str] = None,
        include_applications: bool = False
    ) -> CommissionDetailResponse:
        """Convert Commission to detail response"""
        pending_count = len([a for a in commission.applications if a.status == "pending"]) if commission.applications else 0
        
        # Check user context
        is_member = False
        is_leader = False
        my_pending_app = None
        
        if current_user_id:
            is_leader = str(commission.leader_id) == current_user_id if commission.leader_id else False
            is_member = any(str(m.user_id) == current_user_id for m in commission.members) if commission.members else False
            
            if commission.applications:
                for app in commission.applications:
                    if str(app.user_id) == current_user_id and app.status == "pending":
                        my_pending_app = self._application_to_response(app)
                        break
        
        # Build members list
        members = [self._member_to_response(m) for m in commission.members] if commission.members else []
        
        # Only include applications for authorized users
        applications = None
        if include_applications and commission.applications:
            applications = [self._application_to_response(a) for a in commission.applications if a.status == "pending"]
        
        return CommissionDetailResponse(
            id=str(commission.id),
            name=commission.name,
            description=commission.description,
            status=commission.status,
            maxMembers=commission.max_members,
            memberCount=len(members),
            pendingApplicationsCount=pending_count,
            leader=self._user_to_summary(commission.leader) if commission.leader else None,
            createdAt=commission.created_at.isoformat() if commission.created_at else datetime.utcnow().isoformat(),
            updatedAt=commission.updated_at.isoformat() if commission.updated_at else datetime.utcnow().isoformat(),
            members=members,
            applications=applications,
            isMember=is_member,
            isLeader=is_leader,
            myPendingApplication=my_pending_app
        )
    
    # ============ Email Notifications ============
    
    def _notify_application_created(self, commission: Commission, applicant: User):
        """Send email notification when a new application is created"""
        from app.services.email_service import SMTPEmailService
        
        email_service = SMTPEmailService()
        applicant_name = f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email
        commission_id = str(commission.id)
        
        # Notify commission leader (if exists)
        if commission.leader:
            leader = commission.leader
            leader_name = f"{leader.first_name} {leader.last_name}".strip() or leader.email
            email_service.send_commission_application_created_email(
                to_email=leader.email,
                to_name=leader_name,
                applicant_name=applicant_name,
                commission_name=commission.name,
                commission_id=commission_id
            )
        
        # Notify all super admins
        super_admins = self.db.query(User).filter(
            User.status == "active",
            User.role == "super_admin"
        ).all()
        
        for admin in super_admins:
            # Skip if admin is already the leader (already notified)
            if commission.leader_id and str(commission.leader_id) == str(admin.id):
                continue
            admin_name = f"{admin.first_name} {admin.last_name}".strip() or admin.email
            email_service.send_commission_application_created_email(
                to_email=admin.email,
                to_name=admin_name,
                applicant_name=applicant_name,
                commission_name=commission.name,
                commission_id=commission_id
            )
    
    def _notify_application_approved(self, applicant: User, commission: Commission):
        """Send email notification when an application is approved"""
        from app.services.email_service import SMTPEmailService
        
        email_service = SMTPEmailService()
        applicant_name = f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email
        
        email_service.send_commission_application_approved_email(
            to_email=applicant.email,
            to_name=applicant_name,
            commission_name=commission.name,
            commission_id=str(commission.id)
        )
    
    def _notify_application_rejected(self, applicant: User, commission: Commission, rejection_reason: Optional[str] = None):
        """Send email notification when an application is rejected"""
        from app.services.email_service import SMTPEmailService
        
        email_service = SMTPEmailService()
        applicant_name = f"{applicant.first_name} {applicant.last_name}".strip() or applicant.email
        
        email_service.send_commission_application_rejected_email(
            to_email=applicant.email,
            to_name=applicant_name,
            commission_name=commission.name,
            rejection_reason=rejection_reason
        )


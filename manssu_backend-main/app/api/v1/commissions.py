from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_super_admin
from app.schemas.common import APIResponse
from app.schemas.commission import (
    CreateCommissionRequest,
    UpdateCommissionRequest,
    AssignLeaderRequest,
    AddMemberRequest,
    CreateApplicationRequest,
    RejectApplicationRequest,
)
from app.services.commission_service import CommissionService


router = APIRouter()


# ============ Static Routes (must come before dynamic routes) ============


@router.get("", response_model=APIResponse)
async def list_commissions(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: active, archived"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    List all commissions.
    """
    service = CommissionService(db)
    result = service.get_commissions(
        status=status_filter, page=page, limit=limit, current_user_id=str(current_user.id)
    )
    return APIResponse(success=True, data=result.model_dump())


@router.post("", response_model=APIResponse)
async def create_commission(
    data: CreateCommissionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_super_admin),
):
    """
    Create a new commission (super admin only).
    """
    service = CommissionService(db)
    commission = service.create_commission(data)
    return APIResponse(
        success=True,
        data=commission.model_dump(by_alias=True),
        message="Commission créée avec succès",
    )


# ============ /me Routes (must come before /{commission_id} routes) ============


@router.get("/me", response_model=APIResponse)
async def get_my_commissions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get commissions the current user is a member of.
    """
    service = CommissionService(db)
    result = service.get_my_commissions(str(current_user.id))
    return APIResponse(success=True, data=[c.model_dump(by_alias=True) for c in result])


@router.get("/me/applications", response_model=APIResponse)
async def get_my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get the current user's commission applications.
    """
    service = CommissionService(db)
    result = service.get_my_applications(str(current_user.id))
    return APIResponse(success=True, data=[a.model_dump(by_alias=True) for a in result])


# ============ Dynamic Routes with {commission_id} ============


@router.get("/{commission_id}", response_model=APIResponse)
async def get_commission(
    commission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get commission details.
    Applications are only included for super admins and commission leaders.
    """
    service = CommissionService(db)
    include_applications = service.is_leader_or_super_admin(
        commission_id, str(current_user.id)
    )
    result = service.get_commission_by_id(
        commission_id,
        current_user_id=str(current_user.id),
        include_applications=include_applications,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Commission not found"
        )
    return APIResponse(success=True, data=result.model_dump(by_alias=True))


@router.patch("/{commission_id}", response_model=APIResponse)
async def update_commission(
    commission_id: str,
    data: UpdateCommissionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Update commission details (super admin or commission leader).
    """
    service = CommissionService(db)
    result, error = service.update_commission(commission_id, data, str(current_user.id))
    if error:
        if error == "Commission not found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        if error == "Not authorized to update this commission":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Commission mise à jour avec succès",
    )


@router.delete("/{commission_id}", response_model=APIResponse)
async def delete_commission(
    commission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_super_admin),
):
    """
    Delete a commission (super admin only).
    """
    service = CommissionService(db)
    success = service.delete_commission(commission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Commission not found"
        )
    return APIResponse(success=True, message="Commission supprimée avec succès")


# ============ Leader Management ============


@router.put("/{commission_id}/leader", response_model=APIResponse)
async def assign_leader(
    commission_id: str,
    data: AssignLeaderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_super_admin),
):
    """
    Assign a leader to a commission (super admin only).
    """
    service = CommissionService(db)
    result, error = service.assign_leader(commission_id, data.userId)
    if error:
        if error == "Commission not found" or error == "User not found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Leader assigné avec succès",
    )


@router.delete("/{commission_id}/leader", response_model=APIResponse)
async def remove_leader(
    commission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_super_admin),
):
    """
    Remove the leader from a commission (super admin only).
    """
    service = CommissionService(db)
    result, error = service.remove_leader(commission_id)
    if error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Leader retiré avec succès",
    )


# ============ Application Management ============


@router.get("/{commission_id}/applications", response_model=APIResponse)
async def get_commission_applications(
    commission_id: str,
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: pending, approved, rejected"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get applications for a commission (super admin or commission leader).
    """
    service = CommissionService(db)
    
    # Check authorization
    if not service.is_leader_or_super_admin(commission_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view applications for this commission"
        )
    
    result, error = service.get_applications(
        commission_id, status=status_filter, page=page, limit=limit
    )
    if error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
    return APIResponse(success=True, data=result.model_dump())


@router.post("/{commission_id}/applications/{application_id}/approve", response_model=APIResponse)
async def approve_application(
    commission_id: str,
    application_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Approve an application (super admin or commission leader).
    """
    service = CommissionService(db)
    
    # Check authorization
    if not service.is_leader_or_super_admin(commission_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to approve applications for this commission"
        )
    
    result, error = service.approve_application(
        commission_id, application_id, str(current_user.id)
    )
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Candidature approuvée avec succès",
    )


@router.post("/{commission_id}/applications/{application_id}/reject", response_model=APIResponse)
async def reject_application(
    commission_id: str,
    application_id: str,
    data: Optional[RejectApplicationRequest] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Reject an application (super admin or commission leader).
    """
    service = CommissionService(db)
    
    # Check authorization
    if not service.is_leader_or_super_admin(commission_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to reject applications for this commission"
        )
    
    rejection_reason = data.reason if data else None
    result, error = service.reject_application(
        commission_id, application_id, str(current_user.id), rejection_reason
    )
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Candidature rejetée",
    )


# ============ Apply to Commission ============


@router.post("/{commission_id}/apply", response_model=APIResponse)
async def apply_to_commission(
    commission_id: str,
    data: CreateApplicationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Apply to join a commission.
    """
    service = CommissionService(db)
    result, error = service.apply_to_commission(
        commission_id, str(current_user.id), data
    )
    if error:
        if error == "Commission not found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Candidature soumise avec succès",
    )


@router.delete("/{commission_id}/apply", response_model=APIResponse)
async def withdraw_application(
    commission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Withdraw a pending application.
    """
    service = CommissionService(db)
    success, error = service.withdraw_application(commission_id, str(current_user.id))
    if error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
    return APIResponse(success=True, message="Candidature retirée avec succès")


# ============ Member Management ============


@router.post("/{commission_id}/members", response_model=APIResponse)
async def add_member(
    commission_id: str,
    data: AddMemberRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Add a member directly to a commission (super admin or commission leader).
    Bypasses the application workflow.
    """
    service = CommissionService(db)
    
    # Check authorization
    if not service.is_leader_or_super_admin(commission_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add members to this commission"
        )
    
    result, error = service.add_member(commission_id, data.userId)
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(
        success=True,
        data=result.model_dump(by_alias=True),
        message="Membre ajouté avec succès",
    )


@router.delete("/{commission_id}/members/{user_id}", response_model=APIResponse)
async def remove_member(
    commission_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Remove a member from a commission (super admin or commission leader).
    """
    service = CommissionService(db)
    
    # Check authorization
    if not service.is_leader_or_super_admin(commission_id, str(current_user.id)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove members from this commission"
        )
    
    success, error = service.remove_member(commission_id, user_id, str(current_user.id))
    if error:
        if "not found" in error.lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=error)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return APIResponse(success=True, message="Membre retiré avec succès")

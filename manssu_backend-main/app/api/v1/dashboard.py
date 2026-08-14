from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.common import APIResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/admin", response_model=APIResponse)
async def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Get admin dashboard data (Admin only).
    """
    service = DashboardService(db)
    dashboard_data = service.get_admin_dashboard()
    
    return APIResponse(
        success=True,
        data=dashboard_data
    )


@router.get("/member", response_model=APIResponse)
async def get_member_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get member dashboard data.
    """
    service = DashboardService(db)
    dashboard_data = service.get_member_dashboard(str(current_user.id))
    
    return APIResponse(
        success=True,
        data=dashboard_data
    )


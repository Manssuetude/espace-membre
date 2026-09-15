# PERMANENT ROUTER — see app/models/user_award.py. Not part of the temporary Awards feature.
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.common import APIResponse
from app.services.user_award_service import UserAwardService

router = APIRouter()


@router.get("/me", response_model=APIResponse)
async def get_my_award_wins(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Awards the current user has won, to display on their own profile."""
    service = UserAwardService(db)
    wins = service.get_wins_for_user(str(current_user.id))
    return APIResponse(success=True, data=[w.model_dump() for w in wins])


@router.get("/user/{user_id}", response_model=APIResponse)
async def get_user_award_wins(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Awards a given member has won, to display on their profile (viewed by another member/admin)."""
    service = UserAwardService(db)
    wins = service.get_wins_for_user(user_id)
    return APIResponse(success=True, data=[w.model_dump() for w in wins])


@router.get("/commission/{commission_id}", response_model=APIResponse)
async def get_commission_award_wins(
    commission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Collective prizes a commission has won, to display on its page."""
    service = UserAwardService(db)
    wins = service.get_wins_for_commission(commission_id)
    return APIResponse(success=True, data=[w.model_dump() for w in wins])

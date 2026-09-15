from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin, get_current_super_admin
from app.core.config import settings
from app.core.exceptions import ForbiddenException
from app.schemas.award import (
    NominateRequest,
    BuildShortlistRequest,
    VoteRequest,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    UpdateAwardSettingsRequest,
)
from app.schemas.common import APIResponse
from app.services.award_service import AwardService

router = APIRouter()

# Members entrusted with building the shortlist for the Awards, in addition to super_admin.
# Hardcoded on purpose: this is a one-off allowlist for a temporary feature, not a platform role.
AWARD_CURATOR_EMAILS = {
    "emmanuellengassa@gmail.com",
    "naomidjomague@gmail.com",
    "inesndjana@gmail.com",
    "rachidnassourou@gmail.com",
}


def get_award_curator(current_user=Depends(get_current_user)):
    """Allows super_admin, plus the hardcoded 'vie asso' curators, to run the nomination-closing/shortlist steps."""
    if current_user.role == "super_admin" or (current_user.email or "").lower() in AWARD_CURATOR_EMAILS:
        return current_user
    raise ForbiddenException("Accès réservé à l'équipe de curation des Awards")


@router.get("/categories", response_model=APIResponse)
async def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List award categories with their computed phase, the current user's own nomination/vote, and the shortlist once curated.
    Categories still awaiting the scheduled nomination window are hidden from regular members."""
    is_admin = current_user.role in ["admin", "super_admin"]
    is_privileged = is_admin or (current_user.email or "").lower() in AWARD_CURATOR_EMAILS
    service = AwardService(db)
    categories = service.get_categories(user_id=str(current_user.id), is_admin=is_admin, include_hidden=is_privileged)
    return APIResponse(success=True, data=[c.model_dump() for c in categories])


@router.get("/categories/{category_id}", response_model=APIResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    is_admin = current_user.role in ["admin", "super_admin"]
    is_privileged = is_admin or (current_user.email or "").lower() in AWARD_CURATOR_EMAILS
    service = AwardService(db)
    category = service.get_category(category_id, user_id=str(current_user.id), is_admin=is_admin, include_hidden=is_privileged)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catégorie introuvable")
    return APIResponse(success=True, data=category.model_dump())


@router.post("/categories", response_model=APIResponse)
async def create_category(
    data: CreateCategoryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Create a new award category (Admin only)."""
    service = AwardService(db)
    category = service.create_category(data)
    return APIResponse(success=True, data=category.model_dump(), message="Catégorie créée avec succès")


@router.patch("/categories/{category_id}", response_model=APIResponse)
async def update_category(
    category_id: str,
    data: UpdateCategoryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Update a category's name/description/icon/target type (Admin only)."""
    service = AwardService(db)
    category = service.update_category(category_id, data)
    return APIResponse(success=True, data=category.model_dump(), message="Catégorie mise à jour")


@router.post("/categories/{category_id}/nominations", response_model=APIResponse)
async def nominate(
    category_id: str,
    data: NominateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Propose (or replace) your candidate for a category, while nominations are open."""
    service = AwardService(db)
    category = service.nominate(category_id, data, str(current_user.id))
    return APIResponse(success=True, data=category.model_dump(), message="Proposition enregistrée")


@router.delete("/categories/{category_id}/nominations/{nominee_id}", response_model=APIResponse)
async def remove_nomination(
    category_id: str,
    nominee_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Withdraw one of your own proposals for a category, while nominations are open."""
    service = AwardService(db)
    category = service.remove_nomination(category_id, nominee_id, str(current_user.id))
    return APIResponse(success=True, data=category.model_dump(), message="Proposition retirée")


@router.get("/categories/{category_id}/nomination-stats", response_model=APIResponse)
async def get_nomination_stats(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_curator),
):
    """Aggregated nominees for a category with proposal counts, to help build the shortlist (super admin + vie asso curators)."""
    service = AwardService(db)
    stats = service.get_nomination_stats(category_id)
    return APIResponse(success=True, data=[s.model_dump() for s in stats])


@router.post("/close-all-nominations", response_model=APIResponse)
async def close_all_nominations(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_curator),
):
    """Close the nomination phase for every category still open, in one go (super admin + vie asso curators)."""
    service = AwardService(db)
    result = service.close_all_nominations()
    return APIResponse(success=True, data=result, message=f"{result['closedCount']} catégorie(s) clôturée(s)")


@router.post("/categories/{category_id}/close-nominations", response_model=APIResponse)
async def close_nominations(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_curator),
):
    """Close the nomination phase for a category (super admin + vie asso curators)."""
    service = AwardService(db)
    category = service.close_nominations(category_id)
    return APIResponse(success=True, data=category.model_dump(), message="Nominations clôturées")


@router.post("/reopen-all-nominations", response_model=APIResponse)
async def reopen_all_nominations(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_curator),
):
    """Reopen the nomination phase for every closed category that has no shortlist yet (super admin + vie asso curators)."""
    service = AwardService(db)
    result = service.reopen_all_nominations()
    return APIResponse(success=True, data=result, message=f"{result['reopenedCount']} catégorie(s) rouverte(s)")


@router.post("/categories/{category_id}/reopen-nominations", response_model=APIResponse)
async def reopen_nominations(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_curator),
):
    """Reopen the nomination phase for a category, only allowed before a shortlist exists (super admin + vie asso curators)."""
    service = AwardService(db)
    category = service.reopen_nominations(category_id)
    return APIResponse(success=True, data=category.model_dump(), message="Nominations rouvertes")


@router.post("/categories/{category_id}/shortlist", response_model=APIResponse)
async def build_shortlist(
    category_id: str,
    data: BuildShortlistRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_curator),
):
    """Finalize the shortlist of candidates for a category from the nomination stats (super admin + vie asso curators)."""
    service = AwardService(db)
    category = service.build_shortlist(category_id, data)
    return APIResponse(success=True, data=category.model_dump(), message="Liste finale validée")


@router.post("/categories/{category_id}/vote", response_model=APIResponse)
async def vote(
    category_id: str,
    data: VoteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Cast a vote for a candidate in a category, once voting is open."""
    service = AwardService(db)
    category = service.vote(category_id, data, str(current_user.id))
    return APIResponse(success=True, data=category.model_dump(), message="Vote enregistré")


@router.post("/categories/{category_id}/publish-results", response_model=APIResponse)
async def publish_results(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Publish results for a single category, once voting is closed (Admin only). Does not send the announcement email."""
    service = AwardService(db)
    category = service.publish_results(category_id)
    return APIResponse(success=True, data=category.model_dump(), message="Résultats publiés")


@router.post("/publish-all-results", response_model=APIResponse)
async def publish_all_results(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Publish results for every category whose vote has closed, and send the announcement email to all active members (Admin only)."""
    service = AwardService(db)
    result = service.publish_all_results()
    return APIResponse(success=True, data=result, message=f"{result['publishedCount']} catégorie(s) publiée(s)")


@router.get("/am-i-curator", response_model=APIResponse)
async def am_i_curator(
    current_user=Depends(get_current_user),
):
    """Tells the frontend whether the current user is allowed to run the curation steps (shows/hides the curation UI)."""
    is_curator = current_user.role == "super_admin" or (current_user.email or "").lower() in AWARD_CURATOR_EMAILS
    return APIResponse(success=True, data={"isCurator": is_curator})


@router.post("/reset-all", response_model=APIResponse)
async def reset_all(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_super_admin),
):
    """Wipe every nomination/candidate/vote and reset all categories + settings to their initial state.
    Irreversible - super admin only, intended for testing the flow end-to-end before the real launch."""
    service = AwardService(db)
    result = service.reset_all()
    return APIResponse(success=True, data=result, message="Processus Awards réinitialisé")


@router.get("/settings", response_model=APIResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get the global vote window (start/end)."""
    service = AwardService(db)
    return APIResponse(success=True, data=service.get_settings().model_dump())


@router.patch("/settings", response_model=APIResponse)
async def update_settings(
    data: UpdateAwardSettingsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """Schedule the global vote window start/end (Admin only)."""
    service = AwardService(db)
    result = service.update_settings(data)
    return APIResponse(success=True, data=result.model_dump(), message="Fenêtre de vote mise à jour")


@router.post("/cron/reminder", response_model=APIResponse)
async def cron_send_reminder(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Vercel Cron entrypoint: sends the J-1 vote-closing reminder if due. Protected by CRON_SECRET, not user auth."""
    expected = f"Bearer {settings.CRON_SECRET}" if settings.CRON_SECRET else None
    if not expected or authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    service = AwardService(db)
    result = service.send_vote_reminder_if_due()
    return APIResponse(success=True, data=result)

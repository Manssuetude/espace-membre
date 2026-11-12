from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_super_admin
from app.core.config import settings
from app.core.exceptions import ForbiddenException
from app.schemas.award import (
    NominateRequest,
    BuildShortlistRequest,
    VoteRequest,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    UpdateAwardSettingsRequest,
    SaveCeremonyPreparationRequest,
)
from app.schemas.common import APIResponse
from app.services.award_service import AwardService, can_manage_awards

router = APIRouter()


def get_award_manager(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """Admins, super admins and members of the « Vie asso » commission: create/edit/delete categories,
    run the curation steps (close/reopen nominations, shortlist), schedule the calendar/emails, run the
    ceremony (preparation, projection, publication). Only the reset stays super-admin-only."""
    if can_manage_awards(db, current_user):
        return current_user
    raise ForbiddenException("Accès réservé aux administrateurs et à la commission Vie asso")


@router.get("/categories", response_model=APIResponse)
async def get_categories(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List award categories with their computed phase, the current user's own nomination/vote, and the shortlist once curated.
    Categories still awaiting the scheduled nomination window are hidden from regular members. During the teasing
    phase, non-organizers only receive revealed/locked fields for categories not yet revealed."""
    is_manager = can_manage_awards(db, current_user)
    service = AwardService(db)
    categories = service.get_categories(user_id=str(current_user.id), is_manager=is_manager, include_hidden=is_manager)
    return APIResponse(success=True, data=[c.model_dump() for c in categories])


@router.get("/categories/{category_id}", response_model=APIResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    is_manager = can_manage_awards(db, current_user)
    service = AwardService(db)
    category = service.get_category(category_id, user_id=str(current_user.id), is_manager=is_manager, include_hidden=is_manager)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catégorie introuvable")
    return APIResponse(success=True, data=category.model_dump())


@router.post("/categories", response_model=APIResponse)
async def create_category(
    data: CreateCategoryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Create a new award category (admins + commission Vie asso)."""
    service = AwardService(db)
    category = service.create_category(data)
    return APIResponse(success=True, data=category.model_dump(), message="Catégorie créée avec succès")


@router.patch("/categories/{category_id}", response_model=APIResponse)
async def update_category(
    category_id: str,
    data: UpdateCategoryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Update a category's name/description/icon/target type/reveal date (admins + commission Vie asso)."""
    service = AwardService(db)
    category = service.update_category(category_id, data)
    return APIResponse(success=True, data=category.model_dump(), message="Catégorie mise à jour")


@router.delete("/categories/{category_id}", response_model=APIResponse)
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Delete an award category entirely, cascading its nominations/candidates/votes/winners (admins + commission Vie asso)."""
    service = AwardService(db)
    service.delete_category(category_id)
    return APIResponse(success=True, message="Catégorie supprimée")


@router.post("/categories/distribute-reveals", response_model=APIResponse)
async def distribute_reveals(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Evenly spread each category's reveal date between the teasing start and the nomination start (admins + commission Vie asso)."""
    service = AwardService(db)
    result = service.distribute_reveals()
    return APIResponse(success=True, data=result, message=f"{result['updatedCount']} catégorie(s) planifiée(s)")


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
    current_user=Depends(get_award_manager),
):
    """Aggregated nominees for a category with proposal counts, suggested top 3, and tie-at-cutoff flag (admins + commission Vie asso)."""
    service = AwardService(db)
    stats = service.get_nomination_stats(category_id)
    return APIResponse(success=True, data=[s.model_dump() for s in stats])


@router.post("/close-all-nominations", response_model=APIResponse)
async def close_all_nominations(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Close the nomination phase for every category still open, in one go (admins + commission Vie asso)."""
    service = AwardService(db)
    result = service.close_all_nominations()
    return APIResponse(success=True, data=result, message=f"{result['closedCount']} catégorie(s) clôturée(s)")


@router.post("/categories/{category_id}/close-nominations", response_model=APIResponse)
async def close_nominations(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Close the nomination phase for a category (admins + commission Vie asso)."""
    service = AwardService(db)
    category = service.close_nominations(category_id)
    return APIResponse(success=True, data=category.model_dump(), message="Nominations clôturées")


@router.post("/reopen-all-nominations", response_model=APIResponse)
async def reopen_all_nominations(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Reopen the nomination phase for every closed category that has no shortlist yet (admins + commission Vie asso)."""
    service = AwardService(db)
    result = service.reopen_all_nominations()
    return APIResponse(success=True, data=result, message=f"{result['reopenedCount']} catégorie(s) rouverte(s)")


@router.post("/categories/{category_id}/reopen-nominations", response_model=APIResponse)
async def reopen_nominations(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Reopen the nomination phase for a category, only allowed before a shortlist exists (admins + commission Vie asso)."""
    service = AwardService(db)
    category = service.reopen_nominations(category_id)
    return APIResponse(success=True, data=category.model_dump(), message="Nominations rouvertes")


@router.post("/categories/{category_id}/shortlist", response_model=APIResponse)
async def build_shortlist(
    category_id: str,
    data: BuildShortlistRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Finalize the shortlist of candidates for a category from the nomination stats (admins + commission Vie asso)."""
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


# ------------------------------------------------------------------
# Ceremony: preparation, projection (never visible to non-organizers), publication
# ------------------------------------------------------------------

@router.get("/ceremony/preparation", response_model=APIResponse)
async def get_ceremony_preparation(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Candidates + votes + tie detection + running order for every category awaiting the ceremony (admins + commission Vie asso)."""
    service = AwardService(db)
    items = service.get_ceremony_preparation()
    return APIResponse(success=True, data=[i.model_dump() for i in items])


@router.put("/ceremony/preparation", response_model=APIResponse)
async def save_ceremony_preparation(
    data: SaveCeremonyPreparationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Save the running order and tie-break resolutions. Never publishes anything (admins + commission Vie asso)."""
    service = AwardService(db)
    result = service.save_ceremony_preparation(data)
    return APIResponse(success=True, data=result, message="Préparation enregistrée")


@router.get("/ceremony", response_model=APIResponse)
async def get_ceremony(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Categories in running order with finalists and winners, for the fullscreen ceremony mode.
    Never accessible to a non-organizer. 409 if a tie is still unresolved."""
    service = AwardService(db)
    items = service.get_ceremony()
    return APIResponse(success=True, data=[i.model_dump() for i in items])


@router.post("/publish-all-results", response_model=APIResponse)
async def publish_all_results(
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Publish results for every category awaiting the ceremony, award the permanent badges, and send the
    announcement email according to email_mode (admins + commission Vie asso). 400 if a tie is unresolved."""
    service = AwardService(db)
    result = service.publish_all_results()
    return APIResponse(success=True, data=result, message=f"{result['publishedCount']} catégorie(s) publiée(s)")


@router.get("/am-i-award-manager", response_model=APIResponse)
async def am_i_award_manager(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Tells the frontend whether the current user may manage/organize the Awards."""
    is_manager = can_manage_awards(db, current_user)
    return APIResponse(success=True, data={"isManager": is_manager})


@router.get("/am-i-curator", response_model=APIResponse)
async def am_i_curator(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Deprecated alias of /am-i-award-manager, kept only during the frontend migration. Remove before committing."""
    is_manager = can_manage_awards(db, current_user)
    return APIResponse(success=True, data={"isCurator": is_manager})


@router.post("/reset-all", response_model=APIResponse)
async def reset_all(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_super_admin),
):
    """Wipe every nomination/candidate/vote/winner and reset the edition's timers to their initial state.
    Keeps edition_year, ceremony_session_id, email_mode and already-awarded UserAwardWin badges.
    Irreversible - super admin only, intended for testing the flow end-to-end before the real launch."""
    service = AwardService(db)
    result = service.reset_all()
    return APIResponse(success=True, data=result, message="Édition Awards réinitialisée")


@router.get("/settings", response_model=APIResponse)
async def get_settings(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get the edition year, teasing/nomination/vote windows, ceremony session and email mode."""
    service = AwardService(db)
    return APIResponse(success=True, data=service.get_settings().model_dump())


@router.patch("/settings", response_model=APIResponse)
async def update_settings(
    data: UpdateAwardSettingsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_award_manager),
):
    """Update the calendar (edition year, teasing/nomination/vote windows, ceremony session) and/or the email
    mode (admins + commission Vie asso). 400 if the calendar ordering is invalid."""
    service = AwardService(db)
    result = service.update_settings(data)
    return APIResponse(success=True, data=result.model_dump(), message="Calendrier mis à jour")


@router.post("/cron/tick", response_model=APIResponse)
async def cron_tick(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Vercel Cron entrypoint: sends the teasing/nominations-open/vote-open emails (once each) and the J-1
    vote-closing reminder, all gated by email_mode. Protected by CRON_SECRET, not user auth."""
    expected = f"Bearer {settings.CRON_SECRET}" if settings.CRON_SECRET else None
    if not expected or authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    service = AwardService(db)
    result = service.run_cron_tick()
    return APIResponse(success=True, data=result)


@router.post("/cron/reminder", response_model=APIResponse)
async def cron_reminder_alias(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    """Deprecated alias of /cron/tick, kept only so the live Vercel cron (not yet redeployed) doesn't 404."""
    return await cron_tick(db=db, authorization=authorization)

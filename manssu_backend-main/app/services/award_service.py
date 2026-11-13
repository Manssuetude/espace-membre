from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from app.models.award import AwardCategory, AwardNomination, AwardCandidate, AwardVote, AwardWinner, AwardSettings
from app.models.user_award import UserAwardWin
from app.models.user import User
from app.models.commission import Commission, CommissionMember
from app.models.session import Session as SessionModel
from app.schemas.award import (
    NominateRequest,
    NominationStatItem,
    BuildShortlistRequest,
    CandidateResponse,
    VoteRequest,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CategoryResponse,
    CeremonySessionInfo,
    AwardSettingsResponse,
    UpdateAwardSettingsRequest,
    SaveCeremonyPreparationRequest,
    PreparationCandidate,
    PreparationCategoryItem,
    CeremonyCategoryItem,
    TieBreakResolution,
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.services.email_service import ResendEmailService
from app.services.user_award_service import UserAwardService


# Les membres de cette commission (et son responsable) gèrent les Awards avec les
# admins : catégories, clôture des nominations, liste finale. Repérée par son nom,
# sans tenir compte de la casse : « Vie asso », « Vie associative »…
AWARD_MANAGER_COMMISSION_PREFIX = "vie asso"


def can_manage_awards(db: Session, user: User) -> bool:
    """admin, super_admin, or member/leader of the active « Vie asso » commission."""
    if user.role in ["admin", "super_admin"]:
        return True
    return (
        db.query(Commission.id)
        .outerjoin(CommissionMember, CommissionMember.commission_id == Commission.id)
        .filter(
            Commission.status == "active",
            func.lower(Commission.name).like(f"{AWARD_MANAGER_COMMISSION_PREFIX}%"),
            or_(CommissionMember.user_id == user.id, Commission.leader_id == user.id),
        )
        .first()
        is not None
    )


class AwardService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_category_or_404(self, category_id: str) -> AwardCategory:
        category = self.db.query(AwardCategory).filter(AwardCategory.id == category_id).first()
        if not category:
            raise NotFoundException("Catégorie introuvable")
        return category

    def _get_settings(self) -> AwardSettings:
        settings_row = self.db.query(AwardSettings).filter(AwardSettings.id == 1).first()
        if not settings_row:
            settings_row = AwardSettings(id=1)
            self.db.add(settings_row)
            self.db.commit()
            self.db.refresh(settings_row)
        return settings_row

    def _is_nomination_window_open(self, category: AwardCategory, settings: AwardSettings, now: datetime) -> bool:
        """Whether this category still accepts proposals: manually open AND within the global nomination window (if scheduled)."""
        if not category.nominations_open:
            return False
        if settings.nomination_end_at and now >= settings.nomination_end_at:
            return False
        return True

    def _is_nomination_actionable(self, category: AwardCategory, settings: AwardSettings, now: datetime) -> bool:
        """Whether a member can currently propose/withdraw a nomination for this category."""
        if not self._is_nomination_window_open(category, settings, now):
            return False
        if settings.nomination_start_at is None or now < settings.nomination_start_at:
            return False
        return True

    def _is_category_hidden_from_members(self, category: AwardCategory, settings: AwardSettings, now: datetime) -> bool:
        """A category still in the raw nomination phase is hidden from regular members until either the
        teasing phase has started (members then see it as revealed/locked) or the nomination window has
        actively started. If neither has been configured at all, it stays hidden by default."""
        if not category.nominations_open:
            return False
        if settings.teasing_start_at is not None and now >= settings.teasing_start_at:
            return False
        if settings.nomination_start_at is None:
            return True
        return now < settings.nomination_start_at

    def _compute_status(self, category: AwardCategory, settings: AwardSettings, now: datetime) -> str:
        if self._is_nomination_window_open(category, settings, now):
            return "nomination"

        has_candidates = self.db.query(AwardCandidate).filter(AwardCandidate.category_id == category.id).count() > 0
        if not has_candidates:
            return "curation"

        if category.results_published_at:
            return "results_published"

        vote_start = settings.vote_start_at
        vote_end = settings.vote_end_at

        if vote_end and now >= vote_end:
            return "awaiting_ceremony"
        if vote_start and now < vote_start:
            return "vote_scheduled"
        if not vote_start:
            return "vote_scheduled"
        return "vote_open"

    def _compute_edition_phase(self, settings: AwardSettings, now: datetime) -> str:
        """Coarse, display-only phase for the whole edition (header/dashboard/admin timeline).
        The authoritative per-category gating stays in _compute_status / _is_category_hidden_from_members.

        An unset milestone does not force "not_started": a cycle that started before this
        teasing/phase system existed (teasing_start_at left NULL) but already has a
        nomination_start_at in the past must resolve past "teasing", not get stuck before it."""
        if settings.teasing_start_at and now < settings.teasing_start_at:
            return "not_started"
        if not settings.teasing_start_at and not settings.nomination_start_at:
            return "not_started"
        if settings.nomination_start_at and now < settings.nomination_start_at:
            return "teasing"
        if not settings.nomination_start_at:
            return "teasing"
        if settings.nomination_end_at and now < settings.nomination_end_at:
            return "nomination"
        if not settings.nomination_end_at:
            return "nomination"
        if settings.vote_start_at and now < settings.vote_start_at:
            return "selection"
        if not settings.vote_start_at:
            return "selection"
        if settings.vote_end_at and now < settings.vote_end_at:
            return "vote"
        if not settings.vote_end_at:
            return "vote"
        has_published = self.db.query(AwardCategory.id).filter(AwardCategory.results_published_at.isnot(None)).first() is not None
        return "published" if has_published else "ceremony_pending"

    def _nominee_display(self, user: Optional[User], commission: Optional[Commission]):
        if user:
            return f"{user.first_name} {user.last_name}", user.avatar_url
        if commission:
            return commission.name, None
        return "Inconnu", None

    def _category_to_response(
        self,
        category: AwardCategory,
        user_id: Optional[str] = None,
        is_manager: bool = False,
        edition_phase: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> CategoryResponse:
        settings = self._get_settings()
        now = now or datetime.utcnow()
        status_ = self._compute_status(category, settings, now)
        if edition_phase is None:
            edition_phase = self._compute_edition_phase(settings, now)

        my_nominations: List[NominationStatItem] = []
        if user_id:
            noms = self.db.query(AwardNomination).options(
                joinedload(AwardNomination.nominated_user),
                joinedload(AwardNomination.nominated_commission),
            ).filter(
                AwardNomination.category_id == category.id,
                AwardNomination.proposed_by_user_id == user_id,
            ).all()
            for nom in noms:
                name, avatar = self._nominee_display(nom.nominated_user, nom.nominated_commission)
                my_nominations.append(NominationStatItem(
                    nominatedUserId=str(nom.nominated_user_id) if nom.nominated_user_id else None,
                    nominatedCommissionId=str(nom.nominated_commission_id) if nom.nominated_commission_id else None,
                    name=name,
                    avatarUrl=avatar,
                    count=0,
                    proposedBy=[],
                ))

        my_vote = None
        if user_id:
            vote = self.db.query(AwardVote).filter(
                AwardVote.category_id == category.id,
                AwardVote.voter_user_id == user_id,
            ).first()
            if vote:
                my_vote = str(vote.candidate_id)

        # Teasing: name/icon/description are stripped server-side (not just hidden by the front)
        # for anyone who isn't an organizer, until the category's own reveal date has passed.
        revealed = None
        reveal_at_out = None
        reveal_number = None
        is_new = False
        name_out, description_out, icon_out = category.name, category.description, category.icon
        if edition_phase == "teasing":
            revealed = category.reveal_at is not None and now >= category.reveal_at
            reveal_at_out = category.reveal_at.isoformat() if category.reveal_at else None
            reveal_number = category.order_index + 1
            if revealed:
                is_new = (now - category.reveal_at) < timedelta(hours=48)
            if not revealed and not is_manager:
                name_out, description_out, icon_out = None, None, None

        show_results = status_ == "results_published"
        candidates_query = self.db.query(AwardCandidate).options(
            joinedload(AwardCandidate.nominated_user),
            joinedload(AwardCandidate.nominated_commission),
        ).filter(AwardCandidate.category_id == category.id).all()

        candidates_out = None
        finalists_out = None
        if candidates_query:
            total_votes = sum(c.votes for c in candidates_query) or 0
            full_list = []
            stripped_list = []
            for c in candidates_query:
                name, avatar = self._nominee_display(c.nominated_user, c.nominated_commission)
                full_list.append(CandidateResponse(
                    id=str(c.id),
                    nominatedUserId=str(c.nominated_user_id) if c.nominated_user_id else None,
                    nominatedCommissionId=str(c.nominated_commission_id) if c.nominated_commission_id else None,
                    name=name,
                    avatarUrl=avatar,
                    nominationCount=c.nomination_count,
                    votes=c.votes if show_results else None,
                    percentage=round((c.votes / total_votes) * 100, 1) if (show_results and total_votes > 0) else None,
                ))
                stripped_list.append(CandidateResponse(
                    id=str(c.id),
                    nominatedUserId=str(c.nominated_user_id) if c.nominated_user_id else None,
                    nominatedCommissionId=str(c.nominated_commission_id) if c.nominated_commission_id else None,
                    name=name,
                    avatarUrl=avatar,
                    nominationCount=None,
                    votes=None,
                    percentage=None,
                ))
            if is_manager:
                candidates_out = full_list
            else:
                finalists_out = stripped_list

        winners_out = None
        is_co_winner = False
        if show_results:
            winner_rows = self.db.query(AwardWinner).options(
                joinedload(AwardWinner.candidate).joinedload(AwardCandidate.nominated_user),
                joinedload(AwardWinner.candidate).joinedload(AwardCandidate.nominated_commission),
            ).filter(AwardWinner.category_id == category.id).all()
            if winner_rows:
                is_co_winner = len(winner_rows) > 1
                winners_out = []
                for w in winner_rows:
                    name, avatar = self._nominee_display(w.candidate.nominated_user, w.candidate.nominated_commission)
                    winners_out.append(CandidateResponse(
                        id=str(w.candidate.id),
                        nominatedUserId=str(w.candidate.nominated_user_id) if w.candidate.nominated_user_id else None,
                        nominatedCommissionId=str(w.candidate.nominated_commission_id) if w.candidate.nominated_commission_id else None,
                        name=name,
                        avatarUrl=avatar,
                        nominationCount=None,
                        votes=None,
                        percentage=None,
                    ))

        nomination_count = 0
        if is_manager:
            nomination_count = self.db.query(AwardNomination).filter(AwardNomination.category_id == category.id).count()

        return CategoryResponse(
            id=str(category.id),
            name=name_out,
            description=description_out,
            icon=icon_out,
            targetType=category.target_type,
            status=status_,
            nominationsOpen=category.nominations_open,
            orderIndex=category.order_index,
            myNominations=my_nominations,
            myVote=my_vote,
            candidates=candidates_out,
            finalists=finalists_out,
            winners=winners_out,
            isCoWinner=is_co_winner,
            ceremonyOrder=category.ceremony_order if category.ceremony_order is not None else category.order_index,
            nominationCount=nomination_count,
            resultsPublishedAt=category.results_published_at.isoformat() if category.results_published_at else None,
            revealed=revealed,
            revealAt=reveal_at_out,
            revealNumber=reveal_number,
            isNew=is_new,
        )

    # ------------------------------------------------------------------
    # Categories
    # ------------------------------------------------------------------

    def get_categories(self, user_id: Optional[str] = None, is_manager: bool = False, include_hidden: bool = False) -> List[CategoryResponse]:
        settings = self._get_settings()
        now = datetime.utcnow()
        edition_phase = self._compute_edition_phase(settings, now)
        categories = self.db.query(AwardCategory).order_by(AwardCategory.order_index, AwardCategory.created_at).all()
        if not include_hidden:
            categories = [c for c in categories if not self._is_category_hidden_from_members(c, settings, now)]
        return [
            self._category_to_response(c, user_id=user_id, is_manager=is_manager, edition_phase=edition_phase, now=now)
            for c in categories
        ]

    def get_category(self, category_id: str, user_id: Optional[str] = None, is_manager: bool = False, include_hidden: bool = False) -> Optional[CategoryResponse]:
        category = self.db.query(AwardCategory).filter(AwardCategory.id == category_id).first()
        if not category:
            return None
        settings = self._get_settings()
        now = datetime.utcnow()
        if not include_hidden and self._is_category_hidden_from_members(category, settings, now):
            return None
        return self._category_to_response(category, user_id=user_id, is_manager=is_manager, now=now)

    def create_category(self, data: CreateCategoryRequest) -> CategoryResponse:
        category = AwardCategory(
            name=data.name,
            description=data.description,
            icon=data.icon,
            target_type=data.targetType,
            order_index=data.orderIndex,
        )
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_manager=True)

    def update_category(self, category_id: str, data: UpdateCategoryRequest) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        if data.name is not None:
            category.name = data.name
        if data.description is not None:
            category.description = data.description
        if data.icon is not None:
            category.icon = data.icon
        if data.revealAt is not None:
            category.reveal_at = data.revealAt
        if data.targetType is not None and data.targetType != category.target_type:
            has_nominations = self.db.query(AwardNomination).filter(AwardNomination.category_id == category_id).count() > 0
            if has_nominations:
                raise ConflictException("Impossible de changer le type de candidat : des nominations existent déjà pour cette catégorie")
            category.target_type = data.targetType
        category.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_manager=True)

    def delete_category(self, category_id: str) -> None:
        """Deletes a category and cascades its nominations/candidates/votes/winners. Does not touch any
        UserAwardWin already recorded - those are permanent and decoupled from the category row."""
        category = self._get_category_or_404(category_id)
        self.db.delete(category)
        self.db.commit()

    # ------------------------------------------------------------------
    # Teasing
    # ------------------------------------------------------------------

    def get_participation(self) -> dict:
        """Distinct people who nominated / voted, per category and overall (a total is not a sum:
        one member usually acts in several categories)."""
        nominators = dict(
            self.db.query(AwardNomination.category_id, func.count(func.distinct(AwardNomination.proposed_by_user_id)))
            .group_by(AwardNomination.category_id)
            .all()
        )
        voters = dict(
            self.db.query(AwardVote.category_id, func.count(func.distinct(AwardVote.voter_user_id)))
            .group_by(AwardVote.category_id)
            .all()
        )
        category_ids = [c.id for c in self.db.query(AwardCategory.id).all()]
        return {
            "totalNominators": self.db.query(func.count(func.distinct(AwardNomination.proposed_by_user_id))).scalar() or 0,
            "totalVoters": self.db.query(func.count(func.distinct(AwardVote.voter_user_id))).scalar() or 0,
            "activeMembers": self.db.query(User).filter(User.status == "active", User.role != "guest").count(),
            "perCategory": {
                str(cid): {"nominators": nominators.get(cid, 0), "voters": voters.get(cid, 0)} for cid in category_ids
            },
        }

    def distribute_reveals(self) -> dict:
        settings = self._get_settings()
        if not settings.teasing_start_at or not settings.nomination_start_at:
            raise BadRequestException("Réglez le début du teasing et le début des nominations avant de répartir les révélations")
        if settings.nomination_start_at <= settings.teasing_start_at:
            raise BadRequestException("Le début des nominations doit être après le début du teasing")

        categories = self.db.query(AwardCategory).order_by(AwardCategory.order_index).all()
        n = len(categories)
        if n == 0:
            return {"updatedCount": 0}
        total_span = (settings.nomination_start_at - settings.teasing_start_at).total_seconds()
        step = total_span / n
        for i, category in enumerate(categories):
            category.reveal_at = settings.teasing_start_at + timedelta(seconds=step * i)
        self.db.commit()
        return {"updatedCount": n}

    # ------------------------------------------------------------------
    # Nomination phase
    # ------------------------------------------------------------------

    def nominate(self, category_id: str, data: NominateRequest, user_id: str) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        settings = self._get_settings()
        if not self._is_nomination_actionable(category, settings, datetime.utcnow()):
            raise BadRequestException("Les nominations ne sont pas ouvertes pour cette catégorie")

        if category.target_type == "member":
            if not data.nominatedUserId or data.nominatedCommissionId:
                raise BadRequestException("Cette catégorie nomine un membre")
            if str(data.nominatedUserId) == str(user_id):
                raise BadRequestException("Vous ne pouvez pas vous proposer vous-même")
            target = self.db.query(User).filter(User.id == data.nominatedUserId, User.status == "active").first()
            if not target:
                raise BadRequestException("Membre introuvable ou inactif")
            if target.role == "guest":
                raise BadRequestException("Un invité ne peut pas être nominé")
        else:
            if not data.nominatedCommissionId or data.nominatedUserId:
                raise BadRequestException("Cette catégorie nomine une commission")
            target = self.db.query(Commission).filter(Commission.id == data.nominatedCommissionId).first()
            if not target:
                raise BadRequestException("Commission introuvable")

        existing_query = self.db.query(AwardNomination).filter(
            AwardNomination.category_id == category_id,
            AwardNomination.proposed_by_user_id == user_id,
        )
        if data.nominatedUserId:
            existing_query = existing_query.filter(AwardNomination.nominated_user_id == data.nominatedUserId)
        else:
            existing_query = existing_query.filter(AwardNomination.nominated_commission_id == data.nominatedCommissionId)
        if existing_query.first():
            raise ConflictException("Vous avez déjà proposé ce candidat dans cette catégorie")

        self.db.add(AwardNomination(
            category_id=category_id,
            nominated_user_id=data.nominatedUserId,
            nominated_commission_id=data.nominatedCommissionId,
            proposed_by_user_id=user_id,
        ))

        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, user_id=user_id)

    def remove_nomination(self, category_id: str, nominee_id: str, user_id: str) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        settings = self._get_settings()
        if not self._is_nomination_actionable(category, settings, datetime.utcnow()):
            raise BadRequestException("Les nominations ne sont pas ouvertes pour cette catégorie")

        nomination = self.db.query(AwardNomination).filter(
            AwardNomination.category_id == category_id,
            AwardNomination.proposed_by_user_id == user_id,
        ).filter(
            (AwardNomination.nominated_user_id == nominee_id) | (AwardNomination.nominated_commission_id == nominee_id)
        ).first()
        if not nomination:
            raise NotFoundException("Proposition introuvable")

        self.db.delete(nomination)
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, user_id=user_id)

    def get_nomination_stats(self, category_id: str) -> List[NominationStatItem]:
        self._get_category_or_404(category_id)
        nominations = self.db.query(AwardNomination).options(
            joinedload(AwardNomination.nominated_user),
            joinedload(AwardNomination.nominated_commission),
            joinedload(AwardNomination.proposed_by),
        ).filter(AwardNomination.category_id == category_id).all()

        grouped: Dict[str, dict] = {}
        for nom in nominations:
            key = str(nom.nominated_user_id or nom.nominated_commission_id)
            if key not in grouped:
                name, avatar = self._nominee_display(nom.nominated_user, nom.nominated_commission)
                grouped[key] = {
                    "nominatedUserId": str(nom.nominated_user_id) if nom.nominated_user_id else None,
                    "nominatedCommissionId": str(nom.nominated_commission_id) if nom.nominated_commission_id else None,
                    "name": name,
                    "avatarUrl": avatar,
                    "count": 0,
                    "proposedBy": [],
                }
            grouped[key]["count"] += 1
            if nom.proposed_by:
                grouped[key]["proposedBy"].append(f"{nom.proposed_by.first_name} {nom.proposed_by.last_name}")

        items = sorted(grouped.values(), key=lambda x: x["count"], reverse=True)
        for i, item in enumerate(items):
            item["suggested"] = i < 3
        tie_at_cutoff = len(items) > 3 and items[2]["count"] == items[3]["count"]
        for item in items:
            item["tieAtCutoff"] = tie_at_cutoff
        return [NominationStatItem(**item) for item in items]

    def close_all_nominations(self) -> dict:
        categories = self.db.query(AwardCategory).filter(AwardCategory.nominations_open.is_(True)).all()
        for category in categories:
            category.nominations_open = False
        self.db.commit()
        return {
            "closedCount": len(categories),
            "closedCategoryIds": [str(c.id) for c in categories],
        }

    def close_nominations(self, category_id: str) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        category.nominations_open = False
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_manager=True)

    def reopen_all_nominations(self) -> dict:
        categories = self.db.query(AwardCategory).filter(AwardCategory.nominations_open.is_(False)).all()
        reopened = []
        for category in categories:
            has_candidates = self.db.query(AwardCandidate).filter(AwardCandidate.category_id == category.id).count() > 0
            if not has_candidates:
                category.nominations_open = True
                reopened.append(category)
        self.db.commit()
        return {
            "reopenedCount": len(reopened),
            "reopenedCategoryIds": [str(c.id) for c in reopened],
        }

    def reopen_nominations(self, category_id: str) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        has_candidates = self.db.query(AwardCandidate).filter(AwardCandidate.category_id == category_id).count() > 0
        if has_candidates:
            raise ConflictException("Impossible de rouvrir les nominations : la liste finale a déjà été validée pour cette catégorie")
        category.nominations_open = True
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_manager=True)

    # ------------------------------------------------------------------
    # Curation
    # ------------------------------------------------------------------

    def build_shortlist(self, category_id: str, data: BuildShortlistRequest) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        if category.nominations_open:
            raise BadRequestException("Fermez d'abord les nominations avant de valider la liste finale")

        existing_votes = self.db.query(AwardVote).filter(AwardVote.category_id == category_id).count()
        if existing_votes > 0:
            raise ConflictException("Le vote a déjà commencé, la liste finale ne peut plus être modifiée")

        self.db.query(AwardCandidate).filter(AwardCandidate.category_id == category_id).delete()
        self.db.flush()

        for item in data.candidates:
            query = self.db.query(AwardNomination).filter(AwardNomination.category_id == category_id)
            if item.nominatedUserId:
                query = query.filter(AwardNomination.nominated_user_id == item.nominatedUserId)
            else:
                query = query.filter(AwardNomination.nominated_commission_id == item.nominatedCommissionId)
            count = query.count()

            self.db.add(AwardCandidate(
                category_id=category_id,
                nominated_user_id=item.nominatedUserId,
                nominated_commission_id=item.nominatedCommissionId,
                nomination_count=count,
            ))

        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_manager=True)

    # ------------------------------------------------------------------
    # Vote phase
    # ------------------------------------------------------------------

    def vote(self, category_id: str, data: VoteRequest, user_id: str) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        settings = self._get_settings()
        status_ = self._compute_status(category, settings, datetime.utcnow())
        if status_ != "vote_open":
            raise BadRequestException("Le vote n'est pas ouvert pour cette catégorie")

        candidate = self.db.query(AwardCandidate).filter(
            AwardCandidate.id == data.candidateId,
            AwardCandidate.category_id == category_id,
        ).first()
        if not candidate:
            raise BadRequestException("Candidat invalide")

        existing = self.db.query(AwardVote).filter(
            AwardVote.category_id == category_id,
            AwardVote.voter_user_id == user_id,
        ).first()
        if existing:
            raise ConflictException("Vous avez déjà voté dans cette catégorie")

        self.db.add(AwardVote(category_id=category_id, candidate_id=candidate.id, voter_user_id=user_id))
        candidate.votes += 1
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, user_id=user_id)

    # ------------------------------------------------------------------
    # Ceremony: preparation, projection, publication
    # ------------------------------------------------------------------

    def _categories_awaiting_ceremony(self, settings: AwardSettings, now: datetime) -> List[AwardCategory]:
        categories = self.db.query(AwardCategory).all()
        return [c for c in categories if self._compute_status(c, settings, now) == "awaiting_ceremony"]

    def get_ceremony_preparation(self) -> List[PreparationCategoryItem]:
        settings = self._get_settings()
        now = datetime.utcnow()
        categories = self._categories_awaiting_ceremony(settings, now)
        if not categories:
            raise BadRequestException("Aucune catégorie n'est en attente de cérémonie (le vote doit être clos)")

        items = []
        for category in categories:
            candidates = self.db.query(AwardCandidate).options(
                joinedload(AwardCandidate.nominated_user),
                joinedload(AwardCandidate.nominated_commission),
            ).filter(AwardCandidate.category_id == category.id).all()
            max_votes = max((c.votes for c in candidates), default=0)
            tied = [c for c in candidates if c.votes == max_votes]
            tie = len(tied) > 1

            existing_winners = self.db.query(AwardWinner).filter(AwardWinner.category_id == category.id).all()
            resolution = None
            if existing_winners:
                if len(existing_winners) > 1:
                    resolution = TieBreakResolution(mode="co_winners")
                else:
                    resolution = TieBreakResolution(mode="winner", candidateId=str(existing_winners[0].candidate_id))

            prep_candidates = []
            for c in candidates:
                name, avatar = self._nominee_display(c.nominated_user, c.nominated_commission)
                prep_candidates.append(PreparationCandidate(id=str(c.id), name=name, avatarUrl=avatar, votes=c.votes))

            items.append(PreparationCategoryItem(
                id=str(category.id),
                name=category.name,
                icon=category.icon,
                ceremonyOrder=category.ceremony_order if category.ceremony_order is not None else category.order_index,
                candidates=prep_candidates,
                tie=tie,
                resolution=resolution,
            ))

        items.sort(key=lambda i: i.ceremonyOrder)
        return items

    def save_ceremony_preparation(self, data: SaveCeremonyPreparationRequest) -> dict:
        settings = self._get_settings()
        now = datetime.utcnow()

        for index, category_id in enumerate(data.order):
            category = self.db.query(AwardCategory).filter(AwardCategory.id == category_id).first()
            if category:
                category.ceremony_order = index

        categories = self.db.query(AwardCategory).filter(AwardCategory.id.in_(data.order)).all()
        for category in categories:
            if self._compute_status(category, settings, now) != "awaiting_ceremony":
                continue
            candidates = self.db.query(AwardCandidate).filter(AwardCandidate.category_id == category.id).all()
            if not candidates:
                continue
            max_votes = max(c.votes for c in candidates)
            tied = [c for c in candidates if c.votes == max_votes]
            tie = len(tied) > 1

            # Rewritten from scratch each save - idempotent.
            self.db.query(AwardWinner).filter(AwardWinner.category_id == category.id).delete()

            resolution = data.resolutions.get(str(category.id))
            if not tie:
                self.db.add(AwardWinner(category_id=category.id, candidate_id=tied[0].id))
            elif resolution is None:
                raise BadRequestException(f"Égalité non tranchée pour la catégorie « {category.name} »")
            elif resolution.mode == "co_winners":
                for c in tied:
                    self.db.add(AwardWinner(category_id=category.id, candidate_id=c.id))
            else:
                if not any(str(c.id) == resolution.candidateId for c in tied):
                    raise BadRequestException(f"Candidat invalide pour la catégorie « {category.name} »")
                self.db.add(AwardWinner(category_id=category.id, candidate_id=resolution.candidateId))

        self.db.commit()
        return {"saved": True}

    def get_ceremony(self) -> List[CeremonyCategoryItem]:
        settings = self._get_settings()
        now = datetime.utcnow()
        categories = self._categories_awaiting_ceremony(settings, now)

        unresolved = []
        items = []
        for category in categories:
            winners = self.db.query(AwardWinner).options(
                joinedload(AwardWinner.candidate).joinedload(AwardCandidate.nominated_user),
                joinedload(AwardWinner.candidate).joinedload(AwardCandidate.nominated_commission),
            ).filter(AwardWinner.category_id == category.id).all()
            if not winners:
                unresolved.append(category.name)
                continue

            candidates = self.db.query(AwardCandidate).options(
                joinedload(AwardCandidate.nominated_user),
                joinedload(AwardCandidate.nominated_commission),
            ).filter(AwardCandidate.category_id == category.id).all()
            finalists = []
            for c in candidates:
                name, avatar = self._nominee_display(c.nominated_user, c.nominated_commission)
                finalists.append(PreparationCandidate(id=str(c.id), name=name, avatarUrl=avatar, votes=c.votes))

            winner_items = []
            for w in winners:
                name, avatar = self._nominee_display(w.candidate.nominated_user, w.candidate.nominated_commission)
                winner_items.append(PreparationCandidate(id=str(w.candidate.id), name=name, avatarUrl=avatar, votes=w.candidate.votes))

            items.append(CeremonyCategoryItem(
                id=str(category.id),
                name=category.name,
                icon=category.icon,
                description=category.description,
                ceremonyOrder=category.ceremony_order if category.ceremony_order is not None else category.order_index,
                finalists=finalists,
                winners=winner_items,
                isCoWinner=len(winners) > 1,
            ))

        if unresolved:
            raise ConflictException(f"Égalité(s) non tranchée(s) : {', '.join(unresolved)}")

        items.sort(key=lambda i: i.ceremonyOrder)
        return items

    # ------------------------------------------------------------------
    # Publication
    # ------------------------------------------------------------------

    def publish_all_results(self) -> dict:
        settings = self._get_settings()
        now = datetime.utcnow()
        eligible = self._categories_awaiting_ceremony(settings, now)

        unresolved = [
            c.name for c in eligible
            if not self.db.query(AwardWinner).filter(AwardWinner.category_id == c.id).first()
        ]
        if unresolved:
            raise BadRequestException(f"Égalité(s) non tranchée(s) avant publication : {', '.join(unresolved)}")

        published = []
        badges_awarded = 0
        for category in eligible:
            category.results_published_at = now
            winners = self.db.query(AwardWinner).filter(AwardWinner.category_id == category.id).all()
            is_co_winner = len(winners) > 1
            for w in winners:
                candidate = self.db.query(AwardCandidate).filter(AwardCandidate.id == w.candidate_id).first()
                if candidate and (candidate.nominated_user_id or candidate.nominated_commission_id):
                    UserAwardService(self.db).record_win(
                        award_name=category.name,
                        award_icon=category.icon,
                        year=settings.edition_year,
                        user_id=str(candidate.nominated_user_id) if candidate.nominated_user_id else None,
                        commission_id=str(candidate.nominated_commission_id) if candidate.nominated_commission_id else None,
                        is_co_winner=is_co_winner,
                    )
                    badges_awarded += 1
            published.append(category)

        self.db.commit()

        if published:
            self._send_award_phase_email("results_published", settings)

        return {
            "publishedCount": len(published),
            "badgesAwarded": badges_awarded,
            "publishedCategoryIds": [str(c.id) for c in published],
        }

    # ------------------------------------------------------------------
    # Full reset (testing / re-running the whole process from scratch)
    # ------------------------------------------------------------------

    def reset_all(self) -> dict:
        """Wipes all nominations, candidates, votes and recorded winners, and resets every category
        and the global settings' timers to their initial state. Keeps edition_year, ceremony_session_id
        and email_mode (event configuration, not test state). Destructive and irreversible - super admin only."""
        votes_deleted = self.db.query(AwardVote).delete()
        winners_deleted = self.db.query(AwardWinner).delete()
        candidates_deleted = self.db.query(AwardCandidate).delete()
        nominations_deleted = self.db.query(AwardNomination).delete()

        # Also clear any award wins this reset produced (matched by name, since UserAwardWin
        # is a permanent table decoupled from AwardCategory on purpose - real wins from a
        # completed event would use the same category names, so only wipe when re-testing).
        category_names = [row[0] for row in self.db.query(AwardCategory.name).all()]
        wins_deleted = 0
        if category_names:
            wins_deleted = self.db.query(UserAwardWin).filter(
                UserAwardWin.award_name.in_(category_names)
            ).delete(synchronize_session=False)

        self.db.query(AwardCategory).update({
            "nominations_open": True,
            "results_published_at": None,
            "ceremony_order": None,
            "reveal_at": None,
        })

        settings_row = self._get_settings()
        settings_row.teasing_start_at = None
        settings_row.nomination_start_at = None
        settings_row.nomination_end_at = None
        settings_row.vote_start_at = None
        settings_row.vote_end_at = None
        settings_row.reminder_sent_at = None
        settings_row.teasing_email_sent_at = None
        settings_row.nominations_open_email_sent_at = None
        settings_row.vote_open_email_sent_at = None

        self.db.commit()

        return {
            "votesDeleted": votes_deleted,
            "winnersDeleted": winners_deleted,
            "candidatesDeleted": candidates_deleted,
            "nominationsDeleted": nominations_deleted,
            "winsDeleted": wins_deleted,
        }

    # ------------------------------------------------------------------
    # Global settings (teasing/nomination/vote windows, edition, ceremony, email mode)
    # ------------------------------------------------------------------

    def get_settings(self) -> AwardSettingsResponse:
        settings_row = self._get_settings()
        ceremony_session = None
        if settings_row.ceremony_session_id:
            session_row = self.db.query(SessionModel).filter(SessionModel.id == settings_row.ceremony_session_id).first()
            if session_row and session_row.date:
                ceremony_session = CeremonySessionInfo(
                    id=str(session_row.id),
                    title=session_row.title,
                    date=session_row.date.isoformat(),
                    startTime=session_row.start_time.isoformat() if session_row.start_time else None,
                    location=session_row.location_address,
                )
        return AwardSettingsResponse(
            editionYear=settings_row.edition_year,
            teasingStartAt=settings_row.teasing_start_at.isoformat() if settings_row.teasing_start_at else None,
            nominationStartAt=settings_row.nomination_start_at.isoformat() if settings_row.nomination_start_at else None,
            nominationEndAt=settings_row.nomination_end_at.isoformat() if settings_row.nomination_end_at else None,
            voteStartAt=settings_row.vote_start_at.isoformat() if settings_row.vote_start_at else None,
            voteEndAt=settings_row.vote_end_at.isoformat() if settings_row.vote_end_at else None,
            ceremonySession=ceremony_session,
            emailMode=settings_row.email_mode,
        )

    def update_settings(self, data: UpdateAwardSettingsRequest) -> AwardSettingsResponse:
        settings_row = self._get_settings()

        teasing = data.teasingStartAt if data.teasingStartAt is not None else settings_row.teasing_start_at
        nom_start = data.nominationStartAt if data.nominationStartAt is not None else settings_row.nomination_start_at
        nom_end = data.nominationEndAt if data.nominationEndAt is not None else settings_row.nomination_end_at
        vote_start = data.voteStartAt if data.voteStartAt is not None else settings_row.vote_start_at
        vote_end = data.voteEndAt if data.voteEndAt is not None else settings_row.vote_end_at
        ceremony_session_id = data.ceremonySessionId if data.ceremonySessionId is not None else settings_row.ceremony_session_id

        session_date = None
        if ceremony_session_id:
            session_row = self.db.query(SessionModel).filter(SessionModel.id == ceremony_session_id).first()
            if session_row and session_row.date:
                session_date = datetime.combine(session_row.date, session_row.start_time or datetime.min.time())

        def check(a, b, label_a, label_b, allow_equal=False):
            if a is None or b is None:
                return
            if allow_equal:
                if a > b:
                    raise BadRequestException(f"« {label_a} » doit être avant ou au même moment que « {label_b} »")
            elif a >= b:
                raise BadRequestException(f"« {label_a} » doit être avant « {label_b} »")

        check(teasing, nom_start, "Début du teasing", "Début des nominations")
        check(nom_start, nom_end, "Début des nominations", "Fin des nominations")
        check(nom_end, vote_start, "Fin des nominations", "Début du vote", allow_equal=True)
        check(vote_start, vote_end, "Début du vote", "Fin du vote")
        check(vote_end, session_date, "Fin du vote", "Séance de la cérémonie")

        if data.editionYear is not None:
            settings_row.edition_year = data.editionYear
        settings_row.teasing_start_at = teasing
        settings_row.nomination_start_at = nom_start
        settings_row.nomination_end_at = nom_end
        settings_row.vote_start_at = vote_start
        settings_row.vote_end_at = vote_end
        settings_row.ceremony_session_id = ceremony_session_id
        if data.emailMode is not None:
            settings_row.email_mode = data.emailMode

        settings_row.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(settings_row)
        return self.get_settings()

    # ------------------------------------------------------------------
    # Dashboard card
    # ------------------------------------------------------------------

    def get_dashboard_summary(self, user_id: str) -> Optional[dict]:
        settings = self._get_settings()
        now = datetime.utcnow()
        phase = self._compute_edition_phase(settings, now)
        if phase == "not_started":
            return None

        total_categories = self.db.query(AwardCategory).count()

        if phase == "published":
            latest_pub = self.db.query(func.max(AwardCategory.results_published_at)).scalar()
            if latest_pub and (now - latest_pub) > timedelta(days=30):
                return None
            return {
                "phase": "published",
                "year": settings.edition_year,
                "publishedAt": latest_pub.isoformat() if latest_pub else None,
            }

        if phase == "teasing":
            latest_revealed = self.db.query(AwardCategory).filter(
                AwardCategory.reveal_at.isnot(None), AwardCategory.reveal_at <= now
            ).order_by(AwardCategory.reveal_at.desc()).first()
            return {
                "phase": "teasing",
                "year": settings.edition_year,
                "lastRevealed": {"name": latest_revealed.name, "icon": latest_revealed.icon} if latest_revealed else None,
                "nominationStartAt": settings.nomination_start_at.isoformat() if settings.nomination_start_at else None,
            }

        if phase == "nomination":
            my_count = self.db.query(func.count(func.distinct(AwardNomination.category_id))).filter(
                AwardNomination.proposed_by_user_id == user_id
            ).scalar() or 0
            return {
                "phase": "nomination",
                "year": settings.edition_year,
                "nominationEndAt": settings.nomination_end_at.isoformat() if settings.nomination_end_at else None,
                "nominationCount": my_count,
                "totalCategories": total_categories,
            }

        if phase == "selection":
            return {
                "phase": "selection",
                "year": settings.edition_year,
                "voteStartAt": settings.vote_start_at.isoformat() if settings.vote_start_at else None,
            }

        if phase == "vote":
            my_votes = self.db.query(func.count(AwardVote.id)).filter(AwardVote.voter_user_id == user_id).scalar() or 0
            return {
                "phase": "vote",
                "year": settings.edition_year,
                "voteEndAt": settings.vote_end_at.isoformat() if settings.vote_end_at else None,
                "voteCount": my_votes,
                "totalCategories": total_categories,
            }

        if phase == "ceremony_pending":
            ceremony_session = self.get_settings().ceremonySession
            return {
                "phase": "ceremony_pending",
                "year": settings.edition_year,
                "ceremonySession": ceremony_session.model_dump() if ceremony_session else None,
            }

        return None

    # ------------------------------------------------------------------
    # E-mails (3-position email_mode: off / test / on)
    # ------------------------------------------------------------------

    def _resolve_email_recipients(self, settings: AwardSettings, intended_recipients: List[User]):
        """Applies email_mode to a target recipient list. Returns (recipients, test_mode, test_note)."""
        if settings.email_mode == "off":
            return [], False, ""
        if settings.email_mode == "test":
            super_admins = self.db.query(User).filter(User.status == "active", User.role == "super_admin").all()
            note = f"E-mail de test : en production, il serait envoyé à {len(intended_recipients)} membre(s) actif(s)."
            return super_admins, True, note
        return intended_recipients, False, ""

    def _active_members(self) -> List[User]:
        return self.db.query(User).filter(User.status == "active", User.role != "guest").all()

    def _send_award_phase_email(self, kind: str, settings: AwardSettings) -> dict:
        intended = self._active_members()
        recipients, test_mode, test_note = self._resolve_email_recipients(settings, intended)
        if not recipients:
            return {"sent": 0}

        email_service = ResendEmailService()
        sent = 0
        for user in recipients:
            kwargs = {
                "to_email": user.email,
                "to_name": f"{user.first_name} {user.last_name}",
                "test_mode": test_mode,
                "test_note": test_note,
            }
            if kind == "teasing":
                success = email_service.send_award_teasing_started_email(**kwargs)
            elif kind == "nominations_open":
                kwargs["nomination_end_date"] = settings.nomination_end_at.strftime("%d/%m/%Y à %Hh%M") if settings.nomination_end_at else None
                success = email_service.send_award_nominations_open_email(**kwargs)
            elif kind == "vote_open":
                kwargs["vote_end_date"] = settings.vote_end_at.strftime("%d/%m/%Y à %Hh%M") if settings.vote_end_at else None
                success = email_service.send_award_vote_open_email(**kwargs)
            elif kind == "results_published":
                success = email_service.send_award_results_published_email(**kwargs)
            else:
                success = False
            if success:
                sent += 1
        return {"sent": sent, "mode": settings.email_mode}

    # ------------------------------------------------------------------
    # Cron: teasing/nominations/vote "opened" emails (once) + J-1 vote reminder
    # ------------------------------------------------------------------

    def run_cron_tick(self) -> dict:
        settings = self._get_settings()
        now = datetime.utcnow()
        results: dict = {}

        if settings.email_mode == "off":
            return {"skipped": "email_mode off"}

        if settings.teasing_start_at and now >= settings.teasing_start_at and not settings.teasing_email_sent_at:
            results["teasing"] = self._send_award_phase_email("teasing", settings)
            settings.teasing_email_sent_at = now

        if settings.nomination_start_at and now >= settings.nomination_start_at and not settings.nominations_open_email_sent_at:
            results["nominationsOpen"] = self._send_award_phase_email("nominations_open", settings)
            settings.nominations_open_email_sent_at = now

        if settings.vote_start_at and now >= settings.vote_start_at and not settings.vote_open_email_sent_at:
            results["voteOpen"] = self._send_award_phase_email("vote_open", settings)
            settings.vote_open_email_sent_at = now

        self.db.commit()

        results["reminder"] = self.send_vote_reminder_if_due()
        return results

    def send_vote_reminder_if_due(self) -> dict:
        settings = self._get_settings()
        if not settings.vote_end_at:
            return {"sent": False, "reason": "no vote_end_at configured"}

        now = datetime.utcnow()
        reminder_window_start = settings.vote_end_at - timedelta(hours=24)

        if now < reminder_window_start or now >= settings.vote_end_at:
            return {"sent": False, "reason": "not in J-1 reminder window"}

        if settings.reminder_sent_at and settings.reminder_sent_at >= reminder_window_start:
            return {"sent": False, "reason": "reminder already sent for this window"}

        categories = self.db.query(AwardCategory).all()
        votable_category_ids = [c.id for c in categories if self._compute_status(c, settings, now) == "vote_open"]
        if not votable_category_ids:
            return {"sent": False, "reason": "no category currently open for voting"}

        total_categories = len(votable_category_ids)
        active_users = self._active_members()

        vote_counts = dict(
            self.db.query(AwardVote.voter_user_id, func.count(func.distinct(AwardVote.category_id)))
            .filter(AwardVote.category_id.in_(votable_category_ids))
            .group_by(AwardVote.voter_user_id)
            .all()
        )

        intended = [u for u in active_users if vote_counts.get(u.id, 0) < total_categories]
        recipients, test_mode, test_note = self._resolve_email_recipients(settings, intended)

        email_service = ResendEmailService()
        end_date_str = settings.vote_end_at.strftime("%d/%m/%Y à %Hh%M")
        emails_sent = 0
        for user in recipients:
            success = email_service.send_award_vote_reminder_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                vote_end_date=end_date_str,
                test_mode=test_mode,
                test_note=test_note,
            )
            if success:
                emails_sent += 1

        settings.reminder_sent_at = now
        self.db.commit()

        return {"sent": True, "emailsSent": emails_sent, "totalTargeted": len(intended)}

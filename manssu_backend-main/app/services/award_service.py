from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timedelta

from app.models.award import AwardCategory, AwardNomination, AwardCandidate, AwardVote, AwardSettings
from app.models.user_award import UserAwardWin
from app.models.user import User
from app.models.commission import Commission
from app.schemas.award import (
    NominateRequest,
    NominationStatItem,
    BuildShortlistRequest,
    CandidateResponse,
    VoteRequest,
    CreateCategoryRequest,
    UpdateCategoryRequest,
    CategoryResponse,
    AwardSettingsResponse,
    UpdateAwardSettingsRequest,
)
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.services.email_service import ResendEmailService
from app.services.user_award_service import UserAwardService


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
        """A category still in the raw nomination phase is hidden from regular members until the nomination
        window has actively started. If no window has been configured at all, it stays hidden by default."""
        if not category.nominations_open:
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
            return "vote_closed"
        if vote_start and now < vote_start:
            return "vote_scheduled"
        if not vote_start:
            return "vote_scheduled"
        return "vote_open"

    def _nominee_display(self, user: Optional[User], commission: Optional[Commission]):
        if user:
            return f"{user.first_name} {user.last_name}", user.avatar_url
        if commission:
            return commission.name, None
        return "Inconnu", None

    def _category_to_response(self, category: AwardCategory, user_id: Optional[str] = None, is_admin: bool = False) -> CategoryResponse:
        settings = self._get_settings()
        now = datetime.utcnow()
        status_ = self._compute_status(category, settings, now)

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

        show_results = status_ == "results_published"
        candidates_query = self.db.query(AwardCandidate).options(
            joinedload(AwardCandidate.nominated_user),
            joinedload(AwardCandidate.nominated_commission),
        ).filter(AwardCandidate.category_id == category.id).all()

        candidates = None
        if candidates_query:
            total_votes = sum(c.votes for c in candidates_query) or 0
            candidates = []
            for c in candidates_query:
                name, avatar = self._nominee_display(c.nominated_user, c.nominated_commission)
                candidates.append(CandidateResponse(
                    id=str(c.id),
                    nominatedUserId=str(c.nominated_user_id) if c.nominated_user_id else None,
                    nominatedCommissionId=str(c.nominated_commission_id) if c.nominated_commission_id else None,
                    name=name,
                    avatarUrl=avatar,
                    nominationCount=c.nomination_count,
                    votes=c.votes if show_results else 0,
                    percentage=round((c.votes / total_votes) * 100, 1) if (show_results and total_votes > 0) else 0.0,
                ))

        nomination_count = 0
        if is_admin:
            nomination_count = self.db.query(AwardNomination).filter(AwardNomination.category_id == category.id).count()

        return CategoryResponse(
            id=str(category.id),
            name=category.name,
            description=category.description,
            icon=category.icon,
            targetType=category.target_type,
            status=status_,
            nominationsOpen=category.nominations_open,
            orderIndex=category.order_index,
            myNominations=my_nominations,
            myVote=my_vote,
            candidates=candidates,
            nominationCount=nomination_count,
            resultsPublishedAt=category.results_published_at.isoformat() if category.results_published_at else None,
        )

    # ------------------------------------------------------------------
    # Categories
    # ------------------------------------------------------------------

    def get_categories(self, user_id: Optional[str] = None, is_admin: bool = False, include_hidden: bool = False) -> List[CategoryResponse]:
        settings = self._get_settings()
        now = datetime.utcnow()
        categories = self.db.query(AwardCategory).order_by(AwardCategory.order_index, AwardCategory.created_at).all()
        if not include_hidden:
            categories = [c for c in categories if not self._is_category_hidden_from_members(c, settings, now)]
        return [self._category_to_response(c, user_id=user_id, is_admin=is_admin) for c in categories]

    def get_category(self, category_id: str, user_id: Optional[str] = None, is_admin: bool = False, include_hidden: bool = False) -> Optional[CategoryResponse]:
        category = self.db.query(AwardCategory).filter(AwardCategory.id == category_id).first()
        if not category:
            return None
        if not include_hidden:
            settings = self._get_settings()
            if self._is_category_hidden_from_members(category, settings, datetime.utcnow()):
                return None
        return self._category_to_response(category, user_id=user_id, is_admin=is_admin)

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
        return self._category_to_response(category, is_admin=True)

    def update_category(self, category_id: str, data: UpdateCategoryRequest) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        if data.name is not None:
            category.name = data.name
        if data.description is not None:
            category.description = data.description
        if data.icon is not None:
            category.icon = data.icon
        if data.targetType is not None and data.targetType != category.target_type:
            has_nominations = self.db.query(AwardNomination).filter(AwardNomination.category_id == category_id).count() > 0
            if has_nominations:
                raise ConflictException("Impossible de changer le type de candidat : des nominations existent déjà pour cette catégorie")
            category.target_type = data.targetType
        category.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_admin=True)

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
            target = self.db.query(User).filter(User.id == data.nominatedUserId, User.status == "active").first()
            if not target:
                raise BadRequestException("Membre introuvable ou inactif")
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

        grouped = {}
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
        return self._category_to_response(category, is_admin=True)

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
        return self._category_to_response(category, is_admin=True)

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
        return self._category_to_response(category, is_admin=True)

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
    # Results
    # ------------------------------------------------------------------

    def _record_win_for_category(self, category: AwardCategory, year: int) -> None:
        """Permanently records the win on the winning member's profile, or on the winning commission's page."""
        winner = self.db.query(AwardCandidate).filter(
            AwardCandidate.category_id == category.id
        ).order_by(AwardCandidate.votes.desc()).first()
        if not winner:
            return
        if winner.nominated_user_id or winner.nominated_commission_id:
            UserAwardService(self.db).record_win(
                award_name=category.name,
                award_icon=category.icon,
                year=year,
                user_id=str(winner.nominated_user_id) if winner.nominated_user_id else None,
                commission_id=str(winner.nominated_commission_id) if winner.nominated_commission_id else None,
            )

    def publish_results(self, category_id: str) -> CategoryResponse:
        category = self._get_category_or_404(category_id)
        settings = self._get_settings()
        status_ = self._compute_status(category, settings, datetime.utcnow())
        if status_ != "vote_closed":
            raise BadRequestException("Les résultats ne peuvent être publiés qu'une fois le vote clôturé")
        now = datetime.utcnow()
        category.results_published_at = now
        self._record_win_for_category(category, now.year)
        self.db.commit()
        self.db.refresh(category)
        return self._category_to_response(category, is_admin=True)

    def publish_all_results(self) -> dict:
        settings = self._get_settings()
        now = datetime.utcnow()
        categories = self.db.query(AwardCategory).all()
        published = []
        for category in categories:
            status_ = self._compute_status(category, settings, now)
            if status_ == "vote_closed":
                category.results_published_at = now
                self._record_win_for_category(category, now.year)
                published.append(category)
        self.db.commit()

        if published:
            self._send_results_email_to_all_active_members()

        return {
            "publishedCount": len(published),
            "publishedCategoryIds": [str(c.id) for c in published],
        }

    def _send_results_email_to_all_active_members(self):
        email_service = ResendEmailService()
        active_users = self.db.query(User).filter(User.status == "active", User.role != "guest").all()
        for user in active_users:
            email_service.send_award_results_published_email(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
            )

    # ------------------------------------------------------------------
    # Full reset (testing / re-running the whole process from scratch)
    # ------------------------------------------------------------------

    def reset_all(self) -> dict:
        """Wipes all nominations, candidates and votes, and resets every category and the global settings
        to their initial state. Destructive and irreversible - super admin only."""
        votes_deleted = self.db.query(AwardVote).delete()
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
        })

        settings_row = self._get_settings()
        settings_row.nomination_start_at = None
        settings_row.nomination_end_at = None
        settings_row.vote_start_at = None
        settings_row.vote_end_at = None
        settings_row.reminder_sent_at = None

        self.db.commit()

        return {
            "votesDeleted": votes_deleted,
            "candidatesDeleted": candidates_deleted,
            "nominationsDeleted": nominations_deleted,
            "winsDeleted": wins_deleted,
        }

    # ------------------------------------------------------------------
    # Global vote window settings
    # ------------------------------------------------------------------

    def get_settings(self) -> AwardSettingsResponse:
        settings_row = self._get_settings()
        return AwardSettingsResponse(
            nominationStartAt=settings_row.nomination_start_at.isoformat() if settings_row.nomination_start_at else None,
            nominationEndAt=settings_row.nomination_end_at.isoformat() if settings_row.nomination_end_at else None,
            voteStartAt=settings_row.vote_start_at.isoformat() if settings_row.vote_start_at else None,
            voteEndAt=settings_row.vote_end_at.isoformat() if settings_row.vote_end_at else None,
        )

    def update_settings(self, data: UpdateAwardSettingsRequest) -> AwardSettingsResponse:
        settings_row = self._get_settings()
        if data.nominationStartAt is not None:
            settings_row.nomination_start_at = data.nominationStartAt
        if data.nominationEndAt is not None:
            settings_row.nomination_end_at = data.nominationEndAt
        if data.voteStartAt is not None:
            settings_row.vote_start_at = data.voteStartAt
        if data.voteEndAt is not None:
            settings_row.vote_end_at = data.voteEndAt
        settings_row.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(settings_row)
        return self.get_settings()

    # ------------------------------------------------------------------
    # Cron: J-1 vote reminder
    # ------------------------------------------------------------------

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
        active_users = self.db.query(User).filter(User.status == "active", User.role != "guest").all()

        vote_counts = dict(
            self.db.query(AwardVote.voter_user_id, func.count(func.distinct(AwardVote.category_id)))
            .filter(AwardVote.category_id.in_(votable_category_ids))
            .group_by(AwardVote.voter_user_id)
            .all()
        )

        email_service = ResendEmailService()
        end_date_str = settings.vote_end_at.strftime("%d/%m/%Y à %Hh%M")
        emails_sent = 0
        for user in active_users:
            voted_count = vote_counts.get(user.id, 0)
            if voted_count < total_categories:
                success = email_service.send_award_vote_reminder_email(
                    to_email=user.email,
                    to_name=f"{user.first_name} {user.last_name}",
                    vote_end_date=end_date_str,
                )
                if success:
                    emails_sent += 1

        settings.reminder_sent_at = now
        self.db.commit()

        return {"sent": True, "emailsSent": emails_sent, "totalTargeted": len(active_users)}

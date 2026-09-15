# PERMANENT SERVICE — see app/models/user_award.py
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.user_award import UserAwardWin
from app.schemas.user_award import UserAwardWinResponse


class UserAwardService:
    def __init__(self, db: Session):
        self.db = db

    def _to_response(self, w: UserAwardWin) -> UserAwardWinResponse:
        return UserAwardWinResponse(
            id=str(w.id),
            awardName=w.award_name,
            awardIcon=w.award_icon,
            year=w.year,
            awardedAt=w.awarded_at.isoformat() if w.awarded_at else None,
        )

    def get_wins_for_user(self, user_id: str) -> List[UserAwardWinResponse]:
        wins = self.db.query(UserAwardWin).filter(UserAwardWin.user_id == user_id).order_by(
            UserAwardWin.year.desc(), UserAwardWin.awarded_at.desc()
        ).all()
        return [self._to_response(w) for w in wins]

    def get_wins_for_commission(self, commission_id: str) -> List[UserAwardWinResponse]:
        wins = self.db.query(UserAwardWin).filter(UserAwardWin.commission_id == commission_id).order_by(
            UserAwardWin.year.desc(), UserAwardWin.awarded_at.desc()
        ).all()
        return [self._to_response(w) for w in wins]

    def record_win(
        self,
        award_name: str,
        award_icon: Optional[str],
        year: int,
        user_id: Optional[str] = None,
        commission_id: Optional[str] = None,
    ) -> None:
        """Idempotent: won't duplicate if a win with the same name/year is already recorded for this target.
        Exactly one of user_id/commission_id must be provided."""
        query = self.db.query(UserAwardWin).filter(
            UserAwardWin.award_name == award_name,
            UserAwardWin.year == year,
        )
        if user_id:
            query = query.filter(UserAwardWin.user_id == user_id)
        else:
            query = query.filter(UserAwardWin.commission_id == commission_id)
        if query.first():
            return

        self.db.add(UserAwardWin(
            user_id=user_id,
            commission_id=commission_id,
            award_name=award_name,
            award_icon=award_icon,
            year=year,
        ))

# PERMANENT MODEL — do not delete when the temporary Awards feature (app/models/award.py,
# app/services/award_service.py, app/api/v1/awards.py) is removed after the event.
# Award wins are a permanent achievement record shown on a member's profile, or on a
# commission's page for a collective prize. Exactly one of user_id/commission_id is set.
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class UserAwardWin(Base):
    __tablename__ = "user_award_wins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    commission_id = Column(UUID(as_uuid=True), ForeignKey("commissions.id", ondelete="CASCADE"), nullable=True, index=True)
    award_name = Column(String(255), nullable=False)
    award_icon = Column(String(10), nullable=True)
    year = Column(Integer, nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="award_wins")
    commission = relationship("Commission", backref="award_wins")

    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL AND commission_id IS NULL) OR (user_id IS NULL AND commission_id IS NOT NULL)",
            name="ck_award_win_single_target",
        ),
    )

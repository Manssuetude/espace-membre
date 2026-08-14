from app.database import Base

# Import all models so Alembic can detect them
from app.models.user import User
from app.models.otp import OTP
from app.models.theme import Theme, ThemeProposalWindow
from app.models.location import Location
from app.models.session import Session, SessionObjective, SessionRegistration
from app.models.work_group import WorkGroup, WorkGroupMember
from app.models.resource import Resource
from app.models.poll import Poll, PollQuestion, PollOption, PollVote
from app.models.feedback import Feedback
from app.models.session_invite import SessionInvite
from app.models.invitation_request import InvitationRequest
from app.models.activity_template import ActivityTemplate
from app.models.commission import Commission, CommissionMember, CommissionApplication
from app.models.library import (
    Book,
    BookRequest,
    BookLoan,
    BookWishlistItem,
    BookNotification,
)

__all__ = [
    "Base",
    "User",
    "OTP",
    "Theme",
    "ThemeProposalWindow",
    "Location",
    "Session",
    "SessionObjective",
    "SessionRegistration",
    "WorkGroup",
    "WorkGroupMember",
    "Resource",
    "Poll",
    "PollQuestion",
    "PollOption",
    "PollVote",
    "Feedback",
    "SessionInvite",
    "InvitationRequest",
    "ActivityTemplate",
    "Commission",
    "CommissionMember",
    "CommissionApplication",
    "Book",
    "BookRequest",
    "BookLoan",
    "BookWishlistItem",
    "BookNotification",
]

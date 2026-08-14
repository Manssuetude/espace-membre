# Common schemas
from app.schemas.common import (
    APIResponse,
    PaginatedResponse,
    Location,
    ErrorResponse,
)

# Auth schemas
from app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    TokenResponse,
    UserInfo,
    LogoutResponse,
)

# User schemas
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserSummary,
)

# Session schemas
from app.schemas.session import (
    SessionBase,
    CreateSessionRequest,
    UpdateSessionRequest,
    SessionResponse,
    SessionDetailResponse,
    WorkGroupCreateRequest,
    WorkGroupResponse,
)

# Theme schemas
from app.schemas.theme import (
    ThemeBase,
    CreateThemeRequest,
    UpdateThemeRequest,
    ThemeResponse,
    ThemeWindowStatusResponse,
    OpenWindowRequest,
    ExtendWindowRequest,
    ThemeWindowResponse,
)

# Location schemas
from app.schemas.location import (
    LocationBase,
    CreateLocationRequest,
    UpdateLocationRequest,
    LocationResponse,
)

# Resource schemas
from app.schemas.resource import (
    ResourceBase,
    CreateResourceRequest,
    UpdateResourceRequest,
    ResourceResponse,
)

# Poll schemas
from app.schemas.poll import (
    PollBase,
    PollOptionBase,
    PollOptionCreate,
    PollOptionResponse,
    CreatePollRequest,
    UpdatePollRequest,
    PollResponse,
    VoteRequest,
    VoteResponse,
)

# Feedback schemas
from app.schemas.feedback import (
    FeedbackBase,
    CreateFeedbackRequest,
    UpdateFeedbackRequest,
    FeedbackResponse,
)

# Activity Template schemas
from app.schemas.activity_template import (
    ActivityTemplateBase,
    CreateActivityTemplateRequest,
    UpdateActivityTemplateRequest,
    ActivityTemplateResponse,
)

# Commission schemas
from app.schemas.commission import (
    CreateCommissionRequest,
    UpdateCommissionRequest,
    AssignLeaderRequest,
    CommissionSummaryResponse,
    CommissionDetailResponse,
    CommissionMemberResponse,
    CreateApplicationRequest,
    RejectApplicationRequest,
    ApplicationResponse,
    MyApplicationResponse,
    MyCommissionResponse,
)

__all__ = [
    # Common
    "APIResponse",
    "PaginatedResponse",
    "Location",
    "ErrorResponse",
    # Auth
    "SendOTPRequest",
    "SendOTPResponse",
    "VerifyOTPRequest",
    "VerifyOTPResponse",
    "TokenResponse",
    "UserInfo",
    "LogoutResponse",
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserSummary",
    # Session
    "SessionBase",
    "CreateSessionRequest",
    "UpdateSessionRequest",
    "SessionResponse",
    "SessionDetailResponse",
    "WorkGroupCreateRequest",
    "WorkGroupResponse",
    # Theme
    "ThemeBase",
    "CreateThemeRequest",
    "UpdateThemeRequest",
    "ThemeResponse",
    "ThemeWindowStatusResponse",
    "OpenWindowRequest",
    "ExtendWindowRequest",
    "ThemeWindowResponse",
    # Location
    "LocationBase",
    "CreateLocationRequest",
    "UpdateLocationRequest",
    "LocationResponse",
    # Resource
    "ResourceBase",
    "CreateResourceRequest",
    "UpdateResourceRequest",
    "ResourceResponse",
    # Poll
    "PollBase",
    "PollOptionBase",
    "PollOptionCreate",
    "PollOptionResponse",
    "CreatePollRequest",
    "UpdatePollRequest",
    "PollResponse",
    "VoteRequest",
    "VoteResponse",
    # Feedback
    "FeedbackBase",
    "CreateFeedbackRequest",
    "UpdateFeedbackRequest",
    "FeedbackResponse",
    # Activity Template
    "ActivityTemplateBase",
    "CreateActivityTemplateRequest",
    "UpdateActivityTemplateRequest",
    "ActivityTemplateResponse",
    # Commission
    "CreateCommissionRequest",
    "UpdateCommissionRequest",
    "AssignLeaderRequest",
    "CommissionSummaryResponse",
    "CommissionDetailResponse",
    "CommissionMemberResponse",
    "CreateApplicationRequest",
    "RejectApplicationRequest",
    "ApplicationResponse",
    "MyApplicationResponse",
    "MyCommissionResponse",
]


from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime


class NominateRequest(BaseModel):
    """Schema for a member proposing a candidate in a category"""
    nominatedUserId: Optional[str] = Field(None, alias="nominated_user_id")
    nominatedCommissionId: Optional[str] = Field(None, alias="nominated_commission_id")

    class Config:
        populate_by_name = True

    @model_validator(mode="after")
    def validate_single_target(self):
        if bool(self.nominatedUserId) == bool(self.nominatedCommissionId):
            raise ValueError("Exactement un candidat (membre ou commission) doit être proposé")
        return self


class NominationStatItem(BaseModel):
    """One distinct nominee in a category with aggregated nomination stats (admin curation view)"""
    nominatedUserId: Optional[str] = Field(None, alias="nominated_user_id")
    nominatedCommissionId: Optional[str] = Field(None, alias="nominated_commission_id")
    name: str
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    count: int
    proposedBy: List[str] = Field(default_factory=list, alias="proposed_by")

    class Config:
        populate_by_name = True


class BuildShortlistRequest(BaseModel):
    """Schema for admin finalizing the shortlist of a category from nomination stats"""
    candidates: List[NominateRequest]


class CandidateResponse(BaseModel):
    id: str
    nominatedUserId: Optional[str] = Field(None, alias="nominated_user_id")
    nominatedCommissionId: Optional[str] = Field(None, alias="nominated_commission_id")
    name: str
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    nominationCount: int = Field(0, alias="nomination_count")
    votes: int = 0
    percentage: float = 0.0

    class Config:
        from_attributes = True
        populate_by_name = True


class VoteRequest(BaseModel):
    candidateId: str = Field(..., alias="candidate_id")

    class Config:
        populate_by_name = True


class CreateCategoryRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    targetType: str = Field("member", alias="target_type")  # member, commission
    orderIndex: int = Field(0, alias="order_index")

    class Config:
        populate_by_name = True


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    targetType: Optional[str] = Field(None, alias="target_type")

    class Config:
        populate_by_name = True


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    targetType: str = Field(..., alias="target_type")
    status: str  # nomination, curation, vote_scheduled, vote_open, vote_closed, results_published
    nominationsOpen: bool = Field(..., alias="nominations_open")
    orderIndex: int = Field(0, alias="order_index")
    myNominations: List[NominationStatItem] = Field(default_factory=list, alias="my_nominations")
    myVote: Optional[str] = Field(None, alias="my_vote")
    candidates: Optional[List[CandidateResponse]] = None
    nominationCount: int = Field(0, alias="nomination_count")  # total raw proposals received (admin visibility)
    resultsPublishedAt: Optional[str] = Field(None, alias="results_published_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class AwardSettingsResponse(BaseModel):
    nominationStartAt: Optional[str] = Field(None, alias="nomination_start_at")
    nominationEndAt: Optional[str] = Field(None, alias="nomination_end_at")
    voteStartAt: Optional[str] = Field(None, alias="vote_start_at")
    voteEndAt: Optional[str] = Field(None, alias="vote_end_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class UpdateAwardSettingsRequest(BaseModel):
    nominationStartAt: Optional[datetime] = Field(None, alias="nomination_start_at")
    nominationEndAt: Optional[datetime] = Field(None, alias="nomination_end_at")
    voteStartAt: Optional[datetime] = Field(None, alias="vote_start_at")
    voteEndAt: Optional[datetime] = Field(None, alias="vote_end_at")

    class Config:
        populate_by_name = True

from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Literal
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
    """One distinct nominee in a category with aggregated nomination stats (organizer curation view)"""
    nominatedUserId: Optional[str] = Field(None, alias="nominated_user_id")
    nominatedCommissionId: Optional[str] = Field(None, alias="nominated_commission_id")
    name: str
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    count: int
    proposedBy: List[str] = Field(default_factory=list, alias="proposed_by")
    suggested: bool = False  # top 3 by count
    tieAtCutoff: bool = Field(False, alias="tie_at_cutoff")  # 3rd and 4th place tied on count

    class Config:
        populate_by_name = True


class BuildShortlistRequest(BaseModel):
    """Schema for an organizer finalizing the shortlist of a category from nomination stats"""
    candidates: List[NominateRequest]


class CandidateResponse(BaseModel):
    id: str
    nominatedUserId: Optional[str] = Field(None, alias="nominated_user_id")
    nominatedCommissionId: Optional[str] = Field(None, alias="nominated_commission_id")
    name: str
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    nominationCount: Optional[int] = Field(None, alias="nomination_count")
    votes: Optional[int] = None
    percentage: Optional[float] = None

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
    revealAt: Optional[datetime] = Field(None, alias="reveal_at")

    class Config:
        populate_by_name = True


class CeremonySessionInfo(BaseModel):
    id: str
    title: str
    date: str
    startTime: Optional[str] = Field(None, alias="start_time")
    location: Optional[str] = None

    class Config:
        populate_by_name = True


class CategoryResponse(BaseModel):
    id: str
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    targetType: str = Field(..., alias="target_type")
    # nomination, curation, vote_scheduled, vote_open, awaiting_ceremony, results_published
    status: str
    nominationsOpen: bool = Field(..., alias="nominations_open")
    orderIndex: int = Field(0, alias="order_index")
    myNominations: List[NominationStatItem] = Field(default_factory=list, alias="my_nominations")
    myVote: Optional[str] = Field(None, alias="my_vote")
    candidates: Optional[List[CandidateResponse]] = None
    finalists: Optional[List[CandidateResponse]] = None  # same candidates, scores stripped, for non-organizers
    winners: Optional[List[CandidateResponse]] = None
    isCoWinner: bool = Field(False, alias="is_co_winner")
    ceremonyOrder: Optional[int] = Field(None, alias="ceremony_order")
    nominationCount: int = Field(0, alias="nomination_count")  # total raw proposals received (organizer visibility)
    resultsPublishedAt: Optional[str] = Field(None, alias="results_published_at")
    # Teasing
    revealed: Optional[bool] = None
    revealAt: Optional[str] = Field(None, alias="reveal_at")
    revealNumber: Optional[int] = Field(None, alias="reveal_number")
    isNew: bool = Field(False, alias="is_new")

    class Config:
        from_attributes = True
        populate_by_name = True


class AwardSettingsResponse(BaseModel):
    editionYear: int = Field(..., alias="edition_year")
    teasingStartAt: Optional[str] = Field(None, alias="teasing_start_at")
    nominationStartAt: Optional[str] = Field(None, alias="nomination_start_at")
    nominationEndAt: Optional[str] = Field(None, alias="nomination_end_at")
    voteStartAt: Optional[str] = Field(None, alias="vote_start_at")
    voteEndAt: Optional[str] = Field(None, alias="vote_end_at")
    ceremonySession: Optional[CeremonySessionInfo] = Field(None, alias="ceremony_session")
    emailMode: str = Field("off", alias="email_mode")  # off, test, on

    class Config:
        from_attributes = True
        populate_by_name = True


class UpdateAwardSettingsRequest(BaseModel):
    editionYear: Optional[int] = Field(None, alias="edition_year")
    teasingStartAt: Optional[datetime] = Field(None, alias="teasing_start_at")
    nominationStartAt: Optional[datetime] = Field(None, alias="nomination_start_at")
    nominationEndAt: Optional[datetime] = Field(None, alias="nomination_end_at")
    voteStartAt: Optional[datetime] = Field(None, alias="vote_start_at")
    voteEndAt: Optional[datetime] = Field(None, alias="vote_end_at")
    ceremonySessionId: Optional[str] = Field(None, alias="ceremony_session_id")
    emailMode: Optional[Literal["off", "test", "on"]] = Field(None, alias="email_mode")

    class Config:
        populate_by_name = True


class DistributeRevealsResponse(BaseModel):
    updatedCount: int = Field(..., alias="updated_count")

    class Config:
        populate_by_name = True


class TieBreakResolution(BaseModel):
    mode: Literal["co_winners", "winner"]
    candidateId: Optional[str] = Field(None, alias="candidate_id")

    class Config:
        populate_by_name = True

    @model_validator(mode="after")
    def validate_winner_has_candidate(self):
        if self.mode == "winner" and not self.candidateId:
            raise ValueError("candidateId requis quand mode = winner")
        return self


class SaveCeremonyPreparationRequest(BaseModel):
    order: List[str]
    resolutions: dict[str, TieBreakResolution] = Field(default_factory=dict)


class PreparationCandidate(BaseModel):
    id: str
    name: str
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    votes: int

    class Config:
        populate_by_name = True


class PreparationCategoryItem(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    ceremonyOrder: int = Field(..., alias="ceremony_order")
    candidates: List[PreparationCandidate]
    tie: bool
    resolution: Optional[TieBreakResolution] = None

    class Config:
        populate_by_name = True


class CeremonyCategoryItem(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    description: Optional[str] = None
    ceremonyOrder: int = Field(..., alias="ceremony_order")
    finalists: List[PreparationCandidate]
    winners: List[PreparationCandidate]
    isCoWinner: bool = Field(False, alias="is_co_winner")

    class Config:
        populate_by_name = True

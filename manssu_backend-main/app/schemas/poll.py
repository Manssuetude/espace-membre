from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Union
from datetime import date


class PollOptionBase(BaseModel):
    """Base poll option schema"""
    label: str
    color: Optional[str] = None  # primary, accent, secondary, success


class PollOptionCreate(PollOptionBase):
    """Schema for creating a poll option"""
    pass


class PollOptionResponse(PollOptionBase):
    """Schema for poll option response"""
    id: str
    votes: int = 0
    percentage: float = 0.0
    orderIndex: int = Field(0, alias="order_index")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class PollQuestionBase(BaseModel):
    """Base poll question schema"""
    question: str
    description: Optional[str] = None
    singleResponse: bool = True  # Whether this question allows single or multiple responses
    options: List[PollOptionCreate]
    
    class Config:
        populate_by_name = True


class PollQuestionCreate(PollQuestionBase):
    """Schema for creating a poll question"""
    pass


class PollQuestionResponse(BaseModel):
    """Schema for poll question response"""
    id: str
    question: str
    description: Optional[str] = None
    singleResponse: bool = Field(True, alias="single_response")  # Whether this question allows single or multiple responses
    orderIndex: int = Field(0, alias="order_index")
    options: Optional[List[PollOptionResponse]] = None
    userVote: Optional[Union[dict, List[dict]]] = Field(None, alias="user_vote")  # User's vote(s) for this question
    
    class Config:
        from_attributes = True
        populate_by_name = True


class PollBase(BaseModel):
    """Base poll schema"""
    title: str
    description: Optional[str] = None
    questions: List[PollQuestionCreate]  # List of questions, each with their own options and singleResponse setting
    resultsVisibility: str = Field("realtime", alias="results_visibility")  # realtime, hidden
    anonymous: bool = False
    endDate: Optional[date] = Field(None, alias="end_date")
    sessionId: Optional[str] = Field(None, alias="session_id")
    
    class Config:
        populate_by_name = True


class CreatePollRequest(PollBase):
    """Schema for creating a poll"""
    startDate: date = Field(..., alias="start_date")
    
    class Config:
        populate_by_name = True


class UpdatePollRequest(BaseModel):
    """Schema for updating a poll"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    resultsVisibility: Optional[str] = Field(None, alias="results_visibility")
    endDate: Optional[date] = Field(None, alias="end_date")
    
    class Config:
        populate_by_name = True


class PollResponse(BaseModel):
    """Schema for poll response"""
    id: str
    title: str
    description: Optional[str] = None
    status: str
    totalResponses: int = Field(0, alias="total_responses")
    totalMembers: int = Field(0, alias="total_members")
    participation: Optional[float] = None
    resultsVisibility: str = Field(..., alias="results_visibility")
    anonymous: bool
    startDate: str = Field(..., alias="start_date")
    endDate: Optional[str] = Field(None, alias="end_date")
    daysLeft: Optional[int] = Field(None, alias="days_left")
    questions: Optional[List[PollQuestionResponse]] = None  # List of questions with their options and singleResponse settings
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    
    class Config:
        from_attributes = True
        populate_by_name = True


class PollDetailResponse(PollResponse):
    """Schema for detailed poll response with voters"""
    voters: Optional[List[dict]] = None  # Array of voters, each with their answered questions: [{voter, questions: [{questionId, question, options}]}]


class SingleVoteRequest(BaseModel):
    """Schema for a single vote on a poll question"""
    questionId: str = Field(..., alias="question_id", description="ID of the question being voted on")
    optionId: Optional[str] = Field(None, alias="option_id", description="Single option ID (for single response polls)")
    optionIds: Optional[List[str]] = Field(None, alias="option_ids", description="Multiple option IDs (for multiple response polls)")
    
    class Config:
        populate_by_name = True
    
    @model_validator(mode='after')
    def validate_at_least_one_option(self):
        """Validate that either optionId or optionIds is provided"""
        if not self.optionId and not self.optionIds:
            raise ValueError("Either optionId or optionIds must be provided")
        return self


class VoteRequest(BaseModel):
    """Schema for voting on a poll - accepts array of votes for multiple questions"""
    votes: List[SingleVoteRequest] = Field(..., description="Array of votes, one per question")
    
    class Config:
        populate_by_name = True


class SingleVoteResponse(BaseModel):
    """Schema for a single vote response"""
    questionId: str = Field(..., alias="question_id")
    optionId: Optional[str] = Field(None, alias="option_id", description="Single option ID (if single vote)")
    optionIds: Optional[List[str]] = Field(None, alias="option_ids", description="Multiple option IDs (if multiple votes)")
    
    class Config:
        populate_by_name = True


class VoteResponse(BaseModel):
    """Schema for vote response"""
    message: str
    pollId: str = Field(..., alias="poll_id")
    votes: List[SingleVoteResponse] = Field(..., description="Array of vote responses, one per question")
    
    class Config:
        populate_by_name = True


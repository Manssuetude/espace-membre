from datetime import date, datetime
from typing import List, Optional, Literal, Union

from pydantic import BaseModel, Field, model_validator


QuestionType = Literal[
    "single_choice",
    "multiple_choice",
    "text",
    "rating",
    "number",
    "date",
]


class QuestionnaireOptionBase(BaseModel):
    label: str
    value: Optional[str] = None
    orderIndex: int = Field(0, alias="order_index")

    class Config:
        populate_by_name = True


class QuestionnaireOptionCreate(QuestionnaireOptionBase):
    pass


class QuestionnaireOptionResponse(QuestionnaireOptionBase):
    id: str

    class Config:
        from_attributes = True
        populate_by_name = True


class QuestionnaireQuestionBase(BaseModel):
    question: str
    description: Optional[str] = None
    type: QuestionType = "single_choice"
    required: bool = False
    orderIndex: int = Field(0, alias="order_index")

    class Config:
        populate_by_name = True


class QuestionnaireQuestionCreate(QuestionnaireQuestionBase):
    options: Optional[List[QuestionnaireOptionCreate]] = None

    @model_validator(mode="after")
    def validate_options_for_choice_types(self):
        if self.type in ("single_choice", "multiple_choice") and not self.options:
            raise ValueError("Choice questions must have at least one option")
        return self


class QuestionnaireQuestionUpsert(QuestionnaireQuestionBase):
    """Used when updating a questionnaire to add/update/remove questions."""
    id: Optional[str] = None
    options: Optional[List[QuestionnaireOptionCreate]] = None


class QuestionnaireQuestionResponse(QuestionnaireQuestionBase):
    id: str
    options: Optional[List[QuestionnaireOptionResponse]] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class QuestionnaireBase(BaseModel):
    title: str
    description: Optional[str] = None
    startDate: Optional[date] = Field(None, alias="start_date")
    endDate: Optional[date] = Field(None, alias="end_date")
    editWindowMinutes: Optional[int] = Field(None, alias="edit_window_minutes")

    class Config:
        populate_by_name = True


class CreateQuestionnaireRequest(QuestionnaireBase):
    questions: List[QuestionnaireQuestionCreate]


class UpdateQuestionnaireRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # draft, published, closed
    startDate: Optional[date] = Field(None, alias="start_date")
    endDate: Optional[date] = Field(None, alias="end_date")
    editWindowMinutes: Optional[int] = Field(None, alias="edit_window_minutes")
    questions: Optional[List[QuestionnaireQuestionUpsert]] = None

    class Config:
        populate_by_name = True


class QuestionnaireSummaryResponse(QuestionnaireBase):
    id: str
    status: str
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")
    # Whether the current user has submitted or started a response (for member views)
    hasResponse: Optional[bool] = Field(None, alias="has_response")
    isSubmitted: Optional[bool] = Field(None, alias="is_submitted")
    # Total number of responses (submitted) for this questionnaire
    totalResponses: Optional[int] = Field(None, alias="total_responses")

    class Config:
        from_attributes = True
        populate_by_name = True


class QuestionnaireDetailResponse(QuestionnaireSummaryResponse):
    questions: List[QuestionnaireQuestionResponse]


# Answer payloads
class SingleChoiceAnswer(BaseModel):
    optionId: str = Field(..., alias="option_id")

    class Config:
        populate_by_name = True


class MultipleChoiceAnswer(BaseModel):
    optionIds: List[str] = Field(..., alias="option_ids")

    class Config:
        populate_by_name = True


class TextAnswer(BaseModel):
    text: str


class RatingAnswer(BaseModel):
    rating: int


class NumberAnswer(BaseModel):
    number: float


class DateAnswer(BaseModel):
    date: str  # ISO date string


AnswerPayload = Union[
    SingleChoiceAnswer,
    MultipleChoiceAnswer,
    TextAnswer,
    RatingAnswer,
    NumberAnswer,
    DateAnswer,
]


class QuestionAnswerRequest(BaseModel):
    questionId: str = Field(..., alias="question_id")
    type: QuestionType
    answer: AnswerPayload

    class Config:
        populate_by_name = True


class SubmitQuestionnaireAnswersRequest(BaseModel):
    answers: List[QuestionAnswerRequest]
    submit: bool = True  # if false, keep as in_progress draft


class QuestionAnswerResponse(BaseModel):
    questionId: str = Field(..., alias="question_id")
    type: QuestionType
    answer: Optional[dict] = None  # raw answer JSON, already validated on write

    class Config:
        populate_by_name = True


class QuestionnaireResponseSummary(BaseModel):
    id: str
    questionnaireId: str = Field(..., alias="questionnaire_id")
    userId: str = Field(..., alias="user_id")
    status: str
    createdAt: Optional[str] = Field(None, alias="created_at")
    submittedAt: Optional[str] = Field(None, alias="submitted_at")
    editUntil: Optional[str] = Field(None, alias="edit_until")

    class Config:
        from_attributes = True
        populate_by_name = True


class QuestionnaireResponseDetail(QuestionnaireResponseSummary):
    answers: List[QuestionAnswerResponse]



from sqlalchemy import Column, String, Boolean, Date, DateTime, ForeignKey, Text, Index, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Lifecycle and scheduling
    status = Column(String(20), nullable=False, default="draft", index=True)  # draft, published, closed
    start_date = Column(Date, nullable=True)  # optional start date; if null, active immediately on publish
    end_date = Column(Date, nullable=True)  # optional end date; after this, questionnaire is effectively closed

    # How long a user can edit answers after first submission (in minutes)
    edit_window_minutes = Column(Integer, nullable=True)  # if null, use default (e.g. 60) in service

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    questions = relationship(
        "QuestionnaireQuestion",
        back_populates="questionnaire",
        cascade="all, delete-orphan",
        order_by="QuestionnaireQuestion.order_index",
    )
    responses = relationship(
        "QuestionnaireResponse",
        back_populates="questionnaire",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_questionnaires_status", "status"),
        Index("idx_questionnaires_start_end", "start_date", "end_date"),
    )


class QuestionnaireQuestion(Base):
    __tablename__ = "questionnaire_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    questionnaire_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questionnaires.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question = Column(Text, nullable=False)
    description = Column(Text, nullable=True)

    # Question type controls how answers are interpreted.
    # Supported types (extensible): single_choice, multiple_choice, text, rating, number, date
    type = Column(String(30), nullable=False, default="single_choice")

    # Whether answering this question is mandatory
    required = Column(Boolean, default=False)

    order_index = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    questionnaire = relationship("Questionnaire", back_populates="questions")
    options = relationship(
        "QuestionnaireOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionnaireOption.order_index",
    )
    answers = relationship(
        "QuestionnaireAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_questionnaire_questions_questionnaire", "questionnaire_id"),
    )


class QuestionnaireOption(Base):
    __tablename__ = "questionnaire_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questionnaire_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    label = Column(String(255), nullable=False)
    value = Column(String(255), nullable=True)  # optional internal value/code
    order_index = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("QuestionnaireQuestion", back_populates="options")

    __table_args__ = (
        Index("idx_questionnaire_options_question", "question_id"),
    )


class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    questionnaire_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questionnaires.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default="in_progress",
        index=True,
    )  # in_progress, submitted

    created_at = Column(DateTime, default=datetime.utcnow)
    submitted_at = Column(DateTime, nullable=True)

    # Last time the user is allowed to edit this response
    edit_until = Column(DateTime, nullable=True)

    questionnaire = relationship("Questionnaire", back_populates="responses")
    user = relationship("User", back_populates="questionnaire_responses")
    answers = relationship(
        "QuestionnaireAnswer",
        back_populates="response",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index(
            "idx_questionnaire_responses_unique_user",
            "questionnaire_id",
            "user_id",
            unique=True,
        ),
    )


class QuestionnaireAnswer(Base):
    __tablename__ = "questionnaire_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    response_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questionnaire_responses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("questionnaire_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Generic answer payload, shape depends on question.type:
    # - single_choice: {"optionId": "..."}
    # - multiple_choice: {"optionIds": ["...", "..."]}
    # - text: {"text": "..."}
    # - rating: {"rating": 4}
    # - number: {"number": 123}
    # - date: {"date": "2026-01-28"}
    answer = Column(JSONB, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    response = relationship("QuestionnaireResponse", back_populates="answers")
    question = relationship("QuestionnaireQuestion", back_populates="answers")

    __table_args__ = (
        Index(
            "idx_questionnaire_answers_unique",
            "response_id",
            "question_id",
            unique=True,
        ),
    )



from datetime import date, datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.questionnaire import (
    Questionnaire,
    QuestionnaireQuestion,
    QuestionnaireOption,
    QuestionnaireResponse,
    QuestionnaireAnswer,
)
from app.models.user import User
from app.services.email_service import ResendEmailService
from app.schemas.questionnaire import (
    CreateQuestionnaireRequest,
    UpdateQuestionnaireRequest,
    QuestionnaireSummaryResponse,
    QuestionnaireDetailResponse,
    SubmitQuestionnaireAnswersRequest,
    QuestionAnswerRequest,
    QuestionAnswerResponse,
    QuestionnaireResponseSummary,
    QuestionnaireResponseDetail,
)
from app.schemas.common import PaginatedResponse


DEFAULT_EDIT_WINDOW_MINUTES = 1440  # 24 hours


class QuestionnaireService:
    def __init__(self, db: Session):
        self.db = db

    # --- Admin: questionnaire management ---

    def get_questionnaires(
        self,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        current_user_id: Optional[str] = None,
    ) -> PaginatedResponse[QuestionnaireSummaryResponse]:
        query = self.db.query(Questionnaire)

        if status and status != "all":
            query = query.filter(Questionnaire.status == status)

        total = query.count()
        offset = (page - 1) * limit
        questionnaires = (
            query.order_by(Questionnaire.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        # Preload responses for current user if provided
        responses_by_questionnaire = {}
        if current_user_id:
            user_uuid = current_user_id
            responses = (
                self.db.query(QuestionnaireResponse)
                .filter(
                    and_(
                        QuestionnaireResponse.user_id == user_uuid,
                        QuestionnaireResponse.questionnaire_id.in_(
                            [q.id for q in questionnaires]
                        ),
                    )
                )
                .all()
            )
            for resp in responses:
                responses_by_questionnaire[str(resp.questionnaire_id)] = resp

        # Batch calculate total responses (submitted) for all questionnaires
        questionnaire_ids = [q.id for q in questionnaires]
        response_counts = {}
        if questionnaire_ids:
            from sqlalchemy import func
            counts_data = (
                self.db.query(
                    QuestionnaireResponse.questionnaire_id,
                    func.count(QuestionnaireResponse.id).label('count')
                )
                .filter(
                    and_(
                        QuestionnaireResponse.questionnaire_id.in_(questionnaire_ids),
                        QuestionnaireResponse.status == "submitted"
                    )
                )
                .group_by(QuestionnaireResponse.questionnaire_id)
                .all()
            )
            response_counts = {str(q_id): count for q_id, count in counts_data}

        items: List[QuestionnaireSummaryResponse] = []
        for q in questionnaires:
            key = str(q.id)
            user_resp = responses_by_questionnaire.get(key)
            items.append(
                QuestionnaireSummaryResponse(
                    id=str(q.id),
                    title=q.title,
                    description=q.description,
                    status=q.status,
                    startDate=q.start_date,
                    endDate=q.end_date,
                    editWindowMinutes=q.edit_window_minutes,
                    createdAt=q.created_at.isoformat() if q.created_at else None,
                    updatedAt=q.updated_at.isoformat() if q.updated_at else None,
                    hasResponse=user_resp is not None,
                    isSubmitted=user_resp.status == "submitted" if user_resp else False,
                    totalResponses=response_counts.get(key, 0),
                )
            )

        return PaginatedResponse(
            data=items,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )

    def get_questionnaire_by_id(
        self,
        questionnaire_id: str,
        include_questions: bool = True,
        current_user_id: Optional[str] = None,
    ) -> Optional[QuestionnaireDetailResponse]:
        query = self.db.query(Questionnaire)
        if include_questions:
            query = query.options(
                joinedload(Questionnaire.questions).joinedload(QuestionnaireQuestion.options)
            )

        questionnaire = query.filter(Questionnaire.id == questionnaire_id).first()
        if not questionnaire:
            return None

        questions = []
        if include_questions and questionnaire.questions:
            from app.schemas.questionnaire import QuestionnaireQuestionResponse, QuestionnaireOptionResponse

            for question in sorted(questionnaire.questions, key=lambda x: x.order_index):
                options = [
                    QuestionnaireOptionResponse(
                        id=str(opt.id),
                        label=opt.label,
                        value=opt.value,
                        orderIndex=opt.order_index,
                    )
                    for opt in sorted(question.options, key=lambda x: x.order_index)
                ]
                questions.append(
                    QuestionnaireQuestionResponse(
                        id=str(question.id),
                        question=question.question,
                        description=question.description,
                        type=question.type,
                        required=question.required,
                        orderIndex=question.order_index,
                        options=options if options else None,
                    )
                )

        # Determine if current user has a response
        has_response = False
        is_submitted = False
        if current_user_id:
            resp = (
                self.db.query(QuestionnaireResponse)
                .filter(
                    and_(
                        QuestionnaireResponse.user_id == current_user_id,
                        QuestionnaireResponse.questionnaire_id == questionnaire.id,
                    )
                )
                .first()
            )
            if resp:
                has_response = True
                is_submitted = resp.status == "submitted"

        return QuestionnaireDetailResponse(
            id=str(questionnaire.id),
            title=questionnaire.title,
            description=questionnaire.description,
            status=questionnaire.status,
            startDate=questionnaire.start_date,
            endDate=questionnaire.end_date,
            editWindowMinutes=questionnaire.edit_window_minutes,
            createdAt=questionnaire.created_at.isoformat()
            if questionnaire.created_at
            else None,
            updatedAt=questionnaire.updated_at.isoformat()
            if questionnaire.updated_at
            else None,
            hasResponse=has_response,
            isSubmitted=is_submitted,
            questions=questions,
        )

    def create_questionnaire(
        self, data: CreateQuestionnaireRequest
    ) -> QuestionnaireDetailResponse:
        questionnaire = Questionnaire(
            title=data.title,
            description=data.description,
            start_date=data.startDate,
            end_date=data.endDate,
            edit_window_minutes=data.editWindowMinutes,
            status="draft",
        )
        self.db.add(questionnaire)
        self.db.flush()

        for idx, q in enumerate(data.questions):
            question = QuestionnaireQuestion(
                questionnaire_id=questionnaire.id,
                question=q.question,
                description=q.description,
                type=q.type,
                required=q.required,
                order_index=q.orderIndex,
            )
            self.db.add(question)
            self.db.flush()

            if q.options:
                for opt_idx, opt in enumerate(q.options):
                    option = QuestionnaireOption(
                        question_id=question.id,
                        label=opt.label,
                        value=opt.value,
                        order_index=opt.orderIndex if opt.orderIndex is not None else opt_idx,
                    )
                    self.db.add(option)

        self.db.commit()
        self.db.refresh(questionnaire)

        return self.get_questionnaire_by_id(str(questionnaire.id))

    def update_questionnaire(
        self, questionnaire_id: str, data: UpdateQuestionnaireRequest
    ) -> Optional[QuestionnaireDetailResponse]:
        questionnaire = (
            self.db.query(Questionnaire).filter(Questionnaire.id == questionnaire_id).first()
        )
        if not questionnaire:
            return None

        previous_status = questionnaire.status

        if data.title is not None:
            questionnaire.title = data.title
        if data.description is not None:
            questionnaire.description = data.description
        if data.status is not None:
            questionnaire.status = data.status
        if data.startDate is not None:
            questionnaire.start_date = data.startDate
        if data.endDate is not None:
            questionnaire.end_date = data.endDate
        if data.editWindowMinutes is not None:
            questionnaire.edit_window_minutes = data.editWindowMinutes

        # Only allow structural question updates on draft questionnaires
        if data.questions is not None:
            if questionnaire.status != "draft":
                raise ValueError("Les questions ne peuvent être modifiées que pour les questionnaires en brouillon.")

            # Eager-load existing questions and options
            questionnaire = (
                self.db.query(Questionnaire)
                .options(
                    joinedload(Questionnaire.questions).joinedload(
                        QuestionnaireQuestion.options
                    )
                )
                .filter(Questionnaire.id == questionnaire_id)
                .first()
            )

            existing_questions = {str(q.id): q for q in questionnaire.questions}
            incoming_ids = set()

            # Upsert questions
            for idx, q_data in enumerate(data.questions):
                q_id = q_data.id
                order_index = q_data.orderIndex if q_data.orderIndex is not None else idx

                if q_id and q_id in existing_questions:
                    # Update existing question
                    question = existing_questions[q_id]
                    question.question = q_data.question
                    question.description = q_data.description
                    question.type = q_data.type
                    question.required = q_data.required
                    question.order_index = order_index

                    # Replace options if provided for choice types
                    if q_data.options is not None:
                        # Delete existing options
                        for opt in list(question.options):
                            self.db.delete(opt)
                        self.db.flush()

                        # Recreate options
                        for opt_idx, opt_data in enumerate(q_data.options):
                            option = QuestionnaireOption(
                                question_id=question.id,
                                label=opt_data.label,
                                value=opt_data.value,
                                order_index=opt_data.orderIndex
                                if opt_data.orderIndex is not None
                                else opt_idx,
                            )
                            self.db.add(option)

                else:
                    # New question
                    question = QuestionnaireQuestion(
                        questionnaire_id=questionnaire.id,
                        question=q_data.question,
                        description=q_data.description,
                        type=q_data.type,
                        required=q_data.required,
                        order_index=order_index,
                    )
                    self.db.add(question)
                    self.db.flush()

                    if q_data.options:
                        for opt_idx, opt_data in enumerate(q_data.options):
                            option = QuestionnaireOption(
                                question_id=question.id,
                                label=opt_data.label,
                                value=opt_data.value,
                                order_index=opt_data.orderIndex
                                if opt_data.orderIndex is not None
                                else opt_idx,
                            )
                            self.db.add(option)

                if q_id:
                    incoming_ids.add(q_id)

            # Delete questions that are no longer in the list
            for q_id, question in existing_questions.items():
                if q_id not in incoming_ids:
                    self.db.delete(question)

        questionnaire.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(questionnaire)

        # If questionnaire was just published, notify all active members
        if previous_status != "published" and questionnaire.status == "published":
            from app.models.user import User

            email_service = ResendEmailService()

            end_date_str = None
            if questionnaire.end_date:
                end_date_str = questionnaire.end_date.strftime("%d/%m/%Y")

            active_users = self.db.query(User).filter(
                User.status == "active",
                User.role != "guest"
            ).all()
            for user in active_users:
                full_name = f"{user.first_name} {user.last_name}".strip() or user.email
                email_service.send_questionnaire_published_email(
                    to_email=user.email,
                    to_name=full_name,
                    questionnaire_title=questionnaire.title,
                    end_date=end_date_str,
                )

        return self.get_questionnaire_by_id(str(questionnaire.id))

    def delete_questionnaire(self, questionnaire_id: str) -> bool:
        questionnaire = (
            self.db.query(Questionnaire).filter(Questionnaire.id == questionnaire_id).first()
        )
        if not questionnaire:
            return False

        self.db.delete(questionnaire)
        self.db.commit()
        return True

    # --- Member: listing and answering ---

    def _build_answer_payload(
        self,
        question: QuestionnaireQuestion,
        stored_answer: Optional[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """
        Convert stored JSON answer into a richer payload for API responses.
        - For choice questions, include option labels (and normalize keys).
        - For other types, return the stored payload as is.
        """
        if not stored_answer:
            return None

        # Normalize keys for easier handling
        data = dict(stored_answer)

        if question.type == "single_choice":
            option_id = data.get("option_id") or data.get("optionId")
            if not option_id:
                return None

            # Find option by ID to include label
            option = next(
                (opt for opt in question.options if str(opt.id) == str(option_id)), None
            )
            return {
                "optionId": str(option_id),
                "optionLabel": option.label if option else None,
            }

        if question.type == "multiple_choice":
            option_ids = (
                data.get("option_ids")
                or data.get("optionIds")
                or []
            )
            option_id_strs = [str(oid) for oid in option_ids]
            # Map IDs to labels
            options_map = {
                str(opt.id): opt.label for opt in question.options
            }
            detailed_options = [
                {
                    "optionId": oid,
                    "optionLabel": options_map.get(oid),
                }
                for oid in option_id_strs
            ]
            return {
                "optionIds": option_id_strs,
                "options": detailed_options,
            }

        # For text, rating, number, date etc., return as stored
        return data

    def _is_questionnaire_active_for_user(self, questionnaire: Questionnaire) -> bool:
        """Determine if questionnaire is active (visible/answerable) for members."""
        if questionnaire.status != "published":
            return False
        today = date.today()
        if questionnaire.start_date and questionnaire.start_date > today:
            return False
        if questionnaire.end_date and questionnaire.end_date < today:
            return False
        return True

    def get_unanswered_for_user(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 10,
    ) -> PaginatedResponse[QuestionnaireSummaryResponse]:
        """Questionnaires that are active and have no submitted response from this user."""
        # Get all active questionnaires
        all_q = (
            self.db.query(Questionnaire)
            .order_by(Questionnaire.created_at.desc())
            .all()
        )
        active_q = [q for q in all_q if self._is_questionnaire_active_for_user(q)]

        # Fetch responses for this user for these questionnaires
        if not active_q:
            return PaginatedResponse(
                data=[],
                total=0,
                page=page,
                limit=limit,
                totalPages=0,
            )

        q_ids = [q.id for q in active_q]
        responses = (
            self.db.query(QuestionnaireResponse)
            .filter(
                and_(
                    QuestionnaireResponse.user_id == user_id,
                    QuestionnaireResponse.questionnaire_id.in_(q_ids),
                )
            )
            .all()
        )
        responses_by_q = {str(r.questionnaire_id): r for r in responses}

        # Filter to questionnaires with no submitted response
        filtered = []
        for q in active_q:
            resp = responses_by_q.get(str(q.id))
            if not resp or resp.status != "submitted":
                filtered.append((q, resp))

        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        page_items = filtered[start:end]

        items: List[QuestionnaireSummaryResponse] = []
        for q, resp in page_items:
            items.append(
                QuestionnaireSummaryResponse(
                    id=str(q.id),
                    title=q.title,
                    description=q.description,
                    status=q.status,
                    startDate=q.start_date,
                    endDate=q.end_date,
                    editWindowMinutes=q.edit_window_minutes,
                    createdAt=q.created_at.isoformat() if q.created_at else None,
                    updatedAt=q.updated_at.isoformat() if q.updated_at else None,
                    hasResponse=resp is not None,
                    isSubmitted=resp.status == "submitted" if resp else False,
                )
            )

        return PaginatedResponse(
            data=items,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )

    def get_history_for_user(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 10,
    ) -> PaginatedResponse[QuestionnaireResponseDetail]:
        """
        Get questionnaires where the user has a response (submitted or in_progress),
        together with their answers.
        """
        # Order by most recently created/updated responses
        query = (
            self.db.query(QuestionnaireResponse)
            .options(
                joinedload(QuestionnaireResponse.answers)
                .joinedload(QuestionnaireAnswer.question)
                .joinedload(QuestionnaireQuestion.options),
                joinedload(QuestionnaireResponse.questionnaire),
            )
            .filter(QuestionnaireResponse.user_id == user_id)
            .order_by(QuestionnaireResponse.created_at.desc())
        )

        total = query.count()
        offset = (page - 1) * limit
        responses = query.offset(offset).limit(limit).all()

        items: List[QuestionnaireResponseDetail] = []
        for response in responses:
            answers_resp: List[QuestionAnswerResponse] = []
            for answer in response.answers:
                question = answer.question
                enriched_answer = self._build_answer_payload(
                    question=question, stored_answer=answer.answer
                )
                answers_resp.append(
                    QuestionAnswerResponse(
                        questionId=str(question.id),
                        type=question.type,
                        answer=enriched_answer,
                    )
                )

            items.append(
                QuestionnaireResponseDetail(
                    id=str(response.id),
                    questionnaireId=str(response.questionnaire_id),
                    userId=str(response.user_id),
                    status=response.status,
                    createdAt=response.created_at.isoformat()
                    if response.created_at
                    else None,
                    submittedAt=response.submitted_at.isoformat()
                    if response.submitted_at
                    else None,
                    editUntil=response.edit_until.isoformat()
                    if response.edit_until
                    else None,
                    answers=answers_resp,
                )
            )

        return PaginatedResponse(
            data=items,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )

    def get_or_create_response_for_user(
        self,
        questionnaire_id: str,
        user_id: str,
    ) -> QuestionnaireResponse:
        response = (
            self.db.query(QuestionnaireResponse)
            .filter(
                and_(
                    QuestionnaireResponse.questionnaire_id == questionnaire_id,
                    QuestionnaireResponse.user_id == user_id,
                )
            )
            .first()
        )
        if response:
            return response

        response = QuestionnaireResponse(
            questionnaire_id=questionnaire_id,
            user_id=user_id,
            status="in_progress",
        )
        self.db.add(response)
        self.db.flush()
        return response

    def _ensure_can_edit_response(
        self,
        questionnaire: Questionnaire,
        response: QuestionnaireResponse,
    ) -> bool:
        """Check if the user is allowed to edit this response right now."""
        # Questionnaire must still be active
        if not self._is_questionnaire_active_for_user(questionnaire):
            return False

        # If never submitted, always editable while questionnaire is active
        if response.status != "submitted":
            return True

        # If submitted, check edit window
        if not response.edit_until:
            return False

        now = datetime.now(timezone.utc)
        return now <= response.edit_until.replace(tzinfo=timezone.utc)

    def submit_answers_for_user(
        self,
        questionnaire_id: str,
        user_id: str,
        data: SubmitQuestionnaireAnswersRequest,
    ) -> Optional[QuestionnaireResponseDetail]:
        questionnaire = (
            self.db.query(Questionnaire)
            .options(
                joinedload(Questionnaire.questions).joinedload(QuestionnaireQuestion.options)
            )
            .filter(Questionnaire.id == questionnaire_id)
            .first()
        )
        if not questionnaire:
            return None

        if not self._is_questionnaire_active_for_user(questionnaire):
            return None

        response = self.get_or_create_response_for_user(questionnaire_id, user_id)

        if not self._ensure_can_edit_response(questionnaire, response):
            return None

        # Validate all questions exist and types match
        questions_by_id = {str(q.id): q for q in questionnaire.questions}

        for ans in data.answers:
            question = questions_by_id.get(ans.questionId)
            if not question:
                return None
            if question.type != ans.type:
                return None

        # Upsert answers
        existing_answers = (
            self.db.query(QuestionnaireAnswer)
            .filter(QuestionnaireAnswer.response_id == response.id)
            .all()
        )
        existing_by_q = {str(a.question_id): a for a in existing_answers}

        for ans in data.answers:
            question = questions_by_id[ans.questionId]

            # For choice questions, we could validate option IDs exist
            if question.type in ("single_choice", "multiple_choice"):
                option_ids = []
                if question.type == "single_choice":
                    option_ids = [ans.answer.optionId]
                else:
                    option_ids = ans.answer.optionIds

                valid_ids = {str(o.id) for o in question.options}
                if not all(oid in valid_ids for oid in option_ids):
                    return None

            existing = existing_by_q.get(ans.questionId)
            answer_payload = ans.answer.model_dump(by_alias=True)

            if existing:
                existing.answer = answer_payload
                existing.updated_at = datetime.now(timezone.utc)
            else:
                new_answer = QuestionnaireAnswer(
                    response_id=response.id,
                    question_id=ans.questionId,
                    answer=answer_payload,
                )
                self.db.add(new_answer)

        # Handle submit vs draft
        now = datetime.now(timezone.utc)
        if data.submit:
            response.status = "submitted"
            if not response.submitted_at:
                response.submitted_at = now
            # Set edit_until if not set yet
            if not response.edit_until:
                minutes = questionnaire.edit_window_minutes or DEFAULT_EDIT_WINDOW_MINUTES
                response.edit_until = now + timedelta(minutes=minutes)
        else:
            # Keep as in_progress
            if response.status != "submitted":
                response.status = "in_progress"

        self.db.commit()
        self.db.refresh(response)

        return self.get_response_detail(questionnaire_id, user_id)

    def get_response_detail(
        self,
        questionnaire_id: str,
        user_id: str,
    ) -> Optional[QuestionnaireResponseDetail]:
        response = (
            self.db.query(QuestionnaireResponse)
            .options(
                joinedload(QuestionnaireResponse.answers)
                .joinedload(QuestionnaireAnswer.question)
                .joinedload(QuestionnaireQuestion.options)
            )
            .filter(
                and_(
                    QuestionnaireResponse.questionnaire_id == questionnaire_id,
                    QuestionnaireResponse.user_id == user_id,
                )
            )
            .first()
        )
        if not response:
            return None

        answers_resp: List[QuestionAnswerResponse] = []
        for answer in response.answers:
            question = answer.question
            enriched_answer = self._build_answer_payload(
                question=question, stored_answer=answer.answer
            )
            answers_resp.append(
                QuestionAnswerResponse(
                    questionId=str(question.id),
                    type=question.type,
                    answer=enriched_answer,
                )
            )

        return QuestionnaireResponseDetail(
            id=str(response.id),
            questionnaireId=str(response.questionnaire_id),
            userId=str(response.user_id),
            status=response.status,
            createdAt=response.created_at.isoformat() if response.created_at else None,
            submittedAt=response.submitted_at.isoformat()
            if response.submitted_at
            else None,
            editUntil=response.edit_until.isoformat() if response.edit_until else None,
            answers=answers_resp,
        )

    # --- Admin: view responses ---

    def get_responses_for_questionnaire(
        self,
        questionnaire_id: str,
        page: int = 1,
        limit: int = 10,
    ) -> PaginatedResponse[QuestionnaireResponseSummary]:
        query = (
            self.db.query(QuestionnaireResponse)
            .filter(QuestionnaireResponse.questionnaire_id == questionnaire_id)
            .order_by(QuestionnaireResponse.created_at.desc())
        )

        total = query.count()
        offset = (page - 1) * limit
        responses = query.offset(offset).limit(limit).all()

        items: List[QuestionnaireResponseSummary] = []
        for r in responses:
            items.append(
                QuestionnaireResponseSummary(
                    id=str(r.id),
                    questionnaireId=str(r.questionnaire_id),
                    userId=str(r.user_id),
                    status=r.status,
                    createdAt=r.created_at.isoformat() if r.created_at else None,
                    submittedAt=r.submitted_at.isoformat()
                    if r.submitted_at
                    else None,
                    editUntil=r.edit_until.isoformat() if r.edit_until else None,
                )
            )

        return PaginatedResponse(
            data=items,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )



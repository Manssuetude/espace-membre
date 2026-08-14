from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin
from app.schemas.common import APIResponse
from app.schemas.questionnaire import (
    CreateQuestionnaireRequest,
    UpdateQuestionnaireRequest,
    SubmitQuestionnaireAnswersRequest,
)
from app.services.questionnaire_service import QuestionnaireService


router = APIRouter()


@router.get("", response_model=APIResponse)
async def list_questionnaires(
    status: Optional[str] = Query(
        "all", description="Filter by status: all, draft, published, closed"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    List questionnaires (admin only).
    """
    service = QuestionnaireService(db)
    result = service.get_questionnaires(
        status=status,
        page=page,
        limit=limit,
        current_user_id=str(current_user.id),
    )
    return APIResponse(success=True, data=result.model_dump())


@router.post("", response_model=APIResponse)
async def create_questionnaire(
    data: CreateQuestionnaireRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    Create a new questionnaire (admin only).
    """
    service = QuestionnaireService(db)
    questionnaire = service.create_questionnaire(data)
    return APIResponse(
        success=True,
        data=questionnaire.model_dump(),
        message="Questionnaire créé avec succès",
    )


@router.get("/{questionnaire_id}", response_model=APIResponse)
async def get_questionnaire(
    questionnaire_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    Get questionnaire details (admin only).
    """
    service = QuestionnaireService(db)
    questionnaire = service.get_questionnaire_by_id(questionnaire_id)
    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found"
        )
    return APIResponse(success=True, data=questionnaire.model_dump())


@router.patch("/{questionnaire_id}", response_model=APIResponse)
async def update_questionnaire(
    questionnaire_id: str,
    data: UpdateQuestionnaireRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    Update a questionnaire (admin only).
    """
    service = QuestionnaireService(db)
    try:
        questionnaire = service.update_questionnaire(questionnaire_id, data)
    except ValueError as e:
        # For example, trying to modify questions on a non-draft questionnaire
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found"
        )
    return APIResponse(
        success=True,
        data=questionnaire.model_dump(),
        message="Questionnaire mis à jour avec succès",
    )


@router.delete("/{questionnaire_id}", response_model=APIResponse)
async def delete_questionnaire(
    questionnaire_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    Delete a questionnaire (admin only).
    """
    service = QuestionnaireService(db)
    success = service.delete_questionnaire(questionnaire_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found"
        )
    return APIResponse(success=True, message="Questionnaire supprimé avec succès")


# --- Member-facing endpoints ---


@router.get("/me/unanswered", response_model=APIResponse)
async def get_my_unanswered_questionnaires(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get active questionnaires the current user has not yet submitted.
    """
    service = QuestionnaireService(db)
    result = service.get_unanswered_for_user(
        user_id=str(current_user.id), page=page, limit=limit
    )
    return APIResponse(success=True, data=result.model_dump())


@router.get("/me/history", response_model=APIResponse)
async def get_my_questionnaire_history(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get questionnaires for which the current user has a response (submitted or in_progress),
    including their answers for each questionnaire.
    """
    service = QuestionnaireService(db)
    result = service.get_history_for_user(
        user_id=str(current_user.id), page=page, limit=limit
    )
    return APIResponse(success=True, data=result.model_dump())


@router.get("/{questionnaire_id}/me", response_model=APIResponse)
async def get_my_questionnaire_response(
    questionnaire_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Get questionnaire details plus the current user's answers (if any).
    """
    service = QuestionnaireService(db)
    questionnaire = service.get_questionnaire_by_id(
        questionnaire_id, include_questions=True, current_user_id=str(current_user.id)
    )
    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found"
        )

    response_detail = service.get_response_detail(questionnaire_id, str(current_user.id))

    payload = questionnaire.model_dump()
    payload["response"] = response_detail.model_dump() if response_detail else None

    return APIResponse(success=True, data=payload)


@router.post("/{questionnaire_id}/me/answers", response_model=APIResponse)
async def submit_my_questionnaire_answers(
    questionnaire_id: str,
    data: SubmitQuestionnaireAnswersRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Create or update the current user's answers for a questionnaire.
    - If submit=true, marks the response as submitted and starts the edit window.
    - If submit=false, keeps it as an in-progress draft.
    """
    service = QuestionnaireService(db)
    result = service.submit_answers_for_user(
        questionnaire_id, str(current_user.id), data
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit answers for this questionnaire",
        )

    return APIResponse(
        success=True,
        data=result.model_dump(),
        message="Réponses enregistrées avec succès",
    )


# --- Admin: responses ---


@router.get("/{questionnaire_id}/responses", response_model=APIResponse)
async def list_questionnaire_responses(
    questionnaire_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    List responses for a questionnaire (admin only).
    """
    service = QuestionnaireService(db)
    result = service.get_responses_for_questionnaire(
        questionnaire_id, page=page, limit=limit
    )
    return APIResponse(success=True, data=result.model_dump())


@router.get("/{questionnaire_id}/responses/{user_id}", response_model=APIResponse)
async def get_questionnaire_response_detail(
    questionnaire_id: str,
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin),
):
    """
    Get a detailed response (with answers) for a specific user on a questionnaire (admin only).
    """
    service = QuestionnaireService(db)
    response_detail = service.get_response_detail(questionnaire_id, user_id)
    if not response_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found for this questionnaire and user",
        )

    return APIResponse(
        success=True,
        data=response_detail.model_dump(),
    )



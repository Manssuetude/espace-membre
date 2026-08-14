from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_admin, get_optional_user
from app.schemas.poll import CreatePollRequest, UpdatePollRequest, PollResponse, VoteRequest, VoteResponse
from app.schemas.common import APIResponse, PaginatedResponse
from app.services.poll_service import PollService

router = APIRouter()


@router.get("", response_model=APIResponse)
async def get_polls(
    status: Optional[str] = Query("all", description="Filter by status: all, draft, active, completed"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get all polls with filtering and pagination.
    Requires authentication. Guests can only see polls from sessions they're registered for.
    Includes user's vote choice for each poll.
    """
    service = PollService(db)
    user_id = str(current_user.id) if current_user else None
    result = service.get_polls(status=status, page=page, limit=limit, user_id=user_id)
    
    return APIResponse(
        success=True,
        data=result.model_dump()
    )


@router.get("/{poll_id}", response_model=APIResponse)
async def get_poll(
    poll_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get poll by ID with options, votes, and voters.
    Requires authentication. Guests can only access polls from sessions they're registered for.
    Includes user's vote choice.
    """
    service = PollService(db)
    user_id = str(current_user.id) if current_user else None
    poll = service.get_poll_by_id(poll_id, user_id=user_id)
    
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    return APIResponse(
        success=True,
        data=poll.model_dump()
    )


@router.post("", response_model=APIResponse)
async def create_poll(
    data: CreatePollRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Create a new poll (Admin only).
    """
    service = PollService(db)
    poll = service.create_poll(data)
    
    return APIResponse(
        success=True,
        data=poll.model_dump(),
        message="Sondage créé avec succès"
    )


@router.patch("/{poll_id}", response_model=APIResponse)
async def update_poll(
    poll_id: str,
    data: UpdatePollRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Update poll (Admin only).
    """
    service = PollService(db)
    poll = service.update_poll(poll_id, data)
    
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    return APIResponse(
        success=True,
        data=poll.model_dump(),
        message="Sondage mis à jour avec succès"
    )


@router.post("/{poll_id}/vote", response_model=APIResponse)
async def vote_on_poll(
    poll_id: str,
    data: VoteRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Vote on multiple poll questions at once.
    Accepts an array of votes in the request body, one per question.
    Example:
    {
      "votes": [
        {
          "questionId": "question-1-uuid",
          "optionId": "option-1-uuid"
        },
        {
          "questionId": "question-2-uuid",
          "optionIds": ["option-3-uuid", "option-4-uuid"]
        }
      ]
    }
    """
    service = PollService(db)
    result = service.vote_on_poll(poll_id, data, str(current_user.id))
    
    if not result:
        # Check if poll exists and get more specific error
        poll = service.get_poll_by_id(poll_id)
        if not poll:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Poll not found"
            )
        
        # Check if multiple options were sent for single response questions
        from app.models.poll import PollQuestion
        for vote_data in data.votes:
            question = db.query(PollQuestion).filter(PollQuestion.id == vote_data.questionId).first()
            if question and vote_data.optionIds and len(vote_data.optionIds) > 1 and question.single_response:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Multiple options not allowed for single response question: {question.question}"
                )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot vote: poll not active, invalid question(s), or invalid option(s)"
        )
    
    return APIResponse(
        success=True,
        data=result.model_dump(),
        message="Votes enregistrés avec succès"
    )


@router.post("/{poll_id}/close", response_model=APIResponse)
async def close_poll(
    poll_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Close a poll by setting status to completed (Admin only).
    This prevents further voting on the poll.
    """
    service = PollService(db)
    poll = service.close_poll(poll_id)
    
    if not poll:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    return APIResponse(
        success=True,
        data=poll.model_dump(),
        message="Sondage fermé avec succès"
    )


@router.post("/{poll_id}/remind", response_model=APIResponse)
async def remind_poll_voters(
    poll_id: str,
    sessionOnly: bool = Query(False, description="If true and poll is linked to a session, only notify registered users"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Send reminder emails to members who haven't voted on a poll (Admin only).
    
    - If sessionOnly=true and poll is linked to a session, only notifies users registered for that session
    - Otherwise, notifies all active members who haven't voted
    """
    service = PollService(db)
    try:
        result = service.send_poll_reminders(poll_id, session_only=sessionOnly)
        
        return APIResponse(
            success=True,
            data=result,
            message=f"Rappels envoyés : {result['emailsSent']} email(s) envoyé(s), {result['emailsFailed']} échec(s)"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{poll_id}", response_model=APIResponse)
async def delete_poll(
    poll_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    """
    Delete poll (Admin only).
    """
    service = PollService(db)
    success = service.delete_poll(poll_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poll not found"
        )
    
    return APIResponse(
        success=True,
        message="Sondage supprimé avec succès"
    )


from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.library import (
    LibraryBookCategory,
    CreateBookRequest,
    UpdateBookRequest,
    UpdateBookAvailabilityRequest,
    CreateLoanRequest,
    CreateWishlistItemRequest,
    UpdateWishlistItemRequest,
)
from app.schemas.common import APIResponse
from app.services.library_service import LibraryService
from app.services.r2_storage_service import R2StorageService
from app.models.library import BookRequest, Book

router = APIRouter()


def _ensure_library_member(current_user):
    if current_user.role not in ["member", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Library access is restricted to members",
        )


def _ensure_owner_or_admin(current_user, owner_id: str):
    if current_user.role in ["admin", "super_admin"]:
        return
    if str(current_user.id) != str(owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can modify this book",
        )


@router.get("/books", response_model=APIResponse)
async def get_books(
    search: Optional[str] = Query(None, description="Search by title, author or description"),
    category: Optional[LibraryBookCategory] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query("all", alias="status", description="Filter by status: all, available, reserved, loaned, paused"),
    availableOnly: bool = Query(False, description="Return only currently available books"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    result = service.get_books(
        search=search,
        category=category,
        status=status_filter,
        exclude_owner_id=str(current_user.id),
        viewer_user_id=str(current_user.id),
        available_only=availableOnly,
        page=page,
        limit=limit,
    )
    return APIResponse(success=True, data=result.model_dump())


@router.get("/books/mine", response_model=APIResponse)
async def get_my_books(
    search: Optional[str] = Query(None, description="Search by title, author or description"),
    category: Optional[LibraryBookCategory] = Query(None, description="Filter by category"),
    status_filter: Optional[str] = Query("all", alias="status", description="Filter by status: all, available, reserved, loaned, paused"),
    availableOnly: bool = Query(False, description="Return only currently available books"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    result = service.get_books(
        search=search,
        category=category,
        status=status_filter,
        owner_id=str(current_user.id),
        viewer_user_id=str(current_user.id),
        available_only=availableOnly,
        page=page,
        limit=limit,
    )
    return APIResponse(success=True, data=result.model_dump())


@router.get("/books/{book_id}", response_model=APIResponse)
async def get_book(
    book_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    book = service.get_book_by_id(book_id, viewer_user_id=str(current_user.id))
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    return APIResponse(success=True, data=book.model_dump())


@router.post("/books", response_model=APIResponse)
async def create_book(
    title: str = Form(...),
    author: str = Form(...),
    description: Optional[str] = Form(None),
    comment: Optional[str] = Form(None),
    category: Optional[LibraryBookCategory] = Form(None),
    pageCount: Optional[int] = Form(None),
    language: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    availabilityMode: str = Form("always"),
    availableFrom: Optional[str] = Form(None),
    defaultLoanDays: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    storage_service = R2StorageService()

    image_url = None
    if image:
        try:
            image_url, _ = storage_service.upload_upload_file(
                image,
                folder="library",
                owner_id=str(current_user.id),
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    data = CreateBookRequest(
        title=title,
        author=author,
        description=description,
        comment=comment,
        category=category,
        pageCount=pageCount,
        language=language,
        condition=condition,
        availabilityMode=availabilityMode,
        availableFrom=availableFrom,
        defaultLoanDays=defaultLoanDays,
    )

    try:
        book = service.create_book(data, str(current_user.id), image_url=image_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return APIResponse(
        success=True,
        data=book.model_dump(),
        message="Book listing created successfully",
    )


@router.patch("/books/{book_id}", response_model=APIResponse)
async def update_book(
    book_id: str,
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    comment: Optional[str] = Form(None),
    category: Optional[LibraryBookCategory] = Form(None),
    pageCount: Optional[int] = Form(None),
    language: Optional[str] = Form(None),
    condition: Optional[str] = Form(None),
    availabilityMode: Optional[str] = Form(None),
    availableFrom: Optional[str] = Form(None),
    status_value: Optional[str] = Form(None, alias="status"),
    defaultLoanDays: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    existing = service.get_book_by_id(book_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    _ensure_owner_or_admin(current_user, existing.ownerId)

    storage_service = R2StorageService()
    image_url = None
    if image:
        try:
            image_url, _ = storage_service.upload_upload_file(
                image,
                folder="library",
                owner_id=str(current_user.id),
            )
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    data = UpdateBookRequest(
        title=title,
        author=author,
        description=description,
        comment=comment,
        category=category,
        pageCount=pageCount,
        language=language,
        condition=condition,
        availabilityMode=availabilityMode,
        availableFrom=availableFrom,
        status=status_value,
        defaultLoanDays=defaultLoanDays,
    )

    try:
        book = service.update_book(book_id, data, image_url=image_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    return APIResponse(
        success=True,
        data=book.model_dump(),
        message="Book listing updated successfully",
    )


@router.patch("/books/{book_id}/availability", response_model=APIResponse)
async def update_book_availability(
    book_id: str,
    data: UpdateBookAvailabilityRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    existing = service.get_book_by_id(book_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    _ensure_owner_or_admin(current_user, existing.ownerId)

    book = service.update_book_availability(book_id, data)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    return APIResponse(
        success=True,
        data=book.model_dump(),
        message="Book availability updated successfully",
    )


@router.delete("/books/{book_id}", response_model=APIResponse)
async def delete_book(
    book_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    existing = service.get_book_by_id(book_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    _ensure_owner_or_admin(current_user, existing.ownerId)

    success = service.delete_book(book_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    return APIResponse(success=True, message="Book listing deleted successfully")


@router.post("/books/{book_id}/request", response_model=APIResponse)
async def request_book(
    book_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        request = service.create_request(book_id, str(current_user.id))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return APIResponse(
        success=True,
        data=request.model_dump(),
        message="Book request created successfully",
    )


@router.get("/books/{book_id}/requests", response_model=APIResponse)
async def get_book_requests(
    book_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    book = service.get_book_by_id(book_id)
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    if str(current_user.id) != str(book.ownerId):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can access requests for this book",
        )
    requests = service.get_book_requests(book_id)
    return APIResponse(success=True, data=[req.model_dump() for req in requests])


@router.post("/requests/{request_id}/cancel", response_model=APIResponse)
async def cancel_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        request = service.cancel_request(
            request_id=request_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    return APIResponse(
        success=True,
        data=request.model_dump(),
        message="Book request cancelled successfully",
    )


@router.post("/requests/{request_id}/expire", response_model=APIResponse)
async def expire_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    service = LibraryService(db)
    try:
        request = service.expire_request(request_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    return APIResponse(
        success=True,
        data=request.model_dump(),
        message="Book request expired successfully",
    )


@router.post("/requests/{request_id}/create-loan", response_model=APIResponse)
async def create_loan_from_request(
    request_id: str,
    data: CreateLoanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    # Defense-in-depth auth check at route layer.
    request_model = db.query(BookRequest).filter(BookRequest.id == request_id).first()
    if not request_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    book_model = db.query(Book).filter(Book.id == request_model.book_id).first()
    if not book_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )
    if str(current_user.id) != str(book_model.owner_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can create a loan from a request",
        )

    service = LibraryService(db)
    try:
        loan = service.create_loan_from_request(
            request_id=request_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
            payload=data,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )

    return APIResponse(
        success=True,
        data=loan.model_dump(),
        message="Loan created successfully",
    )


@router.get("/loans/id/{loan_id}", response_model=APIResponse)
async def get_loan(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    loan = service.get_loan_by_id(loan_id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    is_admin = current_user.role in ["admin", "super_admin"]
    if not is_admin and str(current_user.id) not in [loan.ownerId, loan.borrowerId]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this loan",
        )

    return APIResponse(success=True, data=loan.model_dump())


@router.get("/loans/me", response_model=APIResponse)
async def get_my_loans(
    status_filter: Optional[str] = Query("all", alias="status", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    result = service.get_my_loans(
        user_id=str(current_user.id),
        role=current_user.role,
        status=status_filter,
        page=page,
        limit=limit,
    )
    return APIResponse(success=True, data=result.model_dump())


@router.post("/loans/{loan_id}/confirm-handover/owner", response_model=APIResponse)
async def confirm_handover_owner(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        loan = service.confirm_handover_owner(
            loan_id=loan_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )
    return APIResponse(success=True, data=loan.model_dump(), message="Owner handover confirmed")


@router.post("/loans/{loan_id}/confirm-handover/borrower", response_model=APIResponse)
async def confirm_handover_borrower(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        loan = service.confirm_handover_borrower(
            loan_id=loan_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )
    return APIResponse(success=True, data=loan.model_dump(), message="Borrower handover confirmed")


@router.post("/loans/{loan_id}/initiate-return", response_model=APIResponse)
async def initiate_return(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        loan = service.initiate_return(
            loan_id=loan_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )
    return APIResponse(success=True, data=loan.model_dump(), message="Return initiated")


@router.post("/loans/{loan_id}/confirm-return/owner", response_model=APIResponse)
async def confirm_return_owner(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        loan = service.confirm_return_owner(
            loan_id=loan_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )
    return APIResponse(success=True, data=loan.model_dump(), message="Return confirmed by owner")


@router.post("/loans/{loan_id}/cancel", response_model=APIResponse)
async def cancel_loan(
    loan_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        loan = service.cancel_loan(
            loan_id=loan_id,
            actor_user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )
    return APIResponse(success=True, data=loan.model_dump(), message="Loan cancelled")


@router.get("/wishlist/me", response_model=APIResponse)
async def get_my_wishlist(
    activeOnly: bool = Query(False, description="Return only active wishlist items"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    items = service.get_my_wishlist(str(current_user.id), active_only=activeOnly)
    return APIResponse(success=True, data=[item.model_dump() for item in items])


@router.post("/wishlist", response_model=APIResponse)
async def create_wishlist_item(
    data: CreateWishlistItemRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    item = service.create_wishlist_item(str(current_user.id), data)
    return APIResponse(
        success=True,
        data=item.model_dump(),
        message="Wishlist item created successfully",
    )


@router.patch("/wishlist/{item_id}", response_model=APIResponse)
async def update_wishlist_item(
    item_id: str,
    data: UpdateWishlistItemRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        item = service.update_wishlist_item(
            item_id=item_id,
            user_id=str(current_user.id),
            data=data,
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )
    return APIResponse(
        success=True,
        data=item.model_dump(),
        message="Wishlist item updated successfully",
    )


@router.delete("/wishlist/{item_id}", response_model=APIResponse)
async def delete_wishlist_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        success = service.delete_wishlist_item(
            item_id=item_id,
            user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )
    return APIResponse(success=True, message="Wishlist item deleted successfully")


@router.get("/notifications", response_model=APIResponse)
async def get_library_notifications(
    unreadOnly: bool = Query(False, description="Return only unread notifications"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    result = service.get_notifications(
        user_id=str(current_user.id),
        unread_only=unreadOnly,
        page=page,
        limit=limit,
    )
    return APIResponse(success=True, data=result.model_dump())


@router.post("/notifications/{notification_id}/read", response_model=APIResponse)
async def mark_library_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_library_member(current_user)
    service = LibraryService(db)
    try:
        notification = service.mark_notification_read(
            notification_id=notification_id,
            user_id=str(current_user.id),
            actor_role=current_user.role,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return APIResponse(
        success=True,
        data=notification.model_dump(),
        message="Notification marked as read",
    )


@router.post("/loans/reminders/due", response_model=APIResponse)
async def trigger_due_reminders(
    daysBefore: int = Query(3, ge=0, le=30),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    service = LibraryService(db)
    try:
        result = service.send_due_reminders(days_before=daysBefore)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return APIResponse(
        success=True,
        data=result,
        message="Due reminders generated successfully",
    )

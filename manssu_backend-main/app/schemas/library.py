from pydantic import BaseModel, Field
from typing import Optional, Literal


BOOK_CATEGORY_CHOICES = (
    "fiction",
    "non_fiction",
    "science",
    "technology",
    "business",
    "biography",
    "history",
    "philosophy",
    "self_help",
    "children",
    "education",
    "other",
)
LibraryBookCategory = Literal[
    "fiction",
    "non_fiction",
    "science",
    "technology",
    "business",
    "biography",
    "history",
    "philosophy",
    "self_help",
    "children",
    "education",
    "other",
]


class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    comment: Optional[str] = None
    category: Optional[LibraryBookCategory] = None
    pageCount: Optional[int] = Field(None, alias="page_count")
    language: Optional[str] = None
    condition: Optional[str] = None
    availabilityMode: str = Field("always", alias="availability_mode")
    availableFrom: Optional[str] = Field(None, alias="available_from")
    defaultLoanDays: Optional[int] = Field(None, alias="default_loan_days")

    class Config:
        populate_by_name = True


class CreateBookRequest(BaseModel):
    title: str
    author: str
    description: Optional[str] = None
    comment: Optional[str] = None
    category: Optional[LibraryBookCategory] = None
    pageCount: Optional[int] = Field(None, alias="page_count")
    language: Optional[str] = None
    condition: Optional[str] = None
    availabilityMode: str = Field("always", alias="availability_mode")
    availableFrom: Optional[str] = Field(None, alias="available_from")
    defaultLoanDays: Optional[int] = Field(None, alias="default_loan_days")

    class Config:
        populate_by_name = True


class UpdateBookRequest(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None
    comment: Optional[str] = None
    category: Optional[LibraryBookCategory] = None
    pageCount: Optional[int] = Field(None, alias="page_count")
    language: Optional[str] = None
    condition: Optional[str] = None
    availabilityMode: Optional[str] = Field(None, alias="availability_mode")
    availableFrom: Optional[str] = Field(None, alias="available_from")
    status: Optional[str] = None
    defaultLoanDays: Optional[int] = Field(None, alias="default_loan_days")

    class Config:
        populate_by_name = True


class UpdateBookAvailabilityRequest(BaseModel):
    availabilityMode: Optional[str] = Field(None, alias="availability_mode")
    availableFrom: Optional[str] = Field(None, alias="available_from")
    status: Optional[str] = None

    class Config:
        populate_by_name = True


class BookResponse(BookBase):
    id: str
    ownerId: str = Field(..., alias="owner_id")
    owner: Optional["LibraryMemberSummary"] = None
    status: str
    imageUrl: Optional[str] = Field(None, alias="image_url")
    isAvailableNow: bool = Field(..., alias="is_available_now")
    hasMyActiveRequest: bool = Field(False, alias="has_my_active_request")
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class LibraryMemberSummary(BaseModel):
    id: str
    firstName: str = Field(..., alias="first_name")
    lastName: str = Field(..., alias="last_name")

    class Config:
        populate_by_name = True


class BookRequestResponse(BaseModel):
    id: str
    bookId: str = Field(..., alias="book_id")
    requesterId: str = Field(..., alias="requester_id")
    requester: Optional[LibraryMemberSummary] = None
    status: str
    queuePosition: Optional[int] = Field(None, alias="queue_position")
    offeredAt: Optional[str] = Field(None, alias="offered_at")
    offerExpiresAt: Optional[str] = Field(None, alias="offer_expires_at")
    acceptedAt: Optional[str] = Field(None, alias="accepted_at")
    cancelledAt: Optional[str] = Field(None, alias="cancelled_at")
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class CreateLoanRequest(BaseModel):
    plannedStartAt: Optional[str] = Field(None, alias="planned_start_at")
    dueDays: Optional[int] = Field(None, alias="due_days")

    class Config:
        populate_by_name = True


class BookLoanResponse(BaseModel):
    id: str
    bookId: str = Field(..., alias="book_id")
    ownerId: str = Field(..., alias="owner_id")
    owner: Optional[LibraryMemberSummary] = None
    borrowerId: str = Field(..., alias="borrower_id")
    borrower: Optional[LibraryMemberSummary] = None
    sourceRequestId: Optional[str] = Field(None, alias="source_request_id")
    status: str
    plannedStartAt: Optional[str] = Field(None, alias="planned_start_at")
    startedAt: Optional[str] = Field(None, alias="started_at")
    dueAt: Optional[str] = Field(None, alias="due_at")
    returnedAt: Optional[str] = Field(None, alias="returned_at")
    ownerHandoverConfirmedAt: Optional[str] = Field(None, alias="owner_handover_confirmed_at")
    borrowerHandoverConfirmedAt: Optional[str] = Field(None, alias="borrower_handover_confirmed_at")
    borrowerReturnConfirmedAt: Optional[str] = Field(None, alias="borrower_return_confirmed_at")
    ownerReturnConfirmedAt: Optional[str] = Field(None, alias="owner_return_confirmed_at")
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class CreateWishlistItemRequest(BaseModel):
    title: str
    author: Optional[str] = None
    category: Optional[LibraryBookCategory] = None
    comment: Optional[str] = None


class UpdateWishlistItemRequest(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[LibraryBookCategory] = None
    comment: Optional[str] = None
    isActive: Optional[bool] = Field(None, alias="is_active")

    class Config:
        populate_by_name = True


class WishlistItemResponse(BaseModel):
    id: str
    userId: str = Field(..., alias="user_id")
    title: str
    author: Optional[str] = None
    category: Optional[LibraryBookCategory] = None
    comment: Optional[str] = None
    isActive: bool = Field(..., alias="is_active")
    createdAt: Optional[str] = Field(None, alias="created_at")
    updatedAt: Optional[str] = Field(None, alias="updated_at")

    class Config:
        from_attributes = True
        populate_by_name = True


class LibraryNotificationResponse(BaseModel):
    id: str
    userId: str = Field(..., alias="user_id")
    type: str
    payload: Optional[dict] = Field(None, alias="payload_json")
    sentAt: Optional[str] = Field(None, alias="sent_at")
    readAt: Optional[str] = Field(None, alias="read_at")
    createdAt: Optional[str] = Field(None, alias="created_at")

    class Config:
        from_attributes = True
        populate_by_name = True

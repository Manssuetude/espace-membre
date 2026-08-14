from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional
from datetime import datetime, timezone, timedelta
import logging
from app.services.email_service import EmailService

from app.models.library import (
    Book,
    BookRequest,
    BookLoan,
    BookWishlistItem,
    BookNotification,
)
from app.models.user import User
from app.schemas.library import (
    CreateBookRequest,
    UpdateBookRequest,
    UpdateBookAvailabilityRequest,
    CreateLoanRequest,
    LibraryMemberSummary,
    BookResponse,
    BookRequestResponse,
    BookLoanResponse,
    CreateWishlistItemRequest,
    UpdateWishlistItemRequest,
    WishlistItemResponse,
    LibraryNotificationResponse,
)
from app.schemas.common import PaginatedResponse
from app.core.cache import list_cache
from app.services.r2_storage_service import R2StorageService

logger = logging.getLogger(__name__)


class LibraryService:
    def __init__(self, db: Session):
        self.db = db
        self.storage_service = R2StorageService()

    def _invalidate_cache(self):
        list_cache.invalidate_pattern("library_books_list")
        list_cache.invalidate_pattern("library_notifications")
        list_cache.invalidate_pattern("library_wishlist")

    def _calculate_default_loan_days(self, page_count: Optional[int]) -> int:
        if not page_count or page_count <= 0:
            return 21
        if page_count <= 200:
            return 14
        if page_count <= 400:
            return 21
        return 30

    def _default_offer_hours(self) -> int:
        return 24

    def _max_concurrent_loans_per_borrower(self) -> int:
        return 2

    def _parse_datetime(self, value: str) -> datetime:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is not None:
            return dt.astimezone(timezone.utc).replace(tzinfo=None)
        return dt

    def _is_available_now(self, book: Book) -> bool:
        if book.status != "available":
            return False
        if book.availability_mode == "paused":
            return False
        if book.availability_mode == "from_date":
            if not book.available_from:
                return False
            return book.available_from <= datetime.utcnow()
        return True

    def _request_to_dict(self, request: BookRequest) -> BookRequestResponse:
        requester = self.db.query(User).filter(User.id == request.requester_id).first()
        requester_summary = None
        if requester:
            requester_summary = LibraryMemberSummary(
                id=str(requester.id),
                firstName=requester.first_name,
                lastName=requester.last_name,
            )
        return BookRequestResponse(
            id=str(request.id),
            bookId=str(request.book_id),
            requesterId=str(request.requester_id),
            requester=requester_summary,
            status=request.status,
            queuePosition=request.queue_position,
            offeredAt=request.offered_at.isoformat() if request.offered_at else None,
            offerExpiresAt=request.offer_expires_at.isoformat() if request.offer_expires_at else None,
            acceptedAt=request.accepted_at.isoformat() if request.accepted_at else None,
            cancelledAt=request.cancelled_at.isoformat() if request.cancelled_at else None,
            createdAt=request.created_at.isoformat() if request.created_at else None,
            updatedAt=request.updated_at.isoformat() if request.updated_at else None,
        )

    def _loan_to_dict(self, loan: BookLoan) -> BookLoanResponse:
        owner = self.db.query(User).filter(User.id == loan.owner_id).first()
        borrower = self.db.query(User).filter(User.id == loan.borrower_id).first()
        owner_summary = None
        borrower_summary = None
        if owner:
            owner_summary = LibraryMemberSummary(
                id=str(owner.id),
                firstName=owner.first_name,
                lastName=owner.last_name,
            )
        if borrower:
            borrower_summary = LibraryMemberSummary(
                id=str(borrower.id),
                firstName=borrower.first_name,
                lastName=borrower.last_name,
            )
        return BookLoanResponse(
            id=str(loan.id),
            bookId=str(loan.book_id),
            ownerId=str(loan.owner_id),
            owner=owner_summary,
            borrowerId=str(loan.borrower_id),
            borrower=borrower_summary,
            sourceRequestId=str(loan.source_request_id) if loan.source_request_id else None,
            status=loan.status,
            plannedStartAt=loan.planned_start_at.isoformat() if loan.planned_start_at else None,
            startedAt=loan.started_at.isoformat() if loan.started_at else None,
            dueAt=loan.due_at.isoformat() if loan.due_at else None,
            returnedAt=loan.returned_at.isoformat() if loan.returned_at else None,
            ownerHandoverConfirmedAt=loan.owner_handover_confirmed_at.isoformat() if loan.owner_handover_confirmed_at else None,
            borrowerHandoverConfirmedAt=loan.borrower_handover_confirmed_at.isoformat() if loan.borrower_handover_confirmed_at else None,
            borrowerReturnConfirmedAt=loan.borrower_return_confirmed_at.isoformat() if loan.borrower_return_confirmed_at else None,
            ownerReturnConfirmedAt=loan.owner_return_confirmed_at.isoformat() if loan.owner_return_confirmed_at else None,
            createdAt=loan.created_at.isoformat() if loan.created_at else None,
            updatedAt=loan.updated_at.isoformat() if loan.updated_at else None,
        )

    def _wishlist_to_dict(self, item: BookWishlistItem) -> WishlistItemResponse:
        return WishlistItemResponse(
            id=str(item.id),
            userId=str(item.user_id),
            title=item.title,
            author=item.author,
            category=item.category,
            comment=item.comment,
            isActive=item.is_active,
            createdAt=item.created_at.isoformat() if item.created_at else None,
            updatedAt=item.updated_at.isoformat() if item.updated_at else None,
        )

    def _notification_to_dict(self, notification: BookNotification) -> LibraryNotificationResponse:
        return LibraryNotificationResponse(
            id=str(notification.id),
            userId=str(notification.user_id),
            type=notification.type,
            payload=notification.payload_json,
            sentAt=notification.sent_at.isoformat() if notification.sent_at else None,
            readAt=notification.read_at.isoformat() if notification.read_at else None,
            createdAt=notification.created_at.isoformat() if notification.created_at else None,
        )

    def _create_notification(
        self,
        user_id: str,
        type_: str,
        payload: Optional[dict] = None,
        mark_sent: bool = True,
    ):
        notification = BookNotification(
            user_id=user_id,
            type=type_,
            payload_json=payload or {},
            sent_at=datetime.utcnow() if mark_sent else None,
        )
        self.db.add(notification)

    def _send_library_email(
        self,
        user_id: str,
        email_method: str,
        **kwargs,
    ):
        """
        Send transactional library email to a user if possible.
        Email failures are logged and do not break business flows.
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.email:
                return


            email_service = EmailService()
            method = getattr(email_service, email_method, None)
            if not method:
                logger.warning(f"Email method not found: {email_method}")
                return

            method(
                to_email=user.email,
                to_name=f"{user.first_name} {user.last_name}",
                **kwargs,
            )
        except Exception as e:
            logger.error(f"Failed to send library email via {email_method} to {user_id}: {str(e)}")

    def _notify_queue_offer(self, request: BookRequest):
        book = self.db.query(Book).filter(Book.id == request.book_id).first()
        payload = {
            "bookId": str(request.book_id),
            "requestId": str(request.id),
            "title": book.title if book else None,
            "offerExpiresAt": request.offer_expires_at.isoformat() if request.offer_expires_at else None,
        }
        self._create_notification(
            user_id=str(request.requester_id),
            type_="queue_offer",
            payload=payload,
        )
        self._send_library_email(
            user_id=str(request.requester_id),
            email_method="send_library_queue_offer_email",
            book_title=book.title if book else "Livre",
            offer_expires_at=request.offer_expires_at.isoformat() if request.offer_expires_at else None,
        )

    def _notify_owner_request_ready(self, book: Book, request: BookRequest):
        requester = self.db.query(User).filter(User.id == request.requester_id).first()
        requester_name = None
        if requester:
            requester_name = f"{requester.first_name} {requester.last_name}".strip()

        payload = {
            "bookId": str(book.id),
            "requestId": str(request.id),
            "requesterId": str(request.requester_id),
            "requesterName": requester_name,
            "title": book.title,
        }
        self._create_notification(
            user_id=str(book.owner_id),
            type_="owner_request_ready",
            payload=payload,
        )
        self._send_library_email(
            user_id=str(book.owner_id),
            email_method="send_library_owner_request_ready_email",
            book_title=book.title or "Livre",
            requester_name=requester_name,
        )

    def _resolve_loan_duration_days(self, loan: BookLoan, book: Optional[Book] = None) -> int:
        # Keep user-selected duration (dueDays) when available by deriving from initial schedule.
        if loan.due_at and loan.planned_start_at:
            delta_days = int(round((loan.due_at - loan.planned_start_at).total_seconds() / 86400))
            if delta_days > 0:
                return delta_days
        if loan.due_at and loan.created_at:
            delta_days = int(round((loan.due_at - loan.created_at).total_seconds() / 86400))
            if delta_days > 0:
                return delta_days
        if book and book.default_loan_days:
            return book.default_loan_days
        if book:
            return self._calculate_default_loan_days(book.page_count)
        return 21

    def _notify_loan_created(self, loan: BookLoan, book: Optional[Book]):
        title = book.title if book and book.title else "Livre"
        due_at = loan.due_at.isoformat() if loan.due_at else None
        payload = {
            "loanId": str(loan.id),
            "bookId": str(loan.book_id),
            "title": title,
            "status": loan.status,
            "dueAt": due_at,
        }
        # Notify borrower
        self._create_notification(
            user_id=str(loan.borrower_id),
            type_="loan_created",
            payload=payload,
        )
        self._send_library_email(
            user_id=str(loan.borrower_id),
            email_method="send_library_loan_created_email",
            book_title=title,
            due_at=due_at,
            role="borrower",
        )
        # Notify owner
        self._create_notification(
            user_id=str(loan.owner_id),
            type_="loan_created",
            payload=payload,
        )
        self._send_library_email(
            user_id=str(loan.owner_id),
            email_method="send_library_loan_created_email",
            book_title=title,
            due_at=due_at,
            role="owner",
        )

    def _activate_loan(self, loan: BookLoan, book: Optional[Book], started_at: datetime):
        loan.status = "active"
        loan.started_at = started_at
        duration_days = self._resolve_loan_duration_days(loan, book)
        loan.due_at = started_at + timedelta(days=duration_days)
        if book:
            book.status = "loaned"

    def _notify_wishlist_matches_for_book(self, book: Book):
        if not book.title:
            return
        match_clauses = [BookWishlistItem.title.ilike(f"%{book.title}%")]
        if book.author:
            match_clauses.append(
                and_(
                    BookWishlistItem.author.isnot(None),
                    BookWishlistItem.author.ilike(f"%{book.author}%"),
                )
            )
        matching_items = (
            self.db.query(BookWishlistItem)
            .filter(
                BookWishlistItem.is_active == True,
                BookWishlistItem.user_id != book.owner_id,
                or_(*match_clauses),
            )
            .all()
        )

        notified_users = set()
        for item in matching_items:
            if str(item.user_id) in notified_users:
                continue
            notified_users.add(str(item.user_id))
            payload = {
                "bookId": str(book.id),
                "wishlistItemId": str(item.id),
                "title": book.title,
                "author": book.author,
                "ownerId": str(book.owner_id),
            }
            self._create_notification(
                user_id=str(item.user_id),
                type_="wishlist_match",
                payload=payload,
            )
            self._send_library_email(
                user_id=str(item.user_id),
                email_method="send_library_wishlist_match_email",
                book_title=book.title,
                book_author=book.author,
            )

    def _book_has_open_loan(self, book_id: str) -> bool:
        open_statuses = ["pending_handover", "active", "pending_return"]
        return (
            self.db.query(BookLoan)
            .filter(BookLoan.book_id == book_id, BookLoan.status.in_(open_statuses))
            .first()
            is not None
        )

    def _borrower_open_loan_count(self, borrower_id: str) -> int:
        open_statuses = ["pending_handover", "active", "pending_return"]
        return (
            self.db.query(BookLoan)
            .filter(
                BookLoan.borrower_id == borrower_id,
                BookLoan.status.in_(open_statuses),
            )
            .count()
        )

    def _promote_next_and_update_book_status(self, book: Book):
        self._resequence_queue(str(book.id))
        if self._has_active_offer_or_accept(str(book.id)):
            book.status = "reserved"
            return

        promoted = self._promote_next_request(str(book.id))
        if promoted:
            book.status = "reserved"
        else:
            if book.availability_mode == "paused":
                book.status = "paused"
            else:
                book.status = "available"

    def _active_request_exists(self, book_id: str, requester_id: str) -> bool:
        active_statuses = ["queued", "offered", "accepted"]
        request = (
            self.db.query(BookRequest)
            .filter(
                BookRequest.book_id == book_id,
                BookRequest.requester_id == requester_id,
                BookRequest.status.in_(active_statuses),
            )
            .first()
        )
        return request is not None

    def _user_has_active_request_for_book(self, book_id: str, user_id: Optional[str]) -> bool:
        if not user_id:
            return False
        active_statuses = ["queued", "offered", "accepted"]
        return (
            self.db.query(BookRequest)
            .filter(
                BookRequest.book_id == book_id,
                BookRequest.requester_id == user_id,
                BookRequest.status.in_(active_statuses),
            )
            .first()
            is not None
        )

    def _has_active_offer_or_accept(
        self, book_id: str, exclude_request_id: Optional[str] = None
    ) -> bool:
        query = self.db.query(BookRequest).filter(
            BookRequest.book_id == book_id,
            BookRequest.status.in_(["offered", "accepted"]),
        )
        if exclude_request_id:
            query = query.filter(BookRequest.id != exclude_request_id)
        request = query.first()
        return request is not None

    def _next_queue_position(self, book_id: str) -> int:
        max_position = (
            self.db.query(func.max(BookRequest.queue_position))
            .filter(
                BookRequest.book_id == book_id,
                BookRequest.status == "queued",
            )
            .scalar()
        )
        return (max_position or 0) + 1

    def _resequence_queue(self, book_id: str):
        queued = (
            self.db.query(BookRequest)
            .filter(BookRequest.book_id == book_id, BookRequest.status == "queued")
            .order_by(BookRequest.created_at.asc())
            .all()
        )
        for idx, req in enumerate(queued, start=1):
            req.queue_position = idx

    def _promote_next_request(self, book_id: str) -> Optional[BookRequest]:
        """
        Promote earliest queued request to accepted.
        Returns promoted request, if any.
        """
        next_req = (
            self.db.query(BookRequest)
            .filter(BookRequest.book_id == book_id, BookRequest.status == "queued")
            .order_by(BookRequest.queue_position.asc(), BookRequest.created_at.asc())
            .first()
        )
        if not next_req:
            return None

        now = datetime.utcnow()
        next_req.status = "accepted"
        next_req.accepted_at = now
        next_req.offered_at = None
        next_req.offer_expires_at = None
        next_req.queue_position = None
        next_req.updated_at = now
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if book:
            self._notify_owner_request_ready(book, next_req)
        return next_req

    def _expire_overdue_offers(self, book_id: str):
        now = datetime.utcnow()
        overdue_offers = (
            self.db.query(BookRequest)
            .filter(
                BookRequest.book_id == book_id,
                BookRequest.status == "offered",
                BookRequest.offer_expires_at.isnot(None),
                BookRequest.offer_expires_at < now,
            )
            .all()
        )
        expired_any = False
        for req in overdue_offers:
            req.status = "expired"
            req.updated_at = now
            expired_any = True

        if expired_any:
            self._resequence_queue(book_id)
            # If no accepted request, offer to next in queue.
            if not self._has_active_offer_or_accept(book_id):
                promoted = self._promote_next_request(book_id)
                book = self.db.query(Book).filter(Book.id == book_id).first()
                if book:
                    if promoted:
                        book.status = "reserved"
                    elif book.status in ["reserved"]:
                        book.status = "available"
            self.db.commit()
            self._invalidate_cache()

    def get_books(
        self,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = "all",
        owner_id: Optional[str] = None,
        exclude_owner_id: Optional[str] = None,
        viewer_user_id: Optional[str] = None,
        available_only: bool = False,
        page: int = 1,
        limit: int = 10,
    ) -> PaginatedResponse[BookResponse]:
        cache_key = (
            f"library_books_list_search:{search or ''}_category:{category or ''}"
            f"_status:{status or 'all'}_owner:{owner_id or ''}_exclude_owner:{exclude_owner_id or ''}"
            f"_viewer:{viewer_user_id or ''}"
            f"_available:{available_only}"
            f"_page:{page}_limit:{limit}"
        )
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        query = self.db.query(Book)

        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Book.title.ilike(search_term),
                    Book.author.ilike(search_term),
                    Book.description.ilike(search_term),
                    Book.category.ilike(search_term),
                )
            )

        if category:
            query = query.filter(Book.category == category)

        if status and status != "all":
            query = query.filter(Book.status == status)

        if owner_id:
            query = query.filter(Book.owner_id == owner_id)
        if exclude_owner_id:
            query = query.filter(Book.owner_id != exclude_owner_id)

        if available_only:
            now = datetime.utcnow()
            query = query.filter(
                Book.status == "available",
                Book.availability_mode != "paused",
                or_(
                    Book.availability_mode != "from_date",
                    Book.available_from <= now,
                ),
            )

        total = query.count()
        offset = (page - 1) * limit
        books = (
            query.order_by(Book.created_at.desc()).offset(offset).limit(limit).all()
        )

        data = [self._book_to_dict(book, viewer_user_id=viewer_user_id) for book in books]

        result = PaginatedResponse(
            data=data,
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )
        list_cache.set(cache_key, result)
        return result

    def get_book_by_id(self, book_id: str, viewer_user_id: Optional[str] = None) -> Optional[BookResponse]:
        self._expire_overdue_offers(book_id)
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            return None
        return self._book_to_dict(book, viewer_user_id=viewer_user_id)

    def create_book(
        self,
        data: CreateBookRequest,
        owner_id: str,
        image_url: Optional[str] = None,
    ) -> BookResponse:
        if data.pageCount is not None and data.pageCount <= 0:
            raise ValueError("pageCount must be a positive integer")

        availability_mode = data.availabilityMode
        status = "paused" if availability_mode == "paused" else "available"
        default_loan_days = (
            data.defaultLoanDays
            if data.defaultLoanDays is not None
            else self._calculate_default_loan_days(data.pageCount)
        )

        if default_loan_days < 7 or default_loan_days > 90:
            raise ValueError("defaultLoanDays must be between 7 and 90")

        available_from_dt = None
        if data.availableFrom:
            available_from_dt = self._parse_datetime(data.availableFrom)

        book = Book(
            owner_id=owner_id,
            title=data.title,
            author=data.author,
            description=data.description,
            comment=data.comment,
            category=data.category,
            page_count=data.pageCount,
            language=data.language,
            condition=data.condition,
            image_url=image_url,
            availability_mode=availability_mode,
            available_from=available_from_dt,
            status=status,
            default_loan_days=default_loan_days,
        )
        self.db.add(book)
        self.db.commit()
        self.db.refresh(book)
        self._notify_wishlist_matches_for_book(book)
        self.db.commit()
        self._invalidate_cache()
        return self._book_to_dict(book)

    def update_book(
        self,
        book_id: str,
        data: UpdateBookRequest,
        image_url: Optional[str] = None,
    ) -> Optional[BookResponse]:
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            return None

        if data.pageCount is not None and data.pageCount <= 0:
            raise ValueError("pageCount must be a positive integer")

        if data.defaultLoanDays is not None:
            if data.defaultLoanDays < 7 or data.defaultLoanDays > 90:
                raise ValueError("defaultLoanDays must be between 7 and 90")

        if data.title is not None:
            book.title = data.title
        if data.author is not None:
            book.author = data.author
        if data.description is not None:
            book.description = data.description
        if data.comment is not None:
            book.comment = data.comment
        if data.category is not None:
            book.category = data.category
        if data.pageCount is not None:
            book.page_count = data.pageCount
        if data.language is not None:
            book.language = data.language
        if data.condition is not None:
            book.condition = data.condition
        if data.availabilityMode is not None:
            book.availability_mode = data.availabilityMode
        if data.availableFrom is not None:
            book.available_from = self._parse_datetime(data.availableFrom)
        if data.status is not None:
            book.status = data.status
        if data.defaultLoanDays is not None:
            book.default_loan_days = data.defaultLoanDays
        if image_url is not None:
            book.image_url = image_url

        if data.availabilityMode == "paused":
            book.status = "paused"
        elif data.availabilityMode in ["always", "from_date"] and book.status == "paused":
            book.status = "available"

        book.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(book)
        self._notify_wishlist_matches_for_book(book)
        self.db.commit()
        self._invalidate_cache()
        return self._book_to_dict(book)

    def update_book_availability(
        self,
        book_id: str,
        data: UpdateBookAvailabilityRequest,
    ) -> Optional[BookResponse]:
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            return None

        if data.availabilityMode is not None:
            book.availability_mode = data.availabilityMode

        if data.availableFrom is not None:
            book.available_from = self._parse_datetime(data.availableFrom)

        if data.status is not None:
            book.status = data.status

        if book.availability_mode == "paused":
            book.status = "paused"
        elif book.status == "paused":
            book.status = "available"

        book.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(book)
        self._invalidate_cache()
        return self._book_to_dict(book)

    def delete_book(self, book_id: str) -> bool:
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            return False
        self.db.delete(book)
        self.db.commit()
        self._invalidate_cache()
        return True

    def create_request(self, book_id: str, requester_id: str) -> BookRequestResponse:
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise ValueError("Book not found")

        if str(book.owner_id) == str(requester_id):
            raise ValueError("Owner cannot request their own book")

        self._expire_overdue_offers(book_id)

        if self._active_request_exists(book_id, requester_id):
            raise ValueError("You already have an active request for this book")

        now = datetime.utcnow()
        request = BookRequest(
            book_id=book_id,
            requester_id=requester_id,
            status="queued",
            queue_position=self._next_queue_position(book_id),
        )

        can_offer_now = (
            book.status == "available"
            and self._is_available_now(book)
            and not self._has_active_offer_or_accept(book_id)
        )
        if can_offer_now:
            request.status = "accepted"
            request.queue_position = None
            request.accepted_at = now
            request.offered_at = None
            request.offer_expires_at = None
            book.status = "reserved"

        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        if request.status == "accepted":
            self._notify_owner_request_ready(book, request)
            self.db.commit()
        self._invalidate_cache()
        return self._request_to_dict(request)

    def get_book_requests(self, book_id: str) -> list[BookRequestResponse]:
        self._expire_overdue_offers(book_id)
        requests = (
            self.db.query(BookRequest)
            .filter(BookRequest.book_id == book_id)
            .order_by(
                BookRequest.created_at.asc(),
            )
            .all()
        )
        return [self._request_to_dict(req) for req in requests]

    def cancel_request(self, request_id: str, actor_user_id: str, actor_role: str) -> Optional[BookRequestResponse]:
        request = self.db.query(BookRequest).filter(BookRequest.id == request_id).first()
        if not request:
            return None

        book = self.db.query(Book).filter(Book.id == request.book_id).first()
        if not book:
            return None

        is_admin = actor_role in ["admin", "super_admin"]
        is_requester = str(request.requester_id) == str(actor_user_id)
        is_owner = str(book.owner_id) == str(actor_user_id)
        if not (is_admin or is_requester or is_owner):
            raise ValueError("Not authorized to cancel this request")

        if request.status in ["cancelled", "expired", "fulfilled"]:
            raise ValueError("Request is already closed")

        now = datetime.utcnow()
        was_blocking = request.status in ["offered", "accepted"]
        request.status = "cancelled"
        request.cancelled_at = now
        request.updated_at = now

        self._resequence_queue(str(book.id))
        if was_blocking and not self._has_active_offer_or_accept(
            str(book.id), exclude_request_id=str(request.id)
        ):
            promoted = self._promote_next_request(str(book.id))
            if promoted:
                book.status = "reserved"
            elif book.status == "reserved":
                book.status = "available"

        self.db.commit()
        self.db.refresh(request)
        self._invalidate_cache()
        return self._request_to_dict(request)

    def expire_request(self, request_id: str) -> Optional[BookRequestResponse]:
        request = self.db.query(BookRequest).filter(BookRequest.id == request_id).first()
        if not request:
            return None

        if request.status != "offered":
            raise ValueError("Only offered requests can be expired")

        now = datetime.utcnow()
        request.status = "expired"
        request.updated_at = now

        book = self.db.query(Book).filter(Book.id == request.book_id).first()
        self._resequence_queue(str(request.book_id))
        promoted = None
        if not self._has_active_offer_or_accept(
            str(request.book_id), exclude_request_id=str(request.id)
        ):
            promoted = self._promote_next_request(str(request.book_id))
        if book:
            if promoted:
                book.status = "reserved"
            elif book.status == "reserved":
                book.status = "available"

        self.db.commit()
        self.db.refresh(request)
        self._invalidate_cache()
        return self._request_to_dict(request)

    def create_loan_from_request(
        self,
        request_id: str,
        actor_user_id: str,
        actor_role: str,
        payload: Optional[CreateLoanRequest] = None,
    ) -> Optional[BookLoanResponse]:
        request = self.db.query(BookRequest).filter(BookRequest.id == request_id).first()
        if not request:
            return None

        if request.status != "accepted":
            raise ValueError("Loan can only be created from an accepted request")

        book = self.db.query(Book).filter(Book.id == request.book_id).first()
        if not book:
            raise ValueError("Book not found")

        if str(book.owner_id) != str(actor_user_id):
            raise ValueError("Only the owner can create a loan from a request")

        if self._book_has_open_loan(str(book.id)):
            raise ValueError("This book already has an open loan")

        borrower_open_loans = self._borrower_open_loan_count(str(request.requester_id))
        max_concurrent_loans = self._max_concurrent_loans_per_borrower()
        if borrower_open_loans >= max_concurrent_loans:
            raise ValueError(
                f"Borrower has reached the maximum number of concurrent loans ({max_concurrent_loans})"
            )

        due_days = book.default_loan_days or self._calculate_default_loan_days(book.page_count)
        if payload and payload.dueDays is not None:
            if payload.dueDays < 1 or payload.dueDays > 120:
                raise ValueError("dueDays must be between 1 and 120")
            due_days = payload.dueDays

        planned_start_at = None
        if payload and payload.plannedStartAt:
            planned_start_at = self._parse_datetime(payload.plannedStartAt)

        now = datetime.utcnow()
        loan = BookLoan(
            book_id=book.id,
            owner_id=book.owner_id,
            borrower_id=request.requester_id,
            source_request_id=request.id,
            status="pending_handover",
            planned_start_at=planned_start_at,
            due_at=(planned_start_at or now) + timedelta(days=due_days),
        )
        request.status = "fulfilled"
        request.updated_at = now
        book.status = "reserved"
        self.db.add(loan)
        self.db.commit()
        self.db.refresh(loan)
        self._notify_loan_created(loan, book)
        self.db.commit()
        self._invalidate_cache()
        return self._loan_to_dict(loan)

    def get_loan_by_id(self, loan_id: str) -> Optional[BookLoanResponse]:
        loan = self.db.query(BookLoan).filter(BookLoan.id == loan_id).first()
        if not loan:
            return None
        return self._loan_to_dict(loan)

    def get_my_loans(
        self,
        user_id: str,
        role: str,
        status: Optional[str] = "all",
        page: int = 1,
        limit: int = 10,
    ) -> PaginatedResponse[BookLoanResponse]:
        query = self.db.query(BookLoan)
        if role not in ["admin", "super_admin"]:
            query = query.filter(
                or_(
                    BookLoan.owner_id == user_id,
                    BookLoan.borrower_id == user_id,
                )
            )
        if status and status != "all":
            query = query.filter(BookLoan.status == status)

        total = query.count()
        offset = (page - 1) * limit
        loans = (
            query.order_by(BookLoan.created_at.desc()).offset(offset).limit(limit).all()
        )
        return PaginatedResponse(
            data=[self._loan_to_dict(loan) for loan in loans],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )

    def confirm_handover_owner(self, loan_id: str, actor_user_id: str, actor_role: str) -> Optional[BookLoanResponse]:
        loan = self.db.query(BookLoan).filter(BookLoan.id == loan_id).first()
        if not loan:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(loan.owner_id) != str(actor_user_id):
            raise ValueError("Only owner can confirm owner handover")
        if loan.status != "pending_handover":
            raise ValueError("Loan is not awaiting handover confirmation")

        now = datetime.utcnow()
        loan.owner_handover_confirmed_at = now
        loan.updated_at = now
        if loan.borrower_handover_confirmed_at:
            book = self.db.query(Book).filter(Book.id == loan.book_id).first()
            self._activate_loan(loan, book, now)
        self.db.commit()
        self.db.refresh(loan)
        self._invalidate_cache()
        return self._loan_to_dict(loan)

    def confirm_handover_borrower(self, loan_id: str, actor_user_id: str, actor_role: str) -> Optional[BookLoanResponse]:
        loan = self.db.query(BookLoan).filter(BookLoan.id == loan_id).first()
        if not loan:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(loan.borrower_id) != str(actor_user_id):
            raise ValueError("Only borrower can confirm borrower handover")
        if loan.status != "pending_handover":
            raise ValueError("Loan is not awaiting handover confirmation")

        now = datetime.utcnow()
        loan.borrower_handover_confirmed_at = now
        loan.updated_at = now
        if loan.owner_handover_confirmed_at:
            book = self.db.query(Book).filter(Book.id == loan.book_id).first()
            self._activate_loan(loan, book, now)
        self.db.commit()
        self.db.refresh(loan)
        self._invalidate_cache()
        return self._loan_to_dict(loan)

    def initiate_return(self, loan_id: str, actor_user_id: str, actor_role: str) -> Optional[BookLoanResponse]:
        loan = self.db.query(BookLoan).filter(BookLoan.id == loan_id).first()
        if not loan:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(loan.borrower_id) != str(actor_user_id):
            raise ValueError("Only borrower can initiate return")
        if loan.status != "active":
            raise ValueError("Only active loans can initiate return")

        now = datetime.utcnow()
        loan.status = "pending_return"
        loan.borrower_return_confirmed_at = now
        loan.updated_at = now
        self.db.commit()
        self.db.refresh(loan)
        self._invalidate_cache()
        return self._loan_to_dict(loan)

    def confirm_return_owner(self, loan_id: str, actor_user_id: str, actor_role: str) -> Optional[BookLoanResponse]:
        loan = self.db.query(BookLoan).filter(BookLoan.id == loan_id).first()
        if not loan:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(loan.owner_id) != str(actor_user_id):
            raise ValueError("Only owner can confirm return")
        if loan.status != "pending_return":
            raise ValueError("Loan is not awaiting return confirmation")

        now = datetime.utcnow()
        loan.owner_return_confirmed_at = now
        loan.returned_at = now
        loan.status = "completed"
        loan.updated_at = now

        book = self.db.query(Book).filter(Book.id == loan.book_id).first()
        if book:
            self._promote_next_and_update_book_status(book)

        self.db.commit()
        self.db.refresh(loan)
        self._invalidate_cache()
        return self._loan_to_dict(loan)

    def cancel_loan(self, loan_id: str, actor_user_id: str, actor_role: str) -> Optional[BookLoanResponse]:
        loan = self.db.query(BookLoan).filter(BookLoan.id == loan_id).first()
        if not loan:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        is_owner = str(loan.owner_id) == str(actor_user_id)
        if not (is_admin or is_owner):
            raise ValueError("Only owner or admin can cancel loan")
        if loan.status in ["completed", "cancelled"]:
            raise ValueError("Loan is already closed")

        now = datetime.utcnow()
        loan.status = "cancelled"
        loan.updated_at = now

        book = self.db.query(Book).filter(Book.id == loan.book_id).first()
        if book:
            self._promote_next_and_update_book_status(book)

        self.db.commit()
        self.db.refresh(loan)
        self._invalidate_cache()
        return self._loan_to_dict(loan)

    def create_wishlist_item(
        self, user_id: str, data: CreateWishlistItemRequest
    ) -> WishlistItemResponse:
        item = BookWishlistItem(
            user_id=user_id,
            title=data.title,
            author=data.author,
            category=data.category,
            comment=data.comment,
            is_active=True,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        self._invalidate_cache()
        return self._wishlist_to_dict(item)

    def get_my_wishlist(self, user_id: str, active_only: bool = False) -> list[WishlistItemResponse]:
        query = self.db.query(BookWishlistItem).filter(BookWishlistItem.user_id == user_id)
        if active_only:
            query = query.filter(BookWishlistItem.is_active == True)
        items = query.order_by(BookWishlistItem.created_at.desc()).all()
        return [self._wishlist_to_dict(item) for item in items]

    def update_wishlist_item(
        self,
        item_id: str,
        user_id: str,
        data: UpdateWishlistItemRequest,
        actor_role: str,
    ) -> Optional[WishlistItemResponse]:
        item = self.db.query(BookWishlistItem).filter(BookWishlistItem.id == item_id).first()
        if not item:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(item.user_id) != str(user_id):
            raise ValueError("Not authorized to update this wishlist item")

        if data.title is not None:
            item.title = data.title
        if data.author is not None:
            item.author = data.author
        if data.category is not None:
            item.category = data.category
        if data.comment is not None:
            item.comment = data.comment
        if data.isActive is not None:
            item.is_active = data.isActive
        item.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(item)
        self._invalidate_cache()
        return self._wishlist_to_dict(item)

    def delete_wishlist_item(self, item_id: str, user_id: str, actor_role: str) -> bool:
        item = self.db.query(BookWishlistItem).filter(BookWishlistItem.id == item_id).first()
        if not item:
            return False
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(item.user_id) != str(user_id):
            raise ValueError("Not authorized to delete this wishlist item")
        self.db.delete(item)
        self.db.commit()
        self._invalidate_cache()
        return True

    def get_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> PaginatedResponse[LibraryNotificationResponse]:
        cache_key = f"library_notifications_user:{user_id}_unread:{unread_only}_page:{page}_limit:{limit}"
        cached_data = list_cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        query = self.db.query(BookNotification).filter(BookNotification.user_id == user_id)
        if unread_only:
            query = query.filter(BookNotification.read_at.is_(None))
        total = query.count()
        offset = (page - 1) * limit
        notifications = (
            query.order_by(BookNotification.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        result = PaginatedResponse(
            data=[self._notification_to_dict(n) for n in notifications],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit,
        )
        list_cache.set(cache_key, result)
        return result

    def mark_notification_read(self, notification_id: str, user_id: str, actor_role: str) -> Optional[LibraryNotificationResponse]:
        notification = self.db.query(BookNotification).filter(BookNotification.id == notification_id).first()
        if not notification:
            return None
        is_admin = actor_role in ["admin", "super_admin"]
        if not is_admin and str(notification.user_id) != str(user_id):
            raise ValueError("Not authorized to update this notification")
        notification.read_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(notification)
        self._invalidate_cache()
        return self._notification_to_dict(notification)

    def send_due_reminders(self, days_before: int = 3) -> dict:
        if days_before < 0 or days_before > 30:
            raise ValueError("days_before must be between 0 and 30")

        now = datetime.utcnow()
        start = now
        end = now + timedelta(days=days_before)
        loans = (
            self.db.query(BookLoan)
            .filter(
                BookLoan.status == "active",
                BookLoan.due_at.isnot(None),
                BookLoan.due_at >= start,
                BookLoan.due_at <= end,
            )
            .all()
        )

        created = 0
        for loan in loans:
            borrower = self.db.query(User).filter(User.id == loan.borrower_id).first()
            book = self.db.query(Book).filter(Book.id == loan.book_id).first()
            payload = {
                "loanId": str(loan.id),
                "bookId": str(loan.book_id),
                "title": book.title if book else None,
                "dueAt": loan.due_at.isoformat() if loan.due_at else None,
            }
            self._create_notification(
                user_id=str(loan.borrower_id),
                type_="loan_due_reminder",
                payload=payload,
            )
            self._send_library_email(
                user_id=str(loan.borrower_id),
                email_method="send_library_loan_due_reminder_email",
                book_title=book.title if book else "Livre",
                due_at=loan.due_at.isoformat() if loan.due_at else None,
            )
            created += 1
        self.db.commit()
        self._invalidate_cache()
        return {"remindersCreated": created}

    def _book_to_dict(self, book: Book, viewer_user_id: Optional[str] = None) -> BookResponse:
        signed_image_url = self.storage_service.generate_signed_url(book.image_url)
        owner = self.db.query(User).filter(User.id == book.owner_id).first()
        owner_summary = None
        if owner:
            owner_summary = LibraryMemberSummary(
                id=str(owner.id),
                firstName=owner.first_name,
                lastName=owner.last_name,
            )
        return BookResponse(
            id=str(book.id),
            ownerId=str(book.owner_id),
            owner=owner_summary,
            title=book.title,
            author=book.author,
            description=book.description,
            comment=book.comment,
            category=book.category,
            pageCount=book.page_count,
            language=book.language,
            condition=book.condition,
            imageUrl=signed_image_url,
            availabilityMode=book.availability_mode,
            availableFrom=book.available_from.isoformat() if book.available_from else None,
            status=book.status,
            defaultLoanDays=book.default_loan_days,
            isAvailableNow=self._is_available_now(book),
            hasMyActiveRequest=self._user_has_active_request_for_book(str(book.id), viewer_user_id),
            createdAt=book.created_at.isoformat() if book.created_at else None,
            updatedAt=book.updated_at.isoformat() if book.updated_at else None,
        )

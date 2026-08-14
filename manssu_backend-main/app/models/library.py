from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base
import uuid
from datetime import datetime


class Book(Base):
    __tablename__ = "books"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    page_count = Column(Integer, nullable=True)
    language = Column(String(50), nullable=True)
    condition = Column(String(30), nullable=True)
    image_url = Column(String(500), nullable=True)
    availability_mode = Column(
        String(20), nullable=False, default="always", index=True
    )  # always, from_date, paused
    available_from = Column(DateTime, nullable=True, index=True)
    status = Column(
        String(20), nullable=False, default="available", index=True
    )  # available, reserved, loaned, paused
    default_loan_days = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_books_owner_status", "owner_id", "status"),
        Index("idx_books_category_status", "category", "status"),
    )


class BookRequest(Base):
    __tablename__ = "book_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requester_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(
        String(20), nullable=False, default="queued", index=True
    )  # queued, offered, accepted, expired, cancelled, fulfilled
    queue_position = Column(Integer, nullable=True, index=True)
    offered_at = Column(DateTime, nullable=True)
    offer_expires_at = Column(DateTime, nullable=True, index=True)
    accepted_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_book_requests_book_status", "book_id", "status"),
        Index("idx_book_requests_book_queue", "book_id", "queue_position"),
    )


class BookLoan(Base):
    __tablename__ = "book_loans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(
        UUID(as_uuid=True),
        ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    borrower_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_request_id = Column(
        UUID(as_uuid=True),
        ForeignKey("book_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status = Column(
        String(30), nullable=False, default="pending_handover", index=True
    )  # pending_handover, active, pending_return, completed, cancelled
    planned_start_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    due_at = Column(DateTime, nullable=True, index=True)
    returned_at = Column(DateTime, nullable=True)
    owner_handover_confirmed_at = Column(DateTime, nullable=True)
    borrower_handover_confirmed_at = Column(DateTime, nullable=True)
    borrower_return_confirmed_at = Column(DateTime, nullable=True)
    owner_return_confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_book_loans_book_status", "book_id", "status"),
        Index("idx_book_loans_owner_status", "owner_id", "status"),
        Index("idx_book_loans_borrower_status", "borrower_id", "status"),
    )


class BookWishlistItem(Base):
    __tablename__ = "book_wishlist_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=True, index=True)
    category = Column(String(100), nullable=True, index=True)
    comment = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_book_wishlist_user_active", "user_id", "is_active"),
    )


class BookNotification(Base):
    __tablename__ = "book_notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(String(50), nullable=False, index=True)
    payload_json = Column(JSONB, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_book_notifications_user_created", "user_id", "created_at"),
    )

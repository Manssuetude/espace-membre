# Library Lending Feature - Implementation Plan

## 1. Goal

Add a "Library" module that lets members lend books to each other with:

- Book listings (owner posts lendable books)
- Claim/request flow with first-come-first-served behavior
- Waiting list
- Dual confirmation for handover and return
- Automatic notifications (queue priority first, then wider audience)
- Wishlist ("books I want to read/find")


## 2. Scope (MVP)

### In Scope

1. Members create/edit/pause book listings with metadata and image.
2. Members request books.
3. Queue management:
   - first eligible requester gets an offer window first
   - expiration moves to next requester automatically
4. Loan lifecycle:
   - pending handover -> active -> pending return -> completed
   - owner + borrower confirmations required at handover and return
5. Wishlist entries and matching notifications.
6. Admin moderation (delete listing, cancel abusive requests/loans).

### Out of Scope (Phase 2+)

1. Fines/payments.
2. Session-presence automation.
3. Reputation scoring.
4. Advanced recommendations/ML matching.


## 3. Roles & Permissions

- `member`: full feature usage (list, request, confirm, wishlist).
- `guest`: read-only catalog and wishlist browse (optional) OR no access (recommended for MVP: no access).
- `admin` / `super_admin`: moderation, manual status override, queue cleanup.

Recommended default: only `member`, `admin`, `super_admin` can participate in lending transactions.


## 4. Core Business Rules

1. **Ownership**: only owner can update listing availability and confirm handover/return as owner.
2. **First claim priority**: requests are ordered by `created_at`.
3. **Offer window**:
   - when a book becomes available, first waiting requester gets exclusive window (e.g. 24h).
   - if expired/no response, next requester is offered.
4. **Dual confirmation**:
   - handover: owner confirms `given`, requester confirms `received`.
   - return: borrower confirms `returned`, owner confirms `received_back`.
5. **Single active loan per listing**.
6. **Duration policy**:
   - default based on page count:
     - `<= 200`: 14 days
     - `201 - 400`: 21 days
     - `> 400`: 30 days
   - owner may override within min/max guardrails.
7. **Notification priority**:
   - notify next queue member first.
   - only after timeout notify broader audience for open availability.


## 5. Data Model

## 5.1 Tables

### `books`
- `id` (UUID PK)
- `owner_id` (FK users.id, indexed)
- `title` (varchar 255, indexed)
- `author` (varchar 255, indexed)
- `description` (text nullable)
- `comment` (text nullable)
- `category` (varchar 100, indexed)
- `page_count` (int nullable)
- `language` (varchar 50 nullable)
- `condition` (varchar 30 nullable; new/good/fair)
- `image_url` (varchar 500 nullable)
- `availability_mode` (varchar 20; always/from_date/paused)
- `available_from` (timestamp nullable)
- `status` (varchar 20; available/reserved/loaned/paused, indexed)
- `default_loan_days` (int nullable)
- `created_at`, `updated_at`

### `book_requests`
- `id` (UUID PK)
- `book_id` (FK books.id, indexed)
- `requester_id` (FK users.id, indexed)
- `status` (queued/offered/accepted/expired/cancelled/fulfilled, indexed)
- `queue_position` (int nullable, indexed)
- `offered_at` (timestamp nullable)
- `offer_expires_at` (timestamp nullable)
- `accepted_at` (timestamp nullable)
- `cancelled_at` (timestamp nullable)
- `created_at`, `updated_at`
- unique active-request constraint per `(book_id, requester_id)` for statuses `{queued,offered,accepted}`

### `book_loans`
- `id` (UUID PK)
- `book_id` (FK books.id, indexed)
- `owner_id` (FK users.id, indexed)
- `borrower_id` (FK users.id, indexed)
- `source_request_id` (FK book_requests.id nullable)
- `status` (pending_handover/active/pending_return/completed/cancelled/disputed, indexed)
- `planned_start_at` (timestamp nullable)
- `started_at` (timestamp nullable)
- `due_at` (timestamp nullable, indexed)
- `returned_at` (timestamp nullable)
- `owner_handover_confirmed_at` (timestamp nullable)
- `borrower_handover_confirmed_at` (timestamp nullable)
- `borrower_return_confirmed_at` (timestamp nullable)
- `owner_return_confirmed_at` (timestamp nullable)
- `created_at`, `updated_at`

### `book_wishlist_items`
- `id` (UUID PK)
- `user_id` (FK users.id, indexed)
- `title` (varchar 255, indexed)
- `author` (varchar 255 nullable, indexed)
- `category` (varchar 100 nullable, indexed)
- `comment` (text nullable)
- `is_active` (bool default true, indexed)
- `created_at`, `updated_at`

### `book_notifications` (optional but recommended)
- `id` (UUID PK)
- `user_id` (FK users.id, indexed)
- `type` (queue_offer/queue_moved/book_available/wishlist_match/loan_due/etc.)
- `payload_json` (jsonb)
- `sent_at` (timestamp nullable)
- `read_at` (timestamp nullable)
- `created_at`


## 6. State Machines

## 6.1 Book status

- `available` -> `reserved` (when a request is offered/accepted)
- `reserved` -> `loaned` (handover confirmed by both)
- `loaned` -> `available` (return confirmed by both)
- any -> `paused` (owner/admin)
- `paused` -> `available` (owner/admin)

## 6.2 Request status

- `queued` -> `offered`
- `offered` -> `accepted` or `expired` or `cancelled`
- `accepted` -> `fulfilled` (loan created/started)
- `queued` -> `cancelled`

## 6.3 Loan status

- `pending_handover` -> `active` (dual handover confirmation)
- `active` -> `pending_return` (borrower marks return initiated)
- `pending_return` -> `completed` (owner confirms return)
- exceptional -> `cancelled` / `disputed`


## 7. API Design (v1)

Base prefix: `/api/v1/library`

## 7.1 Books

1. `GET /books`
   - filters: `search`, `category`, `status`, `ownerId`, `availableOnly`, `page`, `limit`
2. `GET /books/{book_id}`
3. `POST /books` (member+)
4. `PATCH /books/{book_id}` (owner/admin)
5. `PATCH /books/{book_id}/availability` (owner/admin)
6. `DELETE /books/{book_id}` (owner/admin)

## 7.2 Requests / Queue

1. `POST /books/{book_id}/request` (member+)
2. `GET /books/{book_id}/requests` (owner/admin; requester sees own rank only)
3. `POST /requests/{request_id}/cancel` (requester/owner/admin by context)
4. `POST /requests/{request_id}/expire` (internal/admin, legacy recovery)

## 7.3 Loans

1. `GET /loans/me` (member+)
2. `GET /loans/{loan_id}` (owner/borrower/admin)
3. `POST /loans/{loan_id}/confirm-handover/owner`
4. `POST /loans/{loan_id}/confirm-handover/borrower`
5. `POST /loans/{loan_id}/initiate-return` (borrower)
6. `POST /loans/{loan_id}/confirm-return/owner`
7. `POST /loans/{loan_id}/cancel` (admin or owner before active)

## 7.4 Wishlist

1. `GET /wishlist/me`
2. `POST /wishlist`
3. `PATCH /wishlist/{item_id}`
4. `DELETE /wishlist/{item_id}`
5. `GET /wishlist/matches` (optional member endpoint for own matches)

## 7.5 Notifications

1. `GET /notifications/library`
2. `POST /notifications/library/{id}/read`


## 8. Service Layer Plan

Create:

- `app/services/library_service.py`
- `app/services/library_queue_service.py` (or keep queue logic in library_service for MVP)

Responsibilities:

1. Book CRUD and availability transitions.
2. Queue ordering and offer window management.
3. Loan creation and dual confirmation workflow.
4. Duration calculation policy helper.
5. Wishlist match detection.
6. Triggering email/in-app notifications via existing `EmailService`.


## 9. Notifications & Email

Add email methods (SMTP + MailerSend classes) similar to existing style:

1. `send_library_queue_offer_email(...)`
2. `send_library_loan_handover_ready_email(...)`
3. `send_library_loan_due_reminder_email(...)`
4. `send_library_book_available_email(...)`
5. `send_library_wishlist_match_email(...)`

Trigger points:

1. Request moved to `offered`.
2. Loan becomes `active`.
3. Loan nearing `due_at` (scheduled check).
4. Book returned and next queued user exists.
5. New listing matches existing wishlist items.


## 10. Scheduling / Background Jobs

Implement periodic jobs (cron/worker script or admin-triggered endpoint initially):

1. Expire outdated queue offers (`offer_expires_at < now`) and promote next.
2. Send due reminders (e.g. 3 days before due).
3. Optional stale reservation cleanup.

MVP fallback (no worker yet):

- Run queue expiration on relevant API calls (`GET /books`, `POST /request`, `POST /confirm-return`).


## 11. Files to Add / Modify

### Add

1. `app/models/library.py`
2. `app/schemas/library.py`
3. `app/services/library_service.py`
4. `app/api/v1/library.py`
5. `docs/LIBRARY_API_GUIDE.md` (after endpoints stabilize)
6. Alembic migration in `alembic/versions/...`

### Modify

1. `app/models/__init__.py` (import new models)
2. `app/main.py` (include router `/api/v1/library`)
3. `app/services/email_service.py` (library notification emails)
4. `app/dependencies.py` (if adding library-specific auth helpers)
5. `requirements` only if new dependency is truly needed (avoid for MVP)


## 12. Delivery Phases

## Phase 1 - Data + Listing

1. Migration + models.
2. Book CRUD + image upload reuse from resources pattern.
3. Basic catalog endpoints.

Exit criteria:
- members can publish and browse lendable books.

## Phase 2 - Queue + Claim

1. Request creation and ordered queue.
2. Offer window logic.
3. Request accept/cancel/expire.

Exit criteria:
- first-come claim + waiting list works reliably.

## Phase 3 - Loan Lifecycle

1. Create loan from accepted request.
2. Dual handover confirmation.
3. Dual return confirmation.
4. Return auto-promotes next requester.

Exit criteria:
- end-to-end borrow/return flow is production-safe.

## Phase 4 - Wishlist + Notifications

1. Wishlist CRUD.
2. Match detection on listing creation/update.
3. Email/in-app notifications + due reminders.

Exit criteria:
- waiting members are notified in correct priority order.

## Phase 5 - Hardening

1. Permission edge cases.
2. Idempotency and race-condition guards.
3. Admin moderation controls.
4. Metrics/dashboard counters.


## 13. Concurrency & Integrity Requirements

1. Wrap queue transitions in DB transactions.
2. Lock current top request row when promoting next (`SELECT ... FOR UPDATE` style via SQLAlchemy).
3. Enforce single active loan per book with constraint/validation.
4. Prevent duplicate active requests per user/book with DB unique index on active statuses (or partial index).
5. Use server time only for offer/due calculations.


## 14. Validation Rules

1. `title`, `author` required for listings.
2. `page_count` must be positive if provided.
3. `default_loan_days` within allowed range (e.g. 7..60).
4. Owner cannot request own book.
5. Guest cannot request/loan.
6. Only participants/admin can view loan details.


## 15. Testing Plan

Add tests in `tests/`:

1. `test_library_books.py`
   - create/update/pause listing permissions
2. `test_library_queue.py`
   - first claim ordering
   - offer expiry and promotion
   - duplicate request prevention
3. `test_library_loans.py`
   - dual handover confirmation
   - dual return confirmation
   - due-date calculation from page count
4. `test_library_wishlist.py`
   - wishlist CRUD
   - match notification trigger
5. `test_library_permissions.py`
   - guest restrictions
   - owner vs requester vs admin access


## 16. UX/API Notes for Frontend

Expose useful computed fields in book list response:

1. `isAvailableNow`
2. `queueLength`
3. `myRequestStatus`
4. `nextAvailableEstimate`
5. `loanPolicyDays`

This reduces extra round trips and makes the flow understandable in UI.


## 17. Rollout Strategy

1. Deploy schema + read endpoints first.
2. Enable write actions for admins/internal testers.
3. Enable member requests for a pilot group.
4. Observe queue transitions and notification delivery.
5. Full rollout after one full borrow-return cycle succeeds.


## 18. Open Product Decisions (to finalize before implementation)

1. Can guests browse library catalog or no access at all?
2. Exact offer window duration (24h recommended).
3. Max concurrent active loans per member.
4. Max queue length per book.
5. Whether owner can manually choose a requester (or strict FIFO only).
6. Dispute flow handling (MVP: admin manual resolution).

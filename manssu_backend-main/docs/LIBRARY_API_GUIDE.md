# Library API Guide (Frontend)

This guide documents the current Library module API for the frontend.

Base URL prefix: `/api/v1/library`  
Auth: Bearer token required on all endpoints below.

Allowed roles: `member`, `admin`, `super_admin` (guests are blocked).


## 1. Feature Coverage

Implemented:

1. Book listings CRUD
2. Queue/request flow (offer/accept/cancel/expire)
3. Loan lifecycle with dual confirmations
4. Wishlist CRUD
5. In-app notifications (wishlist match, queue offer, due reminder)
6. Admin-triggered due reminders


## 2. Book Listings

Category is no longer free text. Allowed values:

1. `fiction`
2. `non_fiction`
3. `science`
4. `technology`
5. `business`
6. `biography`
7. `history`
8. `philosophy`
9. `self_help`
10. `children`
11. `education`
12. `other`

## 2.1 List books

`GET /books?search=&category=&status=all&availableOnly=false&page=1&limit=10`

Behavior:

1. Returns only books not owned by the current user.
2. Use `GET /books/mine` for user-owned inventory.

Response:

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "ownerId": "uuid",
        "title": "Book title",
        "author": "Author",
        "description": "Optional",
        "comment": "Optional",
        "category": "fiction",
        "pageCount": 220,
        "language": "FR",
        "condition": "good",
        "imageUrl": "./uploads/library/...",
        "availabilityMode": "always",
        "availableFrom": null,
        "status": "available",
        "defaultLoanDays": 21,
        "isAvailableNow": true,
        "hasMyActiveRequest": false,
        "createdAt": "ISO",
        "updatedAt": "ISO"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

## 2.2 Get one book

`GET /books/{book_id}`

## 2.3 My books (owned by current user)

`GET /books/mine?search=&category=&status=all&availableOnly=false&page=1&limit=10`

## 2.4 Create listing

`POST /books` (multipart/form-data)

Fields:

1. `title` (required)
2. `author` (required)
3. `description`, `comment`, `category` (must be one of the allowed values above), `pageCount`, `language`, `condition`
4. `availabilityMode` (`always|from_date|paused`)
5. `availableFrom` (ISO datetime, optional)
6. `defaultLoanDays` (7..90 optional)
7. `image` (optional file)

## 2.5 Update listing

`PATCH /books/{book_id}` (multipart/form-data)

Owner or admin only.

## 2.6 Update availability only

`PATCH /books/{book_id}/availability`

```json
{
  "availabilityMode": "paused",
  "availableFrom": null,
  "status": "paused"
}
```

## 2.7 Delete listing

`DELETE /books/{book_id}` (owner/admin only)


## 3. Requests & Queue

## 3.1 Request a book

`POST /books/{book_id}/request`

Rules:

1. Owner cannot request own book.
2. First eligible requester is auto-marked `accepted` if book is available.
3. Others are `queued`.
4. Duplicate active request by same user is blocked.

## 3.2 View requests for a book

`GET /books/{book_id}/requests`

Owner only.

Request statuses:

1. `queued`
2. `offered` (internal legacy status for old pending offers)
3. `accepted`
4. `expired`
5. `cancelled`
6. `fulfilled`

Queue request payload now includes:

1. `requesterId`
2. `requester` object: `{ id, firstName, lastName }`

## 3.3 Cancel request

`POST /requests/{request_id}/cancel`

Allowed:

1. requester
2. book owner
3. admin

## 3.4 Force expire request

`POST /requests/{request_id}/expire`

Admin only.


## 4. Loan Lifecycle

Loan payload now includes member objects in addition to IDs:

1. `ownerId` + `owner` object: `{ id, firstName, lastName }`
2. `borrowerId` + `borrower` object: `{ id, firstName, lastName }`

## 4.1 Create loan from accepted request

`POST /requests/{request_id}/create-loan`

Body:

```json
{
  "plannedStartAt": "2026-03-10T18:00:00Z",
  "dueDays": 21
}
```

Owner only can create from an `accepted` request.

Rules:

1. A book can only have one open loan at a time.
2. A borrower can have at most `2` concurrent open loans (`pending_handover`, `active`, `pending_return`).
3. Due date is finalized when both handover confirmations are done (loan activation time).

Loan statuses:

1. `pending_handover`
2. `active`
3. `pending_return`
4. `completed`
5. `cancelled`

## 4.2 Confirm handover (owner side)

`POST /loans/{loan_id}/confirm-handover/owner`

## 4.3 Confirm handover (borrower side)

`POST /loans/{loan_id}/confirm-handover/borrower`

When both are confirmed, loan becomes `active`, book status becomes `loaned`, and `dueAt` is recalculated from this activation timestamp.

## 4.4 Initiate return (borrower)

`POST /loans/{loan_id}/initiate-return`

Sets loan to `pending_return`.

## 4.5 Confirm return (owner)

`POST /loans/{loan_id}/confirm-return/owner`

Sets loan `completed`, marks return date, and promotes next queue user to `accepted` if any.

## 4.6 Cancel loan

`POST /loans/{loan_id}/cancel`

Owner/admin only.

## 4.7 My loans

`GET /loans/me?status=all&page=1&limit=10`

## 4.8 Loan detail

`GET /loans/id/{loan_id}`

Note: route uses `/id/{loan_id}` to avoid conflict with `/loans/me`.


## 5. Wishlist

## 5.1 My wishlist

`GET /wishlist/me?activeOnly=false`

## 5.2 Create item

`POST /wishlist`

```json
{
  "title": "Clean Code",
  "author": "Robert C. Martin",
  "category": "technology",
  "comment": "Looking for FR or EN"
}
```

## 5.3 Update item

`PATCH /wishlist/{item_id}`

```json
{
  "isActive": false
}
```

## 5.4 Delete item

`DELETE /wishlist/{item_id}`


## 6. Notifications

## 6.1 Get notifications

`GET /notifications?unreadOnly=false&page=1&limit=20`

Notification types currently used:

1. `wishlist_match`
2. `loan_due_reminder`
3. `owner_request_ready`
4. `loan_created`

## 6.2 Mark as read

`POST /notifications/{notification_id}/read`

## 6.3 Trigger due reminders (admin)

`POST /loans/reminders/due?daysBefore=3`

Creates due reminder notifications for active loans with due dates in range.


## 7. Email Notifications

The backend now also sends transactional emails for:

1. wishlist match
2. loan due reminder
3. owner request ready (book owner can create loan)
4. loan created (owner + borrower)

Frontend does not need extra action for this; calls that create those events trigger emails server-side.


## 8. Frontend Integration Flows

## 8.1 Borrow flow

1. User opens library list (`GET /books`).
2. User requests (`POST /books/{id}/request`).
3. If request is auto-`accepted`, wait for owner to create loan.
4. If request is `queued`, wait until it is promoted to `accepted`.
5. Both users confirm handover.

## 8.2 Return flow

1. Borrower initiates return (`POST /loans/{id}/initiate-return`).
2. Owner confirms return (`POST /loans/{id}/confirm-return/owner`).
3. Book returns to availability or next queue user is auto-accepted.

## 8.3 Wishlist flow

1. Member creates wishlist items.
2. On matching new listing, member gets in-app + email notification.
3. Frontend inbox shows match details and deep links to library.


## 9. UX Recommendations

1. Use badges for book/request/loan statuses.
2. Hide `accept` actions; normal flow is auto-accepted or queued.
3. Add distinct actions by actor:
   - owner: create loan, confirm owner handover/return
   - borrower: confirm borrower handover, initiate return
4. In notifications UI, route users directly to book or loan based on payload.
5. Poll notifications endpoint every 30-60 seconds or on app focus.


## 10. Error Handling Expectations

Typical errors:

1. `400` for invalid state transition (`create loan` on non-accepted, etc.).
2. `403` for permission violations.
3. `404` for missing book/request/loan/wishlist item/notification.

Use backend `detail` text directly for toast/snackbar in admin/member panels.

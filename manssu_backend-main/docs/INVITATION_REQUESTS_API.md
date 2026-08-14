# Invitation Requests API Documentation

This document describes all API endpoints for the invitation request system, where members can request to invite people to sessions, and admins can approve or reject these requests.

## Base URL
All endpoints are prefixed with `/api/v1/invites`

---

## 1. Create Invitation Request

**Endpoint:** `POST /api/v1/invites/requests`

**Description:** Allows members to create an invitation request. The request will be reviewed by admins.

**Authentication:** Required (Member, Admin, or Super Admin)

**Request Payload:**
```json
{
  "email": "invitee@example.com",
  "fullName": "John Doe",
  "reason": "This person is interested in our community and would benefit from attending this session.",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Field Descriptions:**
- `email` (string, required): Email address of the person to invite (must be valid email format)
- `fullName` (string, required): Full name of the person to invite (1-200 characters)
- `reason` (string, required): Reason why the member wants to invite this person (minimum 1 character)
- `sessionId` (string, required): UUID of the session to invite the person to

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Demande d'invitation créée avec succès. Elle sera examinée par un administrateur.",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "fullName": "John Doe",
    "reason": "This person is interested in our community and would benefit from attending this session.",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionTitle": "Session Title",
    "requestedBy": "770e8400-e29b-41d4-a716-446655440000",
    "requestedByName": "Jane Smith",
    "status": "pending",
    "reviewedBy": null,
    "reviewedByName": null,
    "reviewedAt": null,
    "createdAt": "2025-12-12T18:30:00.000000",
    "updatedAt": "2025-12-12T18:30:00.000000"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "detail": "Session introuvable"
}
```
or
```json
{
  "detail": "Un utilisateur avec cet email existe déjà en tant que membre ou administrateur"
}
```
or
```json
{
  "detail": "Une demande d'invitation en attente existe déjà pour cet email et cette session"
}
```

**403 Forbidden:**
```json
{
  "detail": "Seuls les membres peuvent créer des demandes d'invitation"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

---

## 2. List Invitation Requests

**Endpoint:** `GET /api/v1/invites/requests`

**Description:** Lists all invitation requests with optional filters. Admin only.

**Authentication:** Required (Admin or Super Admin)

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `approved`, `rejected`)
- `session_id` (optional): Filter by session ID (UUID)

**Example Request:**
```
GET /api/v1/invites/requests?status=pending&session_id=550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Demandes d'invitation récupérées avec succès",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "email": "invitee@example.com",
      "fullName": "John Doe",
      "reason": "This person is interested in our community and would benefit from attending this session.",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "sessionTitle": "Session Title",
      "requestedBy": "770e8400-e29b-41d4-a716-446655440000",
      "requestedByName": "Jane Smith",
      "status": "pending",
      "reviewedBy": null,
      "reviewedByName": null,
      "reviewedAt": null,
      "createdAt": "2025-12-12T18:30:00.000000",
      "updatedAt": "2025-12-12T18:30:00.000000"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "email": "another@example.com",
      "fullName": "Alice Johnson",
      "reason": "Recommended by a colleague.",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "sessionTitle": "Session Title",
      "requestedBy": "990e8400-e29b-41d4-a716-446655440000",
      "requestedByName": "Bob Wilson",
      "status": "approved",
      "reviewedBy": "aa0e8400-e29b-41d4-a716-446655440000",
      "reviewedByName": "Admin User",
      "reviewedAt": "2025-12-12T19:00:00.000000",
      "createdAt": "2025-12-12T18:45:00.000000",
      "updatedAt": "2025-12-12T19:00:00.000000"
    }
  ]
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "detail": "Admin access required"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

---

## 3. Get Invitation Request by ID

**Endpoint:** `GET /api/v1/invites/requests/{request_id}`

**Description:** Gets a specific invitation request by its ID. Admin only.

**Authentication:** Required (Admin or Super Admin)

**Path Parameters:**
- `request_id` (string, required): UUID of the invitation request

**Example Request:**
```
GET /api/v1/invites/requests/660e8400-e29b-41d4-a716-446655440000
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Demande d'invitation récupérée avec succès",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "fullName": "John Doe",
    "reason": "This person is interested in our community and would benefit from attending this session.",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionTitle": "Session Title",
    "requestedBy": "770e8400-e29b-41d4-a716-446655440000",
    "requestedByName": "Jane Smith",
    "status": "pending",
    "reviewedBy": null,
    "reviewedByName": null,
    "reviewedAt": null,
    "createdAt": "2025-12-12T18:30:00.000000",
    "updatedAt": "2025-12-12T18:30:00.000000"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "detail": "Demande d'invitation introuvable"
}
```

**403 Forbidden:**
```json
{
  "detail": "Admin access required"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

---

## 4. Review Invitation Request (Approve/Reject)

**Endpoint:** `POST /api/v1/invites/requests/{request_id}/review`

**Description:** Allows admins to approve or reject an invitation request. If approved, creates the invite and sends an email to the invited person. Admin only.

**Authentication:** Required (Admin or Super Admin)

**Path Parameters:**
- `request_id` (string, required): UUID of the invitation request

**Request Payload:**
```json
{
  "action": "approve"
}
```
or
```json
{
  "action": "reject"
}
```

**Field Descriptions:**
- `action` (string, required): Either `"approve"` or `"reject"`

**Success Response (200 OK) - When Approved:**
```json
{
  "success": true,
  "message": "Demande d'invitation approuvée et l'invitation a été créée et envoyée avec succès",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "fullName": "John Doe",
    "reason": "This person is interested in our community and would benefit from attending this session.",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionTitle": "Session Title",
    "requestedBy": "770e8400-e29b-41d4-a716-446655440000",
    "requestedByName": "Jane Smith",
    "status": "approved",
    "reviewedBy": "aa0e8400-e29b-41d4-a716-446655440000",
    "reviewedByName": "Admin User",
    "reviewedAt": "2025-12-12T19:00:00.000000",
    "createdAt": "2025-12-12T18:30:00.000000",
    "updatedAt": "2025-12-12T19:00:00.000000"
  }
}
```

**Success Response (200 OK) - When Rejected:**
```json
{
  "success": true,
  "message": "Demande d'invitation rejetée avec succès",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "invitee@example.com",
    "fullName": "John Doe",
    "reason": "This person is interested in our community and would benefit from attending this session.",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionTitle": "Session Title",
    "requestedBy": "770e8400-e29b-41d4-a716-446655440000",
    "requestedByName": "Jane Smith",
    "status": "rejected",
    "reviewedBy": "aa0e8400-e29b-41d4-a716-446655440000",
    "reviewedByName": "Admin User",
    "reviewedAt": "2025-12-12T19:00:00.000000",
    "createdAt": "2025-12-12T18:30:00.000000",
    "updatedAt": "2025-12-12T19:00:00.000000"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "detail": "Action invalide. Utilisez 'approve' ou 'reject'"
}
```
or
```json
{
  "detail": "Impossible d'examiner cette demande (déjà examinée ou introuvable)"
}
```
or
```json
{
  "detail": "Impossible de créer l'invitation : [error message]"
}
```

**403 Forbidden:**
```json
{
  "detail": "Admin access required"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

---

## Response Data Structure

All invitation request responses include the following fields:

- `id` (string): UUID of the invitation request
- `email` (string): Email address of the person to invite
- `fullName` (string): Full name of the person to invite
- `reason` (string): Reason provided by the member for the invitation
- `sessionId` (string): UUID of the session
- `sessionTitle` (string, nullable): Title of the session
- `requestedBy` (string): UUID of the member who created the request
- `requestedByName` (string, nullable): Full name of the member who created the request
- `status` (string): Status of the request (`pending`, `approved`, `rejected`)
- `reviewedBy` (string, nullable): UUID of the admin who reviewed the request (null if pending)
- `reviewedByName` (string, nullable): Full name of the admin who reviewed the request (null if pending)
- `reviewedAt` (string, nullable): ISO 8601 timestamp when the request was reviewed (null if pending)
- `createdAt` (string): ISO 8601 timestamp when the request was created
- `updatedAt` (string): ISO 8601 timestamp when the request was last updated

---

## Notes

1. **Email Notifications:**
   - When a member creates an invitation request, all active admins receive an email notification
   - When an admin approves a request, an invitation email is automatically sent to the invited person

2. **Validation:**
   - The system prevents duplicate pending requests for the same email and session
   - The system prevents inviting users who already exist as members or admins
   - Only pending requests can be reviewed (approved or rejected)

3. **Status Flow:**
   - `pending` → `approved` (when admin approves) → invite is created and email is sent
   - `pending` → `rejected` (when admin rejects)

4. **Permissions:**
   - Members, Admins, and Super Admins can create invitation requests
   - Only Admins and Super Admins can view and review invitation requests


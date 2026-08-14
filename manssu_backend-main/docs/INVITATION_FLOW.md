# Invitation Flow - Frontend Integration Guide

Complete guide to the invitation system flow with all API endpoints, request/response payloads, and error handling.

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Flow: Creating Invitations](#admin-flow-creating-invitations)
3. [Guest Flow: Using Invitations](#guest-flow-using-invitations)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Error Scenarios](#error-scenarios)

---

## Overview

The invitation system allows admins to invite guests to specific sessions. The flow consists of:

1. **Admin creates invite** → Email sent to guest automatically
2. **Guest clicks link** → Validates invite code
3. **Guest requests OTP** → Receives OTP via email
4. **Guest registers** → Creates account, auto-registers for session, receives JWT token

---

## Admin Flow: Creating Invitations

### Step 1: Create Invitation

Admin creates an invitation for a guest to attend a specific session.

**Endpoint:** `POST /api/v1/invites`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "guest@example.com",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitation créée et envoyée avec succès",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "code": "abc123xyz789",
    "email": "guest@example.com",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "sessionTitle": "Workshop on Leadership",
    "createdBy": "770e8400-e29b-41d4-a716-446655440000",
    "createdByName": "John Admin",
    "expiresAt": "2024-12-01T10:00:00",
    "status": "pending",
    "usedAt": null,
    "usedBy": null,
    "usedByName": null,
    "createdAt": "2024-11-24T10:00:00",
    "inviteUrl": "http://localhost:8080/invitation/abc123xyz789"
  }
}
```

**What Happens:**
- Invite is created in database
- Unique invite code is generated
- Email is automatically sent to guest with invite link
- Invite expires in 7 days

**Error Responses:**
- **400 Bad Request**: Session not found, email already has pending invite, or user already exists as member/admin
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: User is not an admin

---

### Step 2: List Invitations (Optional)

Admin can view all invitations with optional filters.

**Endpoint:** `GET /api/v1/invites?status=pending&session_id=xxx&email=guest@example.com`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `used`, `expired`, `cancelled`)
- `session_id` (optional): Filter by session ID
- `email` (optional): Search by email (partial match)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitations récupérées avec succès",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "code": "abc123xyz789",
      "email": "guest@example.com",
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "sessionTitle": "Workshop on Leadership",
      "createdBy": "770e8400-e29b-41d4-a716-446655440000",
      "createdByName": "John Admin",
      "expiresAt": "2024-12-01T10:00:00",
      "status": "pending",
      "usedAt": null,
      "usedBy": null,
      "usedByName": null,
      "createdAt": "2024-11-24T10:00:00",
      "inviteUrl": "http://localhost:8080/invitation/abc123xyz789"
    }
  ]
}
```

---

### Step 3: Cancel Invitation (Optional)

Admin can cancel a pending invitation.

**Endpoint:** `POST /api/v1/invites/{invite_id}/cancel`

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitation annulée avec succès"
}
```

**Error Responses:**
- **400 Bad Request**: Invite already used or not found
- **404 Not Found**: Invite ID not found

---

## Guest Flow: Using Invitations

### Step 1: Validate Invite Code

When guest clicks the invite link, validate the code to show session information.

**Endpoint:** `GET /api/v1/invites/validate/{code}`

**Headers:** None (Public endpoint)

**Example:** `GET /api/v1/invites/validate/abc123xyz789`

**Success Response (200) - Valid Invite:**
```json
{
  "valid": true,
  "email": "guest@example.com",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionTitle": "Workshop on Leadership",
  "expiresAt": "2024-12-01T10:00:00",
  "message": null
}
```

**Success Response (200) - Invalid Invite:**
```json
{
  "valid": false,
  "email": null,
  "sessionId": null,
  "sessionTitle": null,
  "expiresAt": null,
  "message": "Code d'invitation invalide"
}
```

**Possible Messages:**
- `"Code d'invitation invalide"` - Code doesn't exist
- `"Cette invitation a déjà été utilisée"` - Already used
- `"Cette invitation a été annulée"` - Cancelled by admin
- `"Cette invitation a expiré"` - Past expiration date

---

### Step 2: Request OTP

Guest requests OTP to be sent to the email associated with the invite code.

**Endpoint:** `POST /api/v1/auth/send-otp-invite`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "abc123xyz789"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP envoyé avec succès",
  "data": {
    "message": "OTP envoyé avec succès",
    "expiresIn": 600
  }
}
```

**Note:** `expiresIn` is in seconds (default: 600 seconds = 10 minutes)

**Error Responses:**
- **400 Bad Request**: Invalid or expired invite code
  ```json
  {
    "detail": "Code d'invitation invalide"
  }
  ```

---

### Step 3: Register Guest

Guest completes registration with their name and OTP code.

**Endpoint:** `POST /api/v1/auth/register-guest`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "abc123xyz789",
  "firstName": "Jane",
  "lastName": "Doe",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": null,
    "user": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "email": "guest@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "guest",
      "avatar": null
    }
  }
}
```

**What Happens:**
- Guest account is created (or updated if already exists as guest)
- Guest is automatically registered for the session
- Invite is marked as used
- JWT token is returned for authentication

**Error Responses:**
- **400 Bad Request**: Invalid invite code or OTP
  ```json
  {
    "detail": "Code d'invitation ou OTP invalide"
  }
  ```

---

## API Endpoints Reference

### Admin Endpoints (Require Admin Authentication)

#### Create Invitation
- **POST** `/api/v1/invites`
- **Auth:** Required (Admin)
- **Body:** `CreateInviteRequest`
- **Returns:** `InviteResponse`

#### List Invitations
- **GET** `/api/v1/invites?status={status}&session_id={id}&email={email}`
- **Auth:** Required (Admin)
- **Query Params:** Optional filters
- **Returns:** Array of `InviteResponse`

#### Get Invitation by ID
- **GET** `/api/v1/invites/{invite_id}`
- **Auth:** Required (Admin)
- **Returns:** `InviteResponse`

#### Cancel Invitation
- **POST** `/api/v1/invites/{invite_id}/cancel`
- **Auth:** Required (Admin)
- **Returns:** Success message

#### Add Session to Guest
- **POST** `/api/v1/invites/guests/{guest_id}/sessions`
- **Auth:** Required (Admin)
- **Body:** `AddSessionToGuestRequest`
- **Returns:** Success message

### Public Endpoints (No Authentication)

#### Validate Invite Code
- **GET** `/api/v1/invites/validate/{code}`
- **Auth:** None
- **Returns:** `ValidateInviteResponse`

#### Send OTP for Invite
- **POST** `/api/v1/auth/send-otp-invite`
- **Auth:** None
- **Body:** `SendOTPForInviteRequest`
- **Returns:** `SendOTPResponse`

#### Register Guest
- **POST** `/api/v1/auth/register-guest`
- **Auth:** None
- **Body:** `GuestRegisterRequest`
- **Returns:** `VerifyOTPResponse`

---

## Error Scenarios

### Invalid Invite Code
**When:** Code doesn't exist or is invalid
**Response:**
```json
{
  "valid": false,
  "message": "Code d'invitation invalide"
}
```

### Expired Invite
**When:** Invite has passed its expiration date (7 days)
**Response:**
```json
{
  "valid": false,
  "message": "Cette invitation a expiré"
}
```

### Already Used Invite
**When:** Guest tries to use an invite that was already used
**Response:**
```json
{
  "valid": false,
  "message": "Cette invitation a déjà été utilisée"
}
```

### Cancelled Invite
**When:** Admin cancelled the invite
**Response:**
```json
{
  "valid": false,
  "message": "Cette invitation a été annulée"
}
```

### Duplicate Pending Invite
**When:** Admin tries to create invite for email that already has pending invite
**Response:**
```json
{
  "detail": "Une invitation en attente existe déjà pour cet email"
}
```

### User Already Exists
**When:** Admin tries to invite email that belongs to existing member/admin
**Response:**
```json
{
  "detail": "Un utilisateur avec cet email existe déjà en tant que membre ou administrateur"
}
```

### Invalid OTP
**When:** Guest provides wrong OTP or OTP expired
**Response:**
```json
{
  "detail": "Code d'invitation ou OTP invalide"
}
```

### Session Not Found
**When:** Admin tries to create invite for non-existent session
**Response:**
```json
{
  "detail": "Session introuvable"
}
```

---

## Data Models

### CreateInviteRequest
```typescript
{
  email: string;        // Valid email address
  sessionId: string;    // UUID of session
}
```

### InviteResponse
```typescript
{
  id: string;                    // UUID
  code: string;                  // Unique invite code
  email: string;                 // Guest email
  sessionId: string;             // UUID
  sessionTitle: string | null;   // Session title
  createdBy: string | null;      // Admin UUID
  createdByName: string | null;  // Admin name
  expiresAt: string;             // ISO datetime
  status: "pending" | "used" | "expired" | "cancelled";
  usedAt: string | null;         // ISO datetime
  usedBy: string | null;         // Guest UUID
  usedByName: string | null;     // Guest name
  createdAt: string;              // ISO datetime
  inviteUrl: string | null;       // Full invite URL
}
```

### ValidateInviteResponse
```typescript
{
  valid: boolean;
  email: string | null;
  sessionId: string | null;
  sessionTitle: string | null;
  expiresAt: string | null;
  message: string | null;
}
```

### SendOTPForInviteRequest
```typescript
{
  code: string;  // Invite code
}
```

### GuestRegisterRequest
```typescript
{
  code: string;      // Invite code
  firstName: string;
  lastName: string;
  otp: string;       // 6-digit OTP
}
```

### VerifyOTPResponse
```typescript
{
  accessToken: string;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "guest";
    avatar: string | null;
  };
}
```

---

## Flow Summary

### Complete Guest Journey

1. **Guest receives email** with invite link: `{FRONTEND_BASE_URL}/invitation/{code}`
2. **Frontend extracts code** from URL
3. **Validate code**: `GET /api/v1/invites/validate/{code}`
   - If invalid: Show error message
   - If valid: Display session info and registration form
4. **User enters name** and clicks "Request OTP"
5. **Request OTP**: `POST /api/v1/auth/send-otp-invite` with code
6. **User receives OTP** via email
7. **User enters OTP** and submits form
8. **Register**: `POST /api/v1/auth/register-guest` with code, firstName, lastName, otp
9. **Receive JWT token** and user info
10. **Store token** and redirect to session or dashboard

### Complete Admin Journey

1. **Admin selects session** to invite guests to
2. **Admin enters email** and clicks "Send Invitation"
3. **Create invite**: `POST /api/v1/invites` with email and sessionId
4. **Email sent automatically** to guest
5. **Admin can view invites**: `GET /api/v1/invites` with filters
6. **Admin can cancel**: `POST /api/v1/invites/{id}/cancel` if needed

---

## Notes

- **Invite expiration**: 7 days from creation
- **OTP expiration**: 10 minutes from generation
- **Auto-registration**: Guest is automatically registered for session upon registration
- **Guest restrictions**: Guests can only see sessions they're registered for
- **Email sending**: Automatic when invite is created (no separate endpoint needed)
- **JWT token**: Valid for 7 days (10080 minutes) as configured
- **Invite status**: Automatically set to "expired" when past expiration date


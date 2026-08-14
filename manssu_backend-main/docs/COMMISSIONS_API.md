## Commissions API Documentation

Base URL: `/api/v1/commissions`

All endpoints require authentication via Bearer token in the `Authorization` header.

### Roles

- **Super Admin**: `super_admin` – Full control over commissions
- **Admin**: `admin` – Can view commissions but cannot create/delete
- **Commission Leader**: User assigned as `leader_id` of a commission – Can manage their commission
- **Member**: `member` – Can view and apply to commissions
- **Guest**: `guest` – Can view commissions but cannot apply

---

## Table of Contents

1. [Super Admin Endpoints](#1-super-admin-endpoints)
   - [Create Commission](#11-post-apicommissions)
   - [Delete Commission](#12-delete-apicommissionsid)
   - [Assign Leader](#13-put-apicommissionsidleader)
   - [Remove Leader](#14-delete-apicommissionsidleader)
2. [Super Admin or Leader Endpoints](#2-super-admin-or-leader-endpoints)
   - [Update Commission](#21-patch-apicommissionsid)
   - [List Applications](#22-get-apicommissionsidapplications)
   - [Approve Application](#23-post-apicommissionsidapplicationsappidapprove)
   - [Reject Application](#24-post-apicommissionsidapplicationsappidreject)
   - [Remove Member](#25-delete-apicommissionsidmembersuserid)
3. [All Authenticated Users](#3-all-authenticated-users-endpoints)
   - [List Commissions](#31-get-apicommissions)
   - [Get Commission Details](#32-get-apicommissionsid)
   - [Apply to Commission](#33-post-apicommissionsidapply)
   - [Withdraw Application](#34-delete-apicommissionsidapply)
   - [Get My Commissions](#35-get-apicommissionsme)
   - [Get My Applications](#36-get-apicommissionsmeapplications)
4. [Data Models](#4-data-models)

---

## 1. Super Admin Endpoints

### 1.1 POST `/api/v1/commissions`

Create a new commission.

- **Access**: Super Admin only

**Headers**:

```text
Authorization: Bearer <super_admin_access_token>
Content-Type: application/json
```

**Request body**:

```json
{
  "name": "Communication",
  "description": "Responsible for internal and external communication, social media, and newsletters.",
  "maxMembers": 5
}
```

**Field descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Commission name (2-100 chars, unique) |
| `description` | string | no | Description of the commission's responsibilities (max 2000 chars) |
| `maxMembers` | integer | no | Maximum number of members allowed (null = unlimited) |

**Success response** (200):

```json
{
  "success": true,
  "message": "Commission créée avec succès",
  "data": {
    "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
    "name": "Communication",
    "description": "Responsible for internal and external communication, social media, and newsletters.",
    "status": "active",
    "maxMembers": 5,
    "memberCount": 0,
    "pendingApplicationsCount": 0,
    "leader": null,
    "createdAt": "2026-02-06T10:00:00Z",
    "updatedAt": "2026-02-06T10:00:00Z",
    "members": [],
    "applications": null,
    "isMember": false,
    "isLeader": false,
    "myPendingApplication": null
  }
}
```

**Error responses**:

- **401 Unauthorized** – Missing or invalid token
- **403 Forbidden** – User is not a super admin
- **422 Validation Error** – Invalid body (e.g., name too short, maxMembers <= 0)

---

### 1.2 DELETE `/api/v1/commissions/{id}`

Delete a commission and all its members/applications.

- **Access**: Super Admin only

**Headers**:

```text
Authorization: Bearer <super_admin_access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Example request**:

```text
DELETE /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111
```

**Success response** (200):

```json
{
  "success": true,
  "message": "Commission supprimée avec succès"
}
```

**Error responses**:

- **404 Not Found** – Commission not found
- **403 Forbidden** – User is not a super admin

---

### 1.3 PUT `/api/v1/commissions/{id}/leader`

Assign a user as the leader of a commission.

- **Access**: Super Admin only

**Headers**:

```text
Authorization: Bearer <super_admin_access_token>
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Request body**:

```json
{
  "userId": "u1234567-89ab-cdef-0123-456789abcdef"
}
```

**Field descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (UUID) | yes | ID of the user to assign as leader |

**Notes**:
- If the user is not already a member of the commission, they will be automatically added as a member.
- Guests cannot be assigned as leaders.
- The user must be active.

**Success response** (200):

```json
{
  "success": true,
  "message": "Leader assigné avec succès",
  "data": {
    "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
    "name": "Communication",
    "description": "...",
    "status": "active",
    "maxMembers": 5,
    "memberCount": 1,
    "pendingApplicationsCount": 0,
    "leader": {
      "id": "u1234567-89ab-cdef-0123-456789abcdef",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "avatarUrl": null
    },
    "createdAt": "2026-02-06T10:00:00Z",
    "updatedAt": "2026-02-06T10:30:00Z",
    "members": [
      {
        "id": "m1-1111-1111-1111-111111111111",
        "user": {
          "id": "u1234567-89ab-cdef-0123-456789abcdef",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "avatarUrl": null
        },
        "joinedAt": "2026-02-06T10:30:00Z"
      }
    ],
    "applications": null,
    "isMember": false,
    "isLeader": false,
    "myPendingApplication": null
  }
}
```

**Error responses**:

- **404 Not Found** – Commission or user not found
- **400 Bad Request** – User is inactive or is a guest
- **403 Forbidden** – User is not a super admin

---

### 1.4 DELETE `/api/v1/commissions/{id}/leader`

Remove the leader from a commission.

- **Access**: Super Admin only

**Headers**:

```text
Authorization: Bearer <super_admin_access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Example request**:

```text
DELETE /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111/leader
```

**Notes**:
- This only removes the leader role; the user remains a member of the commission.

**Success response** (200):

```json
{
  "success": true,
  "message": "Leader retiré avec succès",
  "data": {
    "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
    "name": "Communication",
    "leader": null,
    "..."
  }
}
```

**Error responses**:

- **404 Not Found** – Commission not found
- **403 Forbidden** – User is not a super admin

---

## 2. Super Admin or Leader Endpoints

These endpoints can be accessed by super admins or the commission's designated leader.

### 2.1 PATCH `/api/v1/commissions/{id}`

Update commission details.

- **Access**: Super Admin or Commission Leader

**Headers**:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Request body** (all fields optional):

```json
{
  "name": "Updated Commission Name",
  "description": "Updated description of responsibilities.",
  "maxMembers": 10,
  "status": "archived"
}
```

**Field descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | no | New commission name (2-100 chars, must be unique) |
| `description` | string | no | Updated description |
| `maxMembers` | integer | no | New maximum member count |
| `status` | string | no | `"active"` or `"archived"` (**super admin only**) |

**Notes**:
- Only super admins can change the `status` field.
- Leaders can update `name`, `description`, and `maxMembers`.

**Success response** (200):

```json
{
  "success": true,
  "message": "Commission mise à jour avec succès",
  "data": {
    "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
    "name": "Updated Commission Name",
    "description": "Updated description of responsibilities.",
    "status": "active",
    "maxMembers": 10,
    "..."
  }
}
```

**Error responses**:

- **404 Not Found** – Commission not found
- **403 Forbidden** – Not authorized to update this commission
- **400 Bad Request** – Name already exists or only super admin can change status

---

### 2.2 GET `/api/v1/commissions/{id}/applications`

List applications for a commission.

- **Access**: Super Admin or Commission Leader

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Query parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status: `pending`, `approved`, `rejected` |
| `page` | integer | 1 | Page number (min: 1) |
| `limit` | integer | 10 | Items per page (1-100) |

**Example request**:

```text
GET /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111/applications?status=pending&page=1&limit=20
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "app-1111-1111-1111-111111111111",
        "user": {
          "id": "u2222222-2222-2222-2222-222222222222",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@example.com",
          "avatarUrl": null
        },
        "reason": "I have experience in digital marketing and would love to contribute to the communication efforts of the association.",
        "status": "pending",
        "createdAt": "2026-02-06T11:00:00Z",
        "reviewedAt": null,
        "reviewedBy": null,
        "rejectionReason": null
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Error responses**:

- **404 Not Found** – Commission not found
- **403 Forbidden** – Not authorized to view applications

---

### 2.3 POST `/api/v1/commissions/{id}/applications/{appId}/approve`

Approve a pending application, making the user a member.

- **Access**: Super Admin or Commission Leader

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |
| `appId` | string (UUID) | Application ID |

**Example request**:

```text
POST /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111/applications/app-1111-1111-1111-111111111111/approve
```

**Success response** (200):

```json
{
  "success": true,
  "message": "Candidature approuvée avec succès",
  "data": {
    "id": "app-1111-1111-1111-111111111111",
    "user": {
      "id": "u2222222-2222-2222-2222-222222222222",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "avatarUrl": null
    },
    "reason": "I have experience in digital marketing...",
    "status": "approved",
    "createdAt": "2026-02-06T11:00:00Z",
    "reviewedAt": "2026-02-06T12:00:00Z",
    "reviewedBy": {
      "id": "u1234567-89ab-cdef-0123-456789abcdef",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "avatarUrl": null
    },
    "rejectionReason": null
  }
}
```

**Email notification**: An email is sent to the applicant congratulating them and informing them they are now a member of the commission.

**Error responses**:

- **404 Not Found** – Commission or application not found
- **400 Bad Request** – Application already processed or commission at max capacity
- **403 Forbidden** – Not authorized

---

### 2.4 POST `/api/v1/commissions/{id}/applications/{appId}/reject`

Reject a pending application.

- **Access**: Super Admin or Commission Leader

**Headers**:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |
| `appId` | string (UUID) | Application ID |

**Request body** (optional):

```json
{
  "reason": "Unfortunately, we are looking for candidates with more experience in this area."
}
```

**Field descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | no | Reason for rejection (max 1000 chars) |

**Success response** (200):

```json
{
  "success": true,
  "message": "Candidature rejetée",
  "data": {
    "id": "app-1111-1111-1111-111111111111",
    "user": {
      "id": "u3333333-3333-3333-3333-333333333333",
      "firstName": "Bob",
      "lastName": "Wilson",
      "email": "bob.wilson@example.com",
      "avatarUrl": null
    },
    "reason": "I want to help with the website.",
    "status": "rejected",
    "createdAt": "2026-02-06T11:30:00Z",
    "reviewedAt": "2026-02-06T12:15:00Z",
    "reviewedBy": {
      "id": "u1234567-89ab-cdef-0123-456789abcdef",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "avatarUrl": null
    },
    "rejectionReason": "Unfortunately, we are looking for candidates with more experience in this area."
  }
}
```

**Email notification**: An email is sent to the applicant informing them that their application was not approved, along with the rejection reason if provided.

**Error responses**:

- **404 Not Found** – Commission or application not found
- **400 Bad Request** – Application already processed
- **403 Forbidden** – Not authorized

---

### 2.5 POST `/api/v1/commissions/{id}/members`

Add a member directly to a commission, bypassing the application workflow.

- **Access**: Super Admin or Commission Leader

**Headers**:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Request body**:

```json
{
  "userId": "u2222222-2222-2222-2222-222222222222"
}
```

**Field descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (UUID) | yes | ID of the user to add as member |

**Success response** (200):

```json
{
  "success": true,
  "message": "Membre ajouté avec succès",
  "data": {
    "id": "m3-3333-3333-3333-333333333333",
    "user": {
      "id": "u2222222-2222-2222-2222-222222222222",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "avatarUrl": null
    },
    "joinedAt": "2026-02-06T16:00:00Z"
  }
}
```

**Error responses**:

- **404 Not Found** – Commission or user not found
- **400 Bad Request** – User is inactive, is a guest, is already a member, or commission is at max capacity
- **403 Forbidden** – Not authorized

---

### 2.6 DELETE `/api/v1/commissions/{id}/members/{userId}`

Remove a member from a commission.

- **Access**: Super Admin or Commission Leader

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |
| `userId` | string (UUID) | User ID to remove |

**Example request**:

```text
DELETE /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111/members/u2222222-2222-2222-2222-222222222222
```

**Notes**:
- Cannot remove the commission leader using this endpoint. Use "Remove Leader" endpoint first.

**Success response** (200):

```json
{
  "success": true,
  "message": "Membre retiré avec succès"
}
```

**Error responses**:

- **404 Not Found** – Commission not found or user is not a member
- **400 Bad Request** – Cannot remove the leader (use remove leader endpoint)
- **403 Forbidden** – Not authorized

---

## 3. All Authenticated Users Endpoints

### 3.1 GET `/api/v1/commissions`

List all commissions.

- **Access**: Any authenticated user

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Query parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | all | Filter by status: `active`, `archived` |
| `page` | integer | 1 | Page number (min: 1) |
| `limit` | integer | 10 | Items per page (1-100) |

**Example request**:

```text
GET /api/v1/commissions?status=active&page=1&limit=10
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
        "name": "Communication",
        "description": "Responsible for internal and external communication.",
        "status": "active",
        "maxMembers": 5,
        "memberCount": 3,
        "pendingApplicationsCount": 2,
        "leader": {
          "id": "u1234567-89ab-cdef-0123-456789abcdef",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "avatarUrl": null
        },
        "createdAt": "2026-01-15T08:00:00Z",
        "updatedAt": "2026-02-06T10:00:00Z"
      },
      {
        "id": "b2c3d4e5-6789-0abc-def1-222222222222",
        "name": "IT & Development",
        "description": "Manages technical infrastructure and development.",
        "status": "active",
        "maxMembers": null,
        "memberCount": 5,
        "pendingApplicationsCount": 0,
        "leader": null,
        "createdAt": "2026-01-10T09:00:00Z",
        "updatedAt": "2026-01-20T14:00:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 3.2 GET `/api/v1/commissions/{id}`

Get detailed information about a commission.

- **Access**: Any authenticated user

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Example request**:

```text
GET /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
    "name": "Communication",
    "description": "Responsible for internal and external communication, social media, and newsletters.",
    "status": "active",
    "maxMembers": 5,
    "memberCount": 3,
    "pendingApplicationsCount": 2,
    "leader": {
      "id": "u1234567-89ab-cdef-0123-456789abcdef",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "avatarUrl": null
    },
    "createdAt": "2026-01-15T08:00:00Z",
    "updatedAt": "2026-02-06T10:00:00Z",
    "members": [
      {
        "id": "m1-1111-1111-1111-111111111111",
        "user": {
          "id": "u1234567-89ab-cdef-0123-456789abcdef",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "avatarUrl": null
        },
        "joinedAt": "2026-01-15T08:00:00Z"
      },
      {
        "id": "m2-2222-2222-2222-222222222222",
        "user": {
          "id": "u2222222-2222-2222-2222-222222222222",
          "firstName": "Jane",
          "lastName": "Smith",
          "email": "jane.smith@example.com",
          "avatarUrl": "https://example.com/avatar.jpg"
        },
        "joinedAt": "2026-01-20T10:00:00Z"
      }
    ],
    "applications": [
      {
        "id": "app-1111-1111-1111-111111111111",
        "user": { "..." },
        "reason": "...",
        "status": "pending",
        "createdAt": "2026-02-05T14:00:00Z",
        "reviewedAt": null,
        "reviewedBy": null,
        "rejectionReason": null
      }
    ],
    "isMember": false,
    "isLeader": false,
    "myPendingApplication": null
  }
}
```

**Notes**:
- `applications` array is only included if the current user is a super admin or the commission leader. Otherwise, it's `null`.
- `isMember` indicates if the current user is a member of this commission.
- `isLeader` indicates if the current user is the leader of this commission.
- `myPendingApplication` contains the current user's pending application (if any).

**Error responses**:

- **404 Not Found** – Commission not found

---

### 3.3 POST `/api/v1/commissions/{id}/apply`

Apply to join a commission.

- **Access**: Any authenticated user (except guests)

**Headers**:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Request body**:

```json
{
  "reason": "I have 5 years of experience in digital marketing and social media management. I would love to contribute to the association's communication efforts and help increase our visibility."
}
```

**Field descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | yes | Detailed reason for wanting to join (10-2000 chars) |

**Success response** (200):

```json
{
  "success": true,
  "message": "Candidature soumise avec succès",
  "data": {
    "id": "app-3333-3333-3333-333333333333",
    "user": {
      "id": "u4444444-4444-4444-4444-444444444444",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@example.com",
      "avatarUrl": null
    },
    "reason": "I have 5 years of experience in digital marketing...",
    "status": "pending",
    "createdAt": "2026-02-06T15:00:00Z",
    "reviewedAt": null,
    "reviewedBy": null,
    "rejectionReason": null
  }
}
```

**Email notification**: An email is sent to the commission leader (if assigned) and all super admins notifying them of the new application.

**Error responses**:

- **404 Not Found** – Commission not found
- **400 Bad Request**:
  - "This commission is not accepting applications" (archived status)
  - "You are already a member of this commission"
  - "You already have a pending application for this commission"
  - "Guests cannot apply to commissions"
- **422 Validation Error** – Reason too short or too long

---

### 3.4 DELETE `/api/v1/commissions/{id}/apply`

Withdraw a pending application.

- **Access**: Any authenticated user

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Path parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Commission ID |

**Example request**:

```text
DELETE /api/v1/commissions/a1b2c3d4-5678-90ab-cdef-111111111111/apply
```

**Success response** (200):

```json
{
  "success": true,
  "message": "Candidature retirée avec succès"
}
```

**Error responses**:

- **404 Not Found** – No pending application found for this commission

---

### 3.5 GET `/api/v1/commissions/me`

Get commissions the current user is a member of.

- **Access**: Any authenticated user

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Example request**:

```text
GET /api/v1/commissions/me
```

**Success response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-5678-90ab-cdef-111111111111",
      "name": "Communication",
      "description": "Responsible for internal and external communication.",
      "status": "active",
      "isLeader": true,
      "memberCount": 3,
      "joinedAt": "2026-01-15T08:00:00Z"
    },
    {
      "id": "c3d4e5f6-7890-abcd-ef12-333333333333",
      "name": "Events",
      "description": "Organizes association events and activities.",
      "status": "active",
      "isLeader": false,
      "memberCount": 7,
      "joinedAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

### 3.6 GET `/api/v1/commissions/me/applications`

Get the current user's commission applications.

- **Access**: Any authenticated user

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Example request**:

```text
GET /api/v1/commissions/me/applications
```

**Success response** (200):

```json
{
  "success": true,
  "data": [
    {
      "id": "app-1111-1111-1111-111111111111",
      "commissionId": "b2c3d4e5-6789-0abc-def1-222222222222",
      "commissionName": "IT & Development",
      "reason": "I'm a software developer with experience in Python and JavaScript...",
      "status": "pending",
      "createdAt": "2026-02-06T11:00:00Z",
      "reviewedAt": null,
      "rejectionReason": null
    },
    {
      "id": "app-2222-2222-2222-222222222222",
      "commissionId": "d4e5f6a7-8901-bcde-f234-444444444444",
      "commissionName": "Resources",
      "reason": "I would like to help manage association resources...",
      "status": "rejected",
      "createdAt": "2026-01-20T09:00:00Z",
      "reviewedAt": "2026-01-22T14:00:00Z",
      "rejectionReason": "The commission is currently at full capacity."
    }
  ]
}
```

---

## 4. Data Models

### 4.1 Commission

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique commission ID |
| `name` | string | Commission name (unique) |
| `description` | string \| null | Description of responsibilities |
| `status` | string | `"active"` or `"archived"` |
| `maxMembers` | integer \| null | Maximum members allowed (null = unlimited) |
| `memberCount` | integer | Current number of members |
| `pendingApplicationsCount` | integer | Number of pending applications |
| `leader` | object \| null | Leader user summary (see below) |
| `createdAt` | string (datetime) | Creation timestamp |
| `updatedAt` | string (datetime) | Last update timestamp |

### 4.2 Commission Detail (extends Commission)

| Field | Type | Description |
|-------|------|-------------|
| `members` | array | List of commission members |
| `applications` | array \| null | Pending applications (only for super admin/leader) |
| `isMember` | boolean | Whether current user is a member |
| `isLeader` | boolean | Whether current user is the leader |
| `myPendingApplication` | object \| null | Current user's pending application |

### 4.3 User Summary

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | User ID |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | Email address |
| `avatarUrl` | string \| null | Avatar URL |

### 4.4 Commission Member

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Membership ID |
| `user` | object | User summary |
| `joinedAt` | string (datetime) | When user joined the commission |

### 4.5 Application

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Application ID |
| `user` | object | Applicant user summary |
| `reason` | string | Reason for applying |
| `status` | string | `"pending"`, `"approved"`, or `"rejected"` |
| `createdAt` | string (datetime) | Application submission time |
| `reviewedAt` | string \| null | When application was reviewed |
| `reviewedBy` | object \| null | Reviewer user summary |
| `rejectionReason` | string \| null | Reason for rejection (if rejected) |

### 4.6 My Application (user's own applications)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Application ID |
| `commissionId` | string (UUID) | Commission ID |
| `commissionName` | string | Commission name |
| `reason` | string | Reason for applying |
| `status` | string | `"pending"`, `"approved"`, or `"rejected"` |
| `createdAt` | string (datetime) | Application submission time |
| `reviewedAt` | string \| null | When application was reviewed |
| `rejectionReason` | string \| null | Reason for rejection (if rejected) |

### 4.7 My Commission (user's memberships)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Commission ID |
| `name` | string | Commission name |
| `description` | string \| null | Description |
| `status` | string | `"active"` or `"archived"` |
| `isLeader` | boolean | Whether user is the leader |
| `memberCount` | integer | Current number of members |
| `joinedAt` | string (datetime) | When user joined |

---

## 5. Permission Summary

| Action | Super Admin | Leader | Member | Guest |
|--------|-------------|--------|--------|-------|
| Create commission | ✅ | ❌ | ❌ | ❌ |
| Delete commission | ✅ | ❌ | ❌ | ❌ |
| Assign/remove leader | ✅ | ❌ | ❌ | ❌ |
| Update commission | ✅ | ✅ (own) | ❌ | ❌ |
| Change status | ✅ | ❌ | ❌ | ❌ |
| View applications | ✅ | ✅ (own) | ❌ | ❌ |
| Approve/reject | ✅ | ✅ (own) | ❌ | ❌ |
| Remove members | ✅ | ✅ (own) | ❌ | ❌ |
| List commissions | ✅ | ✅ | ✅ | ✅ |
| View commission details | ✅ | ✅ | ✅ | ✅ |
| Apply to commission | ✅ | ✅ | ✅ | ❌ |
| View own applications | ✅ | ✅ | ✅ | ✅ |
| View own memberships | ✅ | ✅ | ✅ | ✅ |

---

## 6. Email Notifications

The following email notifications are automatically sent:

| Event | Recipients | Email Content |
|-------|------------|---------------|
| Application created | Commission leader + all super admins | Notification of new application with applicant name and commission |
| Application approved | Applicant | Congratulations message with link to the commission |
| Application rejected | Applicant | Notification with rejection reason (if provided) |

---

This document provides everything needed to integrate the commissions feature on the frontend: creating and managing commissions by super admins, member application workflow, and user self-service for viewing their memberships and applications.


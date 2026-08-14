# Themes API Guide

Complete documentation for theme management endpoints in the MANSSU backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Theme Proposal Window Management](#theme-proposal-window-management)
3. [Theme CRUD Operations](#theme-crud-operations)
4. [Request/Response Schemas](#requestresponse-schemas)
5. [Business Logic & Workflow](#business-logic--workflow)
6. [Examples](#examples)
7. [Error Handling](#error-handling)

---

## Overview

The Themes API manages theme proposals submitted by members during specific time windows. Themes go through a review process where admins can approve or reject them. Approved themes can then be used in sessions.

### Key Concepts

- **Theme Proposal Window**: Time-limited periods when members can submit theme proposals
- **Theme Status Flow**: `pending` → `approved`/`rejected` → (optionally) `current`
- **Session Linking**: Themes are linked to sessions by matching theme title (sessions store theme as string)

### Access Levels

- **Public**: None (all endpoints require authentication)
- **Authenticated Users**: Can view themes, check window status, submit proposals
- **Admin/Super Admin**: Can manage windows, approve/reject themes, delete themes

---

## Theme Proposal Window Management

Base URL: `/api/v1/themes/window`

### 1. Get Window Status

**GET** `/api/v1/themes/window/status`

Get the current status of the theme proposal window.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200) - Window Open:
```json
{
  "success": true,
  "data": {
    "isOpen": true,
    "startDate": "2024-12-10T00:00:00Z",
    "endDate": "2024-12-24T23:59:59Z",
    "daysRemaining": 5,
    "nextOpeningDate": null,
    "userProposals": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Gestion du stress",
        "description": "Techniques pour gérer le stress quotidien",
        "category": "Bien-être mental",
        "status": "pending",
        "submittedBy": {
          "id": "user-uuid",
          "name": "Marie Dubois",
          "avatar": "avatar-url"
        },
        "submittedAt": "2024-12-10T10:00:00Z",
        "sessionCount": 0,
        "likes": 0,
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-10T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Méditation et pleine conscience",
        "description": "Pratiques de méditation",
        "category": "Bien-être mental",
        "status": "approved",
        "submittedAt": "2024-12-11T14:00:00Z",
        "reviewedAt": "2024-12-12T09:00:00Z",
        "sessionCount": 0,
        "likes": 0,
        "createdAt": "2024-12-11T14:00:00Z",
        "updatedAt": "2024-12-12T09:00:00Z"
      }
    ]
  }
}
```

**Response when window is closed**:
```json
{
  "success": true,
  "data": {
    "isOpen": false,
    "startDate": null,
    "endDate": null,
    "daysRemaining": null,
    "nextOpeningDate": "2025-01-15T00:00:00Z",
    "userProposals": null
  }
}
```

**Response when user has no proposals**:
```json
{
  "success": true,
  "data": {
    "isOpen": true,
    "startDate": "2024-12-10T00:00:00Z",
    "endDate": "2024-12-24T23:59:59Z",
    "daysRemaining": 5,
    "nextOpeningDate": null,
    "userProposals": []
  }
}
```

**Field Descriptions**:
- `isOpen`: Whether the proposal window is currently open
- `startDate`: Window start date (ISO 8601 timestamp)
- `endDate`: Window end date (ISO 8601 timestamp)
- `daysRemaining`: Number of days remaining (only when window is open)
- `nextOpeningDate`: Date of next scheduled window (only when current window is closed)
- `userProposals`: Array of theme proposals submitted by the current user for the active window. Returns `null` if window is closed, empty array `[]` if user has no proposals, or array of `ThemeResponse` objects if user has proposals. Ordered by submission date (newest first).

**Business Logic**:
- Checks for active window (is_active = true AND current time between start_date and end_date)
- If no active window, checks for future scheduled windows
- Returns days remaining for active windows
- **Includes user's theme proposals**: If an active window exists, returns all themes submitted by the current user for that window
- Proposals are ordered by submission date (newest first)
- If window is closed, `userProposals` is `null`
- If user has no proposals, `userProposals` is an empty array `[]`

---

### 2. Open Theme Proposal Window

**POST** `/api/v1/themes/window/open`

Open a new theme proposal window. Automatically closes any existing active windows.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "duration": 14
}
```

**Field Descriptions**:
- `duration` (required): Number of days the window should remain open

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "startDate": "2024-12-10T10:00:00Z",
    "endDate": "2024-12-24T10:00:00Z",
    "isActive": true
  },
  "message": "Fenêtre de propositions ouverte avec succès"
}
```

**Business Logic**:
- Deactivates all existing active windows
- Creates new window starting from current time
- Sets end_date = start_date + duration days
- Sets is_active = true
- Records creator (admin user ID)

---

### 3. Extend Theme Proposal Window

**PATCH** `/api/v1/themes/window/{window_id}/extend`

Extend the duration of an existing window by adding additional days.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `window_id` (UUID): The ID of the window to extend

**Request Body**:
```json
{
  "additionalDays": 7
}
```

**Field Descriptions**:
- `additionalDays` (required): Number of additional days to add to the window

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "startDate": "2024-12-10T10:00:00Z",
    "endDate": "2024-12-31T10:00:00Z",
    "isActive": true
  },
  "message": "Fenêtre prolongée avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Window not found"
}
```

**Business Logic**:
- Finds window by ID
- Adds additionalDays to end_date
- Updates updated_at timestamp

---

### 4. Close Theme Proposal Window

**POST** `/api/v1/themes/window/{window_id}/close`

Manually close a theme proposal window. Prevents new proposals but doesn't affect pending reviews.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `window_id` (UUID): The ID of the window to close

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Fenêtre fermée avec succès"
  },
  "message": "Fenêtre fermée avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Window not found"
}
```

**Business Logic**:
- Sets window.is_active = false
- Does NOT delete the window
- Pending theme reviews can still continue

---

## Theme CRUD Operations

Base URL: `/api/v1/themes`

### 5. Get All Themes

**GET** `/api/v1/themes?status=all&page=1&limit=10`

Get a paginated list of all themes with filtering options.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `status` (optional): Filter by status - `all`, `pending`, `approved`, `rejected`, `current` (default: `all`)
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Example Request**:
```
GET /api/v1/themes?status=approved&page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Gestion du stress",
        "description": "Techniques pour gérer le stress quotidien",
        "category": "Bien-être mental",
        "status": "approved",
        "submittedBy": {
          "id": "user-uuid",
          "name": "Marie Dubois",
          "avatar": "avatar-url"
        },
        "submittedAt": "2024-12-10T10:00:00Z",
        "reviewedAt": "2024-12-11T14:30:00Z",
        "reviewedBy": "admin-uuid",
        "reviewNotes": "Excellent thème, très pertinent",
        "sessionCount": 3,
        "nextSessionDate": "2024-12-20",
        "lastSessionDate": "2024-12-15",
        "likes": 12,
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-11T14:30:00Z"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 6. Get Pending Themes

**GET** `/api/v1/themes/pending`

Get all themes awaiting admin review.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Gestion du stress",
      "description": "Techniques pour gérer le stress quotidien",
      "category": "Bien-être mental",
      "status": "pending",
      "submittedBy": {
        "id": "user-uuid",
        "name": "Marie Dubois",
        "avatar": "avatar-url"
      },
      "submittedAt": "2024-12-10T10:00:00Z",
      "sessionCount": 0,
      "likes": 0,
      "createdAt": "2024-12-10T10:00:00Z",
      "updatedAt": "2024-12-10T10:00:00Z"
    }
  ]
}
```

**Business Logic**:
- Returns themes with status = "pending"
- Ordered by submission date (newest first)
- Used by admins for review workflow

---

### 7. Get Linked Themes

**GET** `/api/v1/themes/linked`

Get themes that are linked to at least one session (regardless of session status).

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Gestion du stress",
      "description": "Techniques pour gérer le stress quotidien",
      "category": "Bien-être mental",
      "status": "approved",
      "submittedBy": {
        "id": "user-uuid",
        "name": "Marie Dubois",
        "avatar": "avatar-url"
      },
      "submittedAt": "2024-12-10T10:00:00Z",
      "sessionCount": 3,
      "likes": 12,
      "createdAt": "2024-12-10T10:00:00Z",
      "updatedAt": "2024-12-11T14:30:00Z"
    }
  ]
}
```

**Business Logic**:
- Finds all unique theme strings from sessions table
- Matches themes by title (sessions store theme as string, not FK)
- Returns themes that appear in at least one session
- Includes sessions with any status (upcoming, ongoing, completed, cancelled)

---

### 8. Get Unlinked Themes

**GET** `/api/v1/themes/unlinked`

Get themes that are not linked to any session.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Méditation et pleine conscience",
      "description": "Pratiques de méditation pour le bien-être",
      "category": "Bien-être mental",
      "status": "approved",
      "submittedBy": {
        "id": "user-uuid",
        "name": "Pierre Martin",
        "avatar": "avatar-url"
      },
      "submittedAt": "2024-12-12T10:00:00Z",
      "sessionCount": 0,
      "likes": 5,
      "createdAt": "2024-12-12T10:00:00Z",
      "updatedAt": "2024-12-13T09:00:00Z"
    }
  ]
}
```

**Business Logic**:
- Finds all unique theme strings from sessions
- Returns themes whose titles are NOT found in any session
- Useful for finding approved themes that haven't been used yet
- If no sessions exist, returns all themes

---

### 9. Get Theme by ID

**GET** `/api/v1/themes/{theme_id}`

Get detailed information about a specific theme.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `theme_id` (UUID): The ID of the theme to retrieve

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Gestion du stress",
    "description": "Techniques pour gérer le stress quotidien",
    "category": "Bien-être mental",
    "status": "approved",
    "submittedBy": {
      "id": "user-uuid",
      "name": "Marie Dubois",
      "avatar": "avatar-url"
    },
    "submittedAt": "2024-12-10T10:00:00Z",
    "reviewedAt": "2024-12-11T14:30:00Z",
    "reviewedBy": "admin-uuid",
    "reviewNotes": "Excellent thème, très pertinent",
    "sessionCount": 3,
    "nextSessionDate": "2024-12-20",
    "lastSessionDate": "2024-12-15",
    "likes": 12,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-11T14:30:00Z"
  }
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Theme not found"
}
```

---

### 10. Create Theme Proposal

**POST** `/api/v1/themes`

Submit a new theme proposal. Only works when the proposal window is open.

**Access**: Authenticated users only (Members)

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "title": "Gestion du stress",
  "description": "Techniques pour gérer le stress quotidien dans la vie professionnelle et personnelle",
  "category": "Bien-être mental"
}
```

**Field Descriptions**:
- `title` (required): Theme title
- `description` (required): Detailed description of the theme
- `category` (optional): Theme category (e.g., "Bien-être mental", "Développement personnel")

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Gestion du stress",
    "description": "Techniques pour gérer le stress quotidien",
    "category": "Bien-être mental",
    "status": "pending",
    "submittedBy": {
      "id": "user-uuid",
      "name": "Marie Dubois",
      "avatar": "avatar-url"
    },
    "submittedAt": "2024-12-10T10:00:00Z",
    "sessionCount": 0,
    "likes": 0,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  },
  "message": "Thème proposé avec succès"
}
```

**Error Responses**:

- **400 Bad Request** - Window is closed:
```json
{
  "success": false,
  "message": "La fenêtre de propositions est actuellement fermée"
}
```

- **400 Bad Request** - Proposal limit reached:
```json
{
  "success": false,
  "message": "Limite de propositions atteinte pour cette fenêtre"
}
```

**Business Logic**:
1. Checks if proposal window is currently open
2. Verifies user hasn't exceeded proposal limit (max 2 per window)
3. Creates theme with status = "pending"
4. Links theme to current active window
5. Records submitter information

**Proposal Limits**:
- Maximum 2 proposals per user per window
- Limit is enforced per active window

---

### 11. Create Theme Directly (Admin)

**POST** `/api/v1/themes/admin/create`

Create a theme directly without going through the proposal window system. Theme is automatically created with "approved" status.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "title": "Gestion du stress",
  "description": "Techniques pour gérer le stress quotidien dans la vie professionnelle et personnelle",
  "category": "Bien-être mental"
}
```

**Field Descriptions**:
- `title` (required): Theme title
- `description` (required): Detailed description of the theme
- `category` (optional): Theme category (e.g., "Bien-être mental", "Développement personnel")

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Gestion du stress",
    "description": "Techniques pour gérer le stress quotidien",
    "category": "Bien-être mental",
    "status": "approved",
    "submittedBy": {
      "id": "admin-uuid",
      "name": "Admin User",
      "avatar": "avatar-url"
    },
    "submittedAt": "2024-12-10T10:00:00Z",
    "reviewedAt": "2024-12-10T10:00:00Z",
    "reviewedBy": "admin-uuid",
    "sessionCount": 0,
    "likes": 0,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  },
  "message": "Thème créé avec succès"
}
```

**Business Logic**:
- Bypasses proposal window system
- Theme is created with status = "approved" by default
- No window association (window_id = null)
- Admin who creates it is automatically set as reviewer
- reviewed_at is set to creation time
- Can be used immediately in sessions

**Use Cases**:
- Quick theme creation for urgent needs
- Importing themes from external sources
- Creating standard/recurring themes
- Bypassing the proposal workflow when needed

---

### 12. Update Theme Status (Approve/Reject)

**PATCH** `/api/v1/themes/{theme_id}`

Approve or reject a theme proposal. Only admins can perform this action.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `theme_id` (UUID): The ID of the theme to update

**Request Body**:
```json
{
  "status": "approved",
  "reviewNotes": "Excellent thème, très pertinent pour notre communauté"
}
```

**Field Descriptions**:
- `status` (required): New status - `approved` or `rejected`
- `reviewNotes` (optional): Admin's review comments

**Success Response - Approved** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Gestion du stress",
    "description": "Techniques pour gérer le stress quotidien",
    "category": "Bien-être mental",
    "status": "approved",
    "submittedBy": {
      "id": "user-uuid",
      "name": "Marie Dubois",
      "avatar": "avatar-url"
    },
    "submittedAt": "2024-12-10T10:00:00Z",
    "reviewedAt": "2024-12-11T14:30:00Z",
    "reviewedBy": "admin-uuid",
    "reviewNotes": "Excellent thème, très pertinent",
    "sessionCount": 0,
    "likes": 0,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-11T14:30:00Z"
  },
  "message": "Thème approuvé avec succès"
}
```

**Success Response - Rejected** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Gestion du stress",
    "status": "rejected",
    "reviewedAt": "2024-12-11T14:30:00Z",
    "reviewedBy": "admin-uuid",
    "reviewNotes": "Thème trop similaire à un thème existant"
  },
  "message": "Thème rejeté avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Theme not found"
}
```

**Business Logic**:
- Sets `reviewedAt` to current timestamp
- Sets `reviewedBy` to admin user ID
- Stores `reviewNotes` if provided
- Updates theme status to approved or rejected
- Once rejected, theme cannot be changed back (would require manual database update)

---

### 13. Delete Theme

**DELETE** `/api/v1/themes/{theme_id}`

Permanently delete a theme.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `theme_id` (UUID): The ID of the theme to delete

**Success Response** (200):
```json
{
  "success": true,
  "message": "Thème supprimé avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Theme not found"
}
```

**Warning**: This action is permanent and cannot be undone. Consider rejecting instead of deleting if you want to keep a record.

---

## Request/Response Schemas

### Theme Schemas

#### CreateThemeRequest
```typescript
{
  title: string;          // Required
  description: string;    // Required
  category?: string;      // Optional
}
```

#### UpdateThemeRequest
```typescript
{
  status: "approved" | "rejected";  // Required
  reviewNotes?: string;             // Optional
}
```

#### ThemeResponse
```typescript
{
  id: string;
  title: string;
  description: string;
  category: string | null;
  status: "pending" | "approved" | "rejected" | "current";
  submittedBy: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  submittedAt: string | null;        // ISO 8601 timestamp
  reviewedAt: string | null;         // ISO 8601 timestamp
  reviewedBy: string | null;          // Admin user ID
  reviewNotes: string | null;
  sessionCount: number;
  nextSessionDate: string | null;    // ISO date
  lastSessionDate: string | null;     // ISO date
  likes: number;
  createdAt: string | null;          // ISO 8601 timestamp
  updatedAt: string | null;          // ISO 8601 timestamp
}
```

#### ThemeWindowStatusResponse
```typescript
{
  isOpen: boolean;
  startDate: string | null;          // ISO 8601 timestamp
  endDate: string | null;            // ISO 8601 timestamp
  daysRemaining: number | null;
  nextOpeningDate: string | null;    // ISO 8601 timestamp
}
```

#### OpenWindowRequest
```typescript
{
  duration: number;  // Days the window should remain open
}
```

#### ExtendWindowRequest
```typescript
{
  additionalDays: number;  // Additional days to add
}
```

#### ThemeWindowResponse
```typescript
{
  id: string;
  startDate: string;        // ISO 8601 timestamp
  endDate: string;          // ISO 8601 timestamp
  isActive: boolean;
}
```

---

## Business Logic & Workflow

### Theme Proposal Workflow

1. **Admin Opens Window**
   - Admin creates a proposal window with a duration
   - Previous windows are automatically deactivated
   - Window becomes active immediately

2. **Member Submits Proposal**
   - Member checks window status
   - If open, member can submit (max 2 per window)
   - Theme is created with status = "pending"
   - Theme is linked to the active window

3. **Admin Reviews**
   - Admin views pending themes
   - Admin approves or rejects with optional notes
   - Theme status changes to "approved" or "rejected"
   - Review timestamp and reviewer are recorded

4. **Theme Usage**
   - Approved themes can be used in sessions
   - Sessions store theme as a string (theme title)
   - Themes are matched to sessions by title

### Window Management Rules

- **Only one active window at a time**
- Opening a new window automatically closes previous ones
- Windows can be extended before they expire
- Windows can be manually closed
- Closing a window doesn't affect pending theme reviews

### Proposal Limits

- **Maximum 2 proposals per user per window**
- Limit is enforced per active window
- Previous window proposals don't count toward new window limit

### Theme Status Flow

```
pending → approved (admin action)
       → rejected (admin action)

approved → can be used in sessions
rejected → cannot be changed back (permanent)
```

### Session Linking

- Sessions store `theme` as a string field (not a foreign key)
- Themes are matched to sessions by comparing `Theme.title` with `Session.theme`
- `/linked` endpoint finds themes used in any session (any status)
- `/unlinked` endpoint finds themes not used in any session

---

## Examples

### Complete Theme Proposal Flow

#### Step 1: Check Window Status
```bash
curl -X GET http://localhost:8000/api/v1/themes/window/status \
  -H "Authorization: Bearer <token>"
```

#### Step 2: Submit Theme Proposal (Member)
```bash
curl -X POST http://localhost:8000/api/v1/themes \
  -H "Authorization: Bearer <member_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gestion du stress",
    "description": "Techniques pour gérer le stress quotidien",
    "category": "Bien-être mental"
  }'
```

#### Step 3: Admin Reviews Pending Themes
```bash
curl -X GET http://localhost:8000/api/v1/themes/pending \
  -H "Authorization: Bearer <admin_token>"
```

#### Step 4: Admin Approves Theme
```bash
curl -X PATCH http://localhost:8000/api/v1/themes/{theme_id} \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "reviewNotes": "Excellent thème"
  }'
```

### Admin Direct Theme Creation

#### Create Theme Directly (Bypass Proposal Window)
```bash
curl -X POST http://localhost:8000/api/v1/themes/admin/create \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Gestion du stress",
    "description": "Techniques pour gérer le stress quotidien",
    "category": "Bien-être mental"
  }'
```

### Admin Window Management

#### Open Window
```bash
curl -X POST http://localhost:8000/api/v1/themes/window/open \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 14
  }'
```

#### Extend Window
```bash
curl -X PATCH http://localhost:8000/api/v1/themes/window/{window_id}/extend \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "additionalDays": 7
  }'
```

#### Close Window
```bash
curl -X POST http://localhost:8000/api/v1/themes/window/{window_id}/close \
  -H "Authorization: Bearer <admin_token>"
```

### Querying Themes

#### Get Linked Themes
```bash
curl -X GET http://localhost:8000/api/v1/themes/linked \
  -H "Authorization: Bearer <token>"
```

#### Get Unlinked Themes
```bash
curl -X GET http://localhost:8000/api/v1/themes/unlinked \
  -H "Authorization: Bearer <token>"
```

#### Get Approved Themes
```bash
curl -X GET "http://localhost:8000/api/v1/themes?status=approved&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message description",
  "errors": {
    "field_name": ["Specific error detail"]
  }
}
```

### Common Error Scenarios

#### 1. Window Closed
```json
{
  "success": false,
  "message": "La fenêtre de propositions est actuellement fermée"
}
```

**Cause**: Trying to submit a theme when no window is open

**Solution**: Wait for admin to open a window or check window status first

#### 2. Proposal Limit Reached
```json
{
  "success": false,
  "message": "Limite de propositions atteinte pour cette fenêtre"
}
```

**Cause**: User has already submitted 2 proposals in the current window

**Solution**: Wait for next window or contact admin

#### 3. Theme Not Found
```json
{
  "success": false,
  "message": "Theme not found"
}
```

**Cause**: Invalid theme ID or theme was deleted

**Solution**: Verify theme ID exists

#### 4. Window Not Found
```json
{
  "success": false,
  "message": "Window not found"
}
```

**Cause**: Invalid window ID

**Solution**: Verify window ID exists

#### 5. Unauthorized Access
```json
{
  "success": false,
  "message": "Not authorized"
}
```

**Cause**: User doesn't have admin role for admin-only endpoints

**Solution**: Use admin or super_admin account

---

## Security Considerations

### 1. Authentication
- All endpoints require authentication (except OTP endpoints)
- JWT tokens must be valid and not expired
- User account must be active

### 2. Authorization
- Window management: Admin/Super Admin only
- Theme approval/rejection: Admin/Super Admin only
- Theme deletion: Admin/Super Admin only
- Theme submission: Any authenticated user (when window is open)

### 3. Proposal Limits
- Enforced per user per window
- Prevents spam and ensures fair distribution
- Limit is configurable in service layer (currently 2)

### 4. Window Management
- Only one active window at a time
- Prevents confusion and ensures clear proposal periods
- Automatic deactivation of previous windows

---

## Best Practices

### For Members

1. **Check Window Status First**
   - Always check `/window/status` before submitting
   - Plan your proposals within the window period

2. **Quality Over Quantity**
   - You can only submit 2 proposals per window
   - Make each proposal thoughtful and detailed

3. **Monitor Your Proposals**
   - Check theme status regularly
   - Review admin feedback if provided

### For Admins

1. **Window Planning**
   - Open windows with sufficient duration (14+ days recommended)
   - Communicate window dates to members
   - Extend windows if needed rather than creating new ones

2. **Review Process**
   - Review pending themes regularly
   - Provide constructive feedback in reviewNotes
   - Approve themes that align with community goals

3. **Theme Management**
   - Use `/linked` to see which themes are being used
   - Use `/unlinked` to find approved themes that haven't been used
   - Consider deleting duplicate or inappropriate themes

---

## API Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/themes/window/status` | GET | Authenticated | Get window status |
| `/themes/window/open` | POST | Admin | Open new window |
| `/themes/window/{id}/extend` | PATCH | Admin | Extend window |
| `/themes/window/{id}/close` | POST | Admin | Close window |
| `/themes` | GET | Authenticated | List themes (paginated) |
| `/themes/pending` | GET | Admin | Get pending themes |
| `/themes/linked` | GET | Authenticated | Get themes linked to sessions |
| `/themes/unlinked` | GET | Authenticated | Get themes not linked to sessions |
| `/themes/{id}` | GET | Authenticated | Get theme by ID |
| `/themes` | POST | Authenticated | Submit theme proposal |
| `/themes/admin/create` | POST | Admin | Create theme directly (bypasses window) |
| `/themes/{id}` | PATCH | Admin | Approve/reject theme |
| `/themes/{id}` | DELETE | Admin | Delete theme |

---

## Troubleshooting

### Common Issues

#### 1. "La fenêtre de propositions est actuellement fermée"
**Solution**: Check window status, wait for admin to open window, or contact admin

#### 2. "Limite de propositions atteinte"
**Solution**: You've reached the 2-proposal limit for this window. Wait for the next window.

#### 3. Theme Not Appearing in `/linked`
**Possible Causes**:
- Theme title doesn't exactly match session theme string
- No sessions exist yet
- Sessions use different theme string format

**Solution**: Ensure session theme strings exactly match theme titles

#### 4. Window Not Closing
**Solution**: Check if window ID is correct, verify admin permissions

---

## Support

For issues or questions:
- Check the main [Backend Guide](./BACKEND_GUIDE.md)
- Review error messages for specific guidance
- Check FastAPI auto-generated docs at `/docs`

---

## Changelog

### Version 1.0.0
- Initial implementation
- Theme proposal window system
- Theme approval/rejection workflow
- Linked/unlinked theme endpoints
- Proposal limit enforcement


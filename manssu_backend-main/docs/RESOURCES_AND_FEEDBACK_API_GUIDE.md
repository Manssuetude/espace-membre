# Resources and Feedback API Guide

Complete documentation for resource management and feedback submission endpoints in the MANSSU backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Resources API](#resources-api)
3. [Feedback API](#feedback-api)
4. [Request/Response Schemas](#requestresponse-schemas)
5. [Business Logic & Workflow](#business-logic--workflow)
6. [Examples](#examples)
7. [Error Handling](#error-handling)
8. [Security & Access Control](#security--access-control)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Resources and Feedback APIs provide functionality for:
- **Resources**: Managing files, videos, audio, links, and folders that can be linked to sessions
- **Feedback**: Submitting and managing user feedback (suggestions, compliments, complaints) related to sessions or general topics

### Key Concepts

**Resources**:
- **Types**: `file`, `video`, `audio`, `folder`
- **Status**: `pending`, `approved`, `rejected` - Resources require admin approval (except when created by admins)
- **File Uploads**: Support for uploading files with size validation
- **Session Linking**: Resources can be associated with specific sessions
- **Categories**: Optional categorization for better organization
- **Approval Workflow**: Normal users create resources with `pending` status; admins can create directly with `approved` status or approve/reject pending resources

**Feedback**:
- **Categories**: `Session`, `Général`, etc.
- **Types**: `Suggestion`, `Compliment`, `Complaint`, etc.
- **Status**: `new`, `read`, `resolved`
- **Anonymous**: Users can submit feedback anonymously
- **Rating**: Optional 1-5 rating for session feedbacks

### Access Levels

**Resources**:
- **Authenticated Users**: Create resources (status: pending, requires approval), view approved resources, update their own resources, access history listings.
- **Admin/Super Admin**: Create resources directly (status: approved, bypasses approval), view all resources (including pending/rejected), approve/reject resources, delete resources, access historical/grouped listings with any status.

**Feedback**:
- **Authenticated Users**: Submit feedback (can be anonymous), view own feedbacks via `/me` endpoint
- **Admin/Super Admin**: View all feedbacks, update status, delete feedbacks

---

## Resources API

Base URL: `/api/v1/resources`

### 1. Get All Resources

**GET** `/api/v1/resources?sessionId={id}&type={type}&search={term}&status={status}&page=1&limit=10`

Get a paginated list of all resources with filtering options.

**Access**: Authenticated (JWT required). Non-admin members always see approved resources by default; admins can request other statuses or `status=all`.

**Query Parameters**:
- `sessionId` (optional): Filter by session ID
- `type` (optional): Filter by resource type - `file`, `video`, `audio`, `folder`
- `search` (optional): Search in title/description
- `status` (optional): Filter by status - `all`, `pending`, `approved`, `rejected` (default: `approved` for members, `all` for admins)
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Présentation PowerPoint",
        "description": "Slides de la session sur l'IA",
        "type": "file",
        "link": "https://example.com/presentation.pdf",
        "folderDescription": null,
        "category": "Presentation",
        "sessionId": "session-uuid-1",
        "status": "approved",
        "reviewedBy": null,
        "reviewedAt": null,
        "reviewNotes": null,
        "filePath": "/uploads/user-id_presentation.pdf",
        "fileSize": 2048576,
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-10T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Vidéo de la session",
        "description": "Enregistrement complet",
        "type": "video",
        "link": "https://youtube.com/watch?v=abc123",
        "folderDescription": null,
        "category": "Recording",
        "sessionId": "session-uuid-1",
        "filePath": null,
        "fileSize": null,
        "createdAt": "2024-12-10T11:00:00Z",
        "updatedAt": "2024-12-10T11:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### 2. Get Resources Grouped by Session History

**GET** `/api/v1/resources/sessions/history?startDate=2024-01-01&endDate=2024-06-30&sessionStatus=completed&resourceStatus=approved&onlyPastSessions=true&page=1&limit=10`

Retrieve paginated sessions (typically past/completed) along with their approved resources, allowing time-based filtering and grouping.

**Access**: Authenticated (JWT required). Admins can include other resource statuses or future sessions via query parameters.

**Query Parameters**:
- `startDate` (optional, ISO date): Include sessions on/after this date
- `endDate` (optional, ISO date): Include sessions on/before this date
- `sessionStatus` (optional): Filter by session status (`completed`, `cancelled`, etc.). Use `past` to automatically target sessions whose date is before today.
- `resourceStatus` (optional): Filter resources by status (`approved`, `pending`, `rejected`, `all`). Default: `approved`
- `onlyPastSessions` (optional, boolean): When `true` (default), limits results to completed/cancelled or already-dated sessions
- `page` / `limit`: Pagination controls (default `page=1`, `limit=10`, max `limit=100`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "session": {
          "id": "session-uuid-1",
          "title": "Atelier d'introduction à l'IA",
          "status": "completed",
          "date": "2024-05-12",
          "type": "workshop",
          "theme": "Innovation",
          "createdAt": "2024-04-01T09:15:00Z"
        },
        "resources": [
          {
            "id": "resource-uuid-1",
            "title": "Slides de présentation",
            "description": "Support PDF de la session",
            "type": "file",
            "link": "https://example.com/slides.pdf",
            "folderDescription": null,
            "category": "Slides",
            "sessionId": "session-uuid-1",
            "status": "approved",
            "createdAt": "2024-05-10T09:00:00Z",
            "updatedAt": "2024-05-10T09:00:00Z"
          },
          {
            "id": "resource-uuid-2",
            "title": "Replay vidéo",
            "description": "Enregistrement complet",
            "type": "video",
            "link": "https://youtube.com/watch?v=abc123",
            "sessionId": "session-uuid-1",
            "status": "approved",
            "createdAt": "2024-05-12T18:00:00Z",
            "updatedAt": "2024-05-12T18:00:00Z"
          }
        ]
      }
    ],
    "total": 4,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 3. Get Resource by ID

**GET** `/api/v1/resources/{resource_id}`

Get detailed information about a specific resource.

**Access**: Authenticated (JWT required)

**Path Parameters**:
- `resource_id` (required): UUID of the resource

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Présentation PowerPoint",
    "description": "Slides de la session sur l'IA",
    "type": "file",
    "link": "https://example.com/presentation.pdf",
    "folderDescription": null,
    "category": "Presentation",
    "sessionId": "session-uuid-1",
    "filePath": "/uploads/user-id_presentation.pdf",
    "fileSize": 2048576,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

### 4. Create Resource

**POST** `/api/v1/resources`

Create a new resource with optional file upload. Normal users create resources with `status="pending"` that require admin approval.

**Access**: Authenticated Users (normal users - creates pending resources)

**Request Body** (multipart/form-data):
- `title` (required, string): Resource title
- `description` (required, string): Resource description
- `type` (required, string): Resource type - `file`, `video`, `audio`, `folder`
- `link` (required, string): URL or link to the resource
- `sessionId` (required, string): UUID of associated session (resources must be linked to a session)
- `folderDescription` (optional, string): Description for folder type resources
- `category` (optional, string): Resource category
- `addToSession` (optional, boolean): Whether to add to session (default: false)
- `file` (optional, file): File to upload (for type="file")

**File Upload Constraints**:
- Maximum file size: Configured in `MAX_UPLOAD_SIZE` environment variable
- File is saved to `UPLOAD_DIR` with naming: `{user_id}_{filename}`

**Success Response** (200):
```json
{
  "success": true,
  "message": "Ressource créée avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Présentation PowerPoint",
    "description": "Slides de la session sur l'IA",
    "type": "file",
    "link": "https://example.com/presentation.pdf",
    "folderDescription": null,
    "category": "Presentation",
    "sessionId": "session-uuid-1",
    "filePath": "/uploads/user-id_presentation.pdf",
    "fileSize": 2048576,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

**Example Request** (cURL):
```bash
curl -X POST "http://localhost:8000/api/v1/resources" \
  -H "Authorization: Bearer {token}" \
  -F "title=Présentation PowerPoint" \
  -F "description=Slides de la session sur l'IA" \
  -F "type=file" \
  -F "link=https://example.com/presentation.pdf" \
  -F "category=Presentation" \
  -F "sessionId=session-uuid-1" \
  -F "file=@/path/to/presentation.pdf"
```

**Note**: Resources created by normal users have `status: "pending"` and require admin approval before they appear in public listings.

### 5. Get Pending Resources (Admin Only)

**GET** `/api/v1/resources/pending`

Get all pending resources that require admin approval.

**Access**: Admin/Super Admin only

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Présentation PowerPoint",
      "description": "Slides de la session sur l'IA",
      "type": "file",
      "link": "https://example.com/presentation.pdf",
      "status": "pending",
      "sessionId": "session-uuid-1",
      "createdAt": "2024-12-10T10:00:00Z"
    }
  ]
}
```

### 6. Create Resource Directly (Admin Only)

**POST** `/api/v1/resources/admin/create`

Create a resource directly with `status="approved"` (bypasses approval workflow).

**Access**: Admin/Super Admin only

**Request Body** (multipart/form-data): Same as normal create resource endpoint.

**Success Response** (200):
```json
{
  "success": true,
  "message": "Ressource créée avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Présentation PowerPoint",
    "description": "Slides de la session sur l'IA",
    "type": "file",
    "link": "https://example.com/presentation.pdf",
    "status": "approved",
    "reviewedBy": "admin-uuid-1",
    "reviewedAt": "2024-12-10T10:00:00Z",
    "createdAt": "2024-12-10T10:00:00Z"
  }
}
```

**Note**: Resources created via this endpoint are automatically approved and immediately visible to all users.

### 7. Update Resource Status (Admin Only)

**PATCH** `/api/v1/resources/{resource_id}/status`

Approve or reject a pending resource.

**Access**: Admin/Super Admin only

**Path Parameters**:
- `resource_id` (required): UUID of the resource

**Request Body** (JSON):
```json
{
  "status": "approved",
  "reviewNotes": "Excellent resource, approved for publication"
}
```

or

```json
{
  "status": "rejected",
  "reviewNotes": "Content does not meet our quality standards"
}
```

**Request Fields**:
- `status` (required, string): `approved` or `rejected`
- `reviewNotes` (optional, string): Notes from the reviewer

**Success Response** (200):
```json
{
  "success": true,
  "message": "Ressource approuvée avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Présentation PowerPoint",
    "description": "Slides de la session sur l'IA",
    "type": "file",
    "status": "approved",
    "reviewedBy": "admin-uuid-1",
    "reviewedAt": "2024-12-10T14:30:00Z",
    "reviewNotes": "Excellent resource, approved for publication",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T14:30:00Z"
  }
}
```

### 8. Update Resource

**PATCH** `/api/v1/resources/{resource_id}`

Update an existing resource.

**Access**: Authenticated Users (can update their own resources)

**Path Parameters**:
- `resource_id` (required): UUID of the resource

**Request Body** (JSON):
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "type": "video",
  "link": "https://new-link.com",
  "category": "Updated Category",
  "sessionId": "new-session-uuid"
}
```

All fields are optional - only provided fields will be updated.

**Success Response** (200):
```json
{
  "success": true,
  "message": "Ressource mise à jour avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Title",
    "description": "Updated description",
    "type": "video",
    "link": "https://new-link.com",
    "category": "Updated Category",
    "sessionId": "new-session-uuid",
    "filePath": "/uploads/user-id_presentation.pdf",
    "fileSize": 2048576,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T14:30:00Z"
  }
}
```

### 9. Delete Resource (Admin Only)

**DELETE** `/api/v1/resources/{resource_id}`

Delete a resource. If the resource has an uploaded file, the file is also deleted from the server.

**Access**: Admin/Super Admin only

**Path Parameters**:
- `resource_id` (required): UUID of the resource

**Success Response** (200):
```json
{
  "success": true,
  "message": "Ressource supprimée avec succès"
}
```

---

## Feedback API

Base URL: `/api/v1/feedbacks`

### 1. Get All Feedbacks

**GET** `/api/v1/feedbacks?status=all&category=all&page=1&limit=10`

Get a paginated list of all feedbacks with filtering options.

**Access**: Admin/Super Admin only

**Query Parameters**:
- `status` (optional): Filter by status - `all`, `new`, `read`, `resolved` (default: `all`)
- `category` (optional): Filter by category - `all`, `Session`, `Général`, etc. (default: `all`)
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "category": "Session",
        "type": "Suggestion",
        "subject": "Améliorer la qualité audio",
        "message": "L'audio de la session était parfois difficile à entendre.",
        "anonymous": false,
        "rating": 4,
        "sessionId": "session-uuid-1",
        "submittedBy": "user-uuid-1",
        "submittedAt": "2024-12-10T10:00:00Z",
        "status": "new",
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-10T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "category": "Général",
        "type": "Compliment",
        "subject": "Excellent travail",
        "message": "Merci pour cette excellente initiative !",
        "anonymous": true,
        "rating": null,
        "sessionId": null,
        "submittedBy": null,
        "submittedAt": "2024-12-10T11:00:00Z",
        "status": "read",
        "createdAt": "2024-12-10T11:00:00Z",
        "updatedAt": "2024-12-10T12:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### 2. Get My Feedbacks

**GET** `/api/v1/feedbacks/me?status=all&category=all&page=1&limit=10`

Get a paginated list of feedbacks submitted by the current authenticated user. Only returns non-anonymous feedbacks (feedbacks where the user's ID is stored).

**Access**: Authenticated Users

**Query Parameters**:
- `status` (optional): Filter by status - `all`, `new`, `read`, `resolved` (default: `all`)
- `category` (optional): Filter by category - `all`, `Session`, `Général`, etc. (default: `all`)
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "category": "Session",
        "type": "Suggestion",
        "subject": "Améliorer la qualité audio",
        "message": "L'audio de la session était parfois difficile à entendre.",
        "anonymous": false,
        "rating": 4,
        "sessionId": "session-uuid-1",
        "submittedBy": "user-uuid-1",
        "submittedAt": "2024-12-10T10:00:00Z",
        "status": "new",
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-10T10:00:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Note**: Anonymous feedbacks (where `anonymous: true`) are not included in this endpoint since they don't have a `submittedBy` value.

### 3. Get Feedback by ID

**GET** `/api/v1/feedbacks/{feedback_id}`

Get detailed information about a specific feedback.

**Access**: Admin/Super Admin only

**Path Parameters**:
- `feedback_id` (required): UUID of the feedback

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "Session",
    "type": "Suggestion",
    "subject": "Améliorer la qualité audio",
    "message": "L'audio de la session était parfois difficile à entendre.",
    "anonymous": false,
    "rating": 4,
    "sessionId": "session-uuid-1",
    "submittedBy": "user-uuid-1",
    "submittedAt": "2024-12-10T10:00:00Z",
    "status": "new",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

### 4. Create Feedback

**POST** `/api/v1/feedbacks`

Submit a new feedback. Can be anonymous or linked to the authenticated user.

**Access**: Authenticated Users

**Request Body** (JSON):
```json
{
  "category": "Session",
  "type": "Suggestion",
  "subject": "Améliorer la qualité audio",
  "message": "L'audio de la session était parfois difficile à entendre.",
  "anonymous": false,
  "rating": 4,
  "sessionId": "session-uuid-1"
}
```

**Request Fields**:
- `category` (required, string): Feedback category - `Session`, `Général`, etc.
- `type` (required, string): Feedback type - `Suggestion`, `Compliment`, `Complaint`, etc.
- `subject` (required, string): Feedback subject/title
- `message` (required, string): Feedback message/content
- `anonymous` (optional, boolean): Whether feedback is anonymous (default: false)
- `rating` (optional, integer): Rating from 1-5 (for session feedbacks)
- `sessionId` (optional, string): UUID of associated session (for session feedbacks)

**Business Logic**:
- If `anonymous` is `true`, `submittedBy` will be `null` (user ID is not stored)
- If `anonymous` is `false`, the authenticated user's ID is stored in `submittedBy`
- `status` is automatically set to `"new"` when created
- `submittedAt` is automatically set to current timestamp

**Success Response** (200):
```json
{
  "success": true,
  "message": "Feedback soumis avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "Session",
    "type": "Suggestion",
    "subject": "Améliorer la qualité audio",
    "message": "L'audio de la session était parfois difficile à entendre.",
    "anonymous": false,
    "rating": 4,
    "sessionId": "session-uuid-1",
    "submittedBy": "user-uuid-1",
    "submittedAt": "2024-12-10T10:00:00Z",
    "status": "new",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

### 5. Update Feedback Status

**PATCH** `/api/v1/feedbacks/{feedback_id}`

Update the status of a feedback (Admin only).

**Access**: Admin/Super Admin only

**Path Parameters**:
- `feedback_id` (required): UUID of the feedback

**Request Body** (JSON):
```json
{
  "status": "read"
}
```

**Status Values**:
- `new`: Newly submitted feedback (default)
- `read`: Feedback has been read by admin
- `resolved`: Feedback has been resolved/addressed

**Success Response** (200):
```json
{
  "success": true,
  "message": "Statut du feedback mis à jour avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "Session",
    "type": "Suggestion",
    "subject": "Améliorer la qualité audio",
    "message": "L'audio de la session était parfois difficile à entendre.",
    "anonymous": false,
    "rating": 4,
    "sessionId": "session-uuid-1",
    "submittedBy": "user-uuid-1",
    "submittedAt": "2024-12-10T10:00:00Z",
    "status": "read",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T14:30:00Z"
  }
}
```

### 6. Delete Feedback

**DELETE** `/api/v1/feedbacks/{feedback_id}`

Delete a feedback (Admin only).

**Access**: Admin/Super Admin only

**Path Parameters**:
- `feedback_id` (required): UUID of the feedback

**Success Response** (200):
```json
{
  "success": true,
  "message": "Feedback supprimé avec succès"
}
```

---

## Request/Response Schemas

### Resource Schemas

#### CreateResourceRequest
```typescript
{
  title: string;                    // Required
  description: string;               // Required
  type: "file" | "video" | "audio" | "folder";  // Required
  link: string;                      // Required
  sessionId: string;                 // Required (UUID) - Resources must be linked to a session
  folderDescription?: string;        // Optional (for folder type)
  category?: string;                 // Optional
  addToSession?: boolean;            // Optional (default: false)
}
```

#### UpdateResourceRequest
```typescript
{
  title?: string;
  description?: string;
  type?: "file" | "video" | "audio" | "folder";
  link?: string;
  folderDescription?: string;
  category?: string;
  sessionId?: string;
}
```

#### ResourceResponse
```typescript
{
  id: string;                        // UUID
  title: string;
  description: string;
  type: "file" | "video" | "audio" | "folder";
  link: string;
  folderDescription: string | null;
  category: string | null;
  sessionId: string | null;          // UUID
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;          // Admin UUID who reviewed
  reviewedAt: string | null;          // ISO 8601 timestamp
  reviewNotes: string | null;         // Review notes from admin
  filePath: string | null;            // Path to uploaded file
  fileSize: number | null;            // File size in bytes
  createdAt: string | null;           // ISO 8601 timestamp
  updatedAt: string | null;           // ISO 8601 timestamp
}
```

#### UpdateResourceStatusRequest
```typescript
{
  status: "approved" | "rejected";   // Required
  reviewNotes?: string;                // Optional
}
```

#### SessionResourceGroupResponse
```typescript
{
  session: {
    id: string;
    title: string;
    status?: string;
    date?: string;        // ISO date string
    type?: string;
    theme?: string;
    createdAt?: string;   // ISO timestamp
  };
  resources: ResourceResponse[];
}
```

### Feedback Schemas

#### CreateFeedbackRequest
```typescript
{
  category: string;                  // Required (e.g., "Session", "Général")
  type: string;                      // Required (e.g., "Suggestion", "Compliment", "Complaint")
  subject: string;                    // Required
  message: string;                    // Required
  anonymous?: boolean;                // Optional (default: false)
  rating?: number;                    // Optional (1-5, for session feedbacks)
  sessionId?: string;                 // Optional (UUID, for session feedbacks)
}
```

#### UpdateFeedbackRequest
```typescript
{
  status: "new" | "read" | "resolved";  // Required
}
```

#### FeedbackResponse
```typescript
{
  id: string;                        // UUID
  category: string;
  type: string;
  subject: string;
  message: string;
  anonymous: boolean;
  rating: number | null;              // 1-5 or null
  sessionId: string | null;           // UUID or null
  submittedBy: string | null;        // User UUID or null (if anonymous)
  submittedAt: string | null;        // ISO 8601 timestamp
  status: "new" | "read" | "resolved";
  createdAt: string | null;           // ISO 8601 timestamp
  updatedAt: string | null;           // ISO 8601 timestamp
}
```

---

## Business Logic & Workflow

### Resources

1. **Resource Creation**:
   - **Normal Users**: 
     - User provides resource details (title, description, type, link, **sessionId**)
     - `sessionId` is **required** - resources must be linked to a session
     - Session is validated to ensure it exists
     - Optional file upload (for type="file")
     - File is validated for size (must not exceed `MAX_UPLOAD_SIZE`)
     - File is saved to `UPLOAD_DIR` with naming: `{user_id}_{filename}`
     - Resource is created with `status="pending"` and `created_by` set to authenticated user
     - Resource requires admin approval before appearing in public listings
   - **Admins**:
     - Can use `/admin/create` endpoint to create resources directly
     - `sessionId` is **required** - resources must be linked to a session
     - Session is validated to ensure it exists
     - Resource is created with `status="approved"` (bypasses approval)
     - `reviewed_by` is set to admin who created it
     - `reviewed_at` is set to current timestamp
     - Resource is immediately visible to all users

2. **Resource Types**:
   - **file**: Uploaded file resource (requires file upload)
   - **video**: Video link (YouTube, Vimeo, etc.)
   - **audio**: Audio link (podcast, music, etc.)
   - **folder**: Folder/collection of resources (uses `folderDescription`)

3. **Session Linking**:
   - Resources can be linked to sessions via `sessionId`
   - When `addToSession` is `true`, the resource is automatically linked
   - Linked resources appear in session detail responses

4. **Resource Approval Workflow**:
   - Normal users create resources with `status="pending"`
   - Admins can view pending resources via `GET /api/v1/resources/pending`
   - Admins can approve or reject resources via `PATCH /api/v1/resources/{id}/status`
   - When approved: `status` set to `"approved"`, `reviewed_by` and `reviewed_at` are set
   - When rejected: `status` set to `"rejected"`, `reviewed_by`, `reviewed_at`, and `review_notes` are set
   - Only approved resources appear in public listings (default behavior)

5. **Resource Deletion**:
   - When a resource with an uploaded file is deleted, the file is also removed from the server
   - File deletion happens before database record deletion

### Feedback

1. **Feedback Submission**:
   - User submits feedback with category, type, subject, and message
   - Can be anonymous (`anonymous: true`) or linked to user (`anonymous: false`)
   - If anonymous, `submittedBy` is set to `null`
   - If not anonymous, `submittedBy` is set to authenticated user's ID
   - `status` is automatically set to `"new"`
   - `submittedAt` is automatically set to current timestamp

2. **Feedback Status Workflow**:
   - **new**: Newly submitted feedback (default)
   - **read**: Admin has read the feedback
   - **resolved**: Feedback has been addressed/resolved

3. **Session Feedback**:
   - If `sessionId` is provided, feedback is linked to that session
   - `rating` (1-5) is typically provided for session feedbacks
   - Session feedbacks help track session quality and user satisfaction

4. **Anonymous Feedback**:
   - Users can submit feedback anonymously
   - `submittedBy` is `null` for anonymous feedbacks
   - Useful for sensitive feedback or complaints

---

## Examples

### Example 1: Create a File Resource

**Request**:
```bash
POST /api/v1/resources
Content-Type: multipart/form-data
Authorization: Bearer {token}

title: Présentation PowerPoint
description: Slides de la session sur l'IA
type: file
link: https://example.com/presentation.pdf
category: Presentation
sessionId: session-uuid-1
file: [binary file data]
```

**Response**:
```json
{
  "success": true,
  "message": "Ressource créée avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Présentation PowerPoint",
    "description": "Slides de la session sur l'IA",
    "type": "file",
    "link": "https://example.com/presentation.pdf",
    "folderDescription": null,
    "category": "Presentation",
    "sessionId": "session-uuid-1",
    "filePath": "/uploads/user-id_presentation.pdf",
    "fileSize": 2048576,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

### Example 2: Create a Video Resource (No File Upload)

**Request**:
```bash
POST /api/v1/resources
Content-Type: multipart/form-data
Authorization: Bearer {token}

title: Vidéo de la session
description: Enregistrement complet de la session
type: video
link: https://youtube.com/watch?v=abc123
category: Recording
sessionId: session-uuid-1
```

**Response**:
```json
{
  "success": true,
  "message": "Ressource créée avec succès",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Vidéo de la session",
    "description": "Enregistrement complet de la session",
    "type": "video",
    "link": "https://youtube.com/watch?v=abc123",
    "folderDescription": null,
    "category": "Recording",
    "sessionId": "session-uuid-1",
    "filePath": null,
    "fileSize": null,
    "createdAt": "2024-12-10T11:00:00Z",
    "updatedAt": "2024-12-10T11:00:00Z"
  }
}
```

### Example 3: Submit Session Feedback

**Request**:
```bash
POST /api/v1/feedbacks
Content-Type: application/json
Authorization: Bearer {token}

{
  "category": "Session",
  "type": "Suggestion",
  "subject": "Améliorer la qualité audio",
  "message": "L'audio de la session était parfois difficile à entendre. Peut-être utiliser des microphones de meilleure qualité.",
  "anonymous": false,
  "rating": 4,
  "sessionId": "session-uuid-1"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Feedback soumis avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "Session",
    "type": "Suggestion",
    "subject": "Améliorer la qualité audio",
    "message": "L'audio de la session était parfois difficile à entendre. Peut-être utiliser des microphones de meilleure qualité.",
    "anonymous": false,
    "rating": 4,
    "sessionId": "session-uuid-1",
    "submittedBy": "user-uuid-1",
    "submittedAt": "2024-12-10T10:00:00Z",
    "status": "new",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

### Example 4: Submit Anonymous General Feedback

**Request**:
```bash
POST /api/v1/feedbacks
Content-Type: application/json
Authorization: Bearer {token}

{
  "category": "Général",
  "type": "Compliment",
  "subject": "Excellent travail",
  "message": "Merci pour cette excellente initiative !",
  "anonymous": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Feedback soumis avec succès",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "category": "Général",
    "type": "Compliment",
    "subject": "Excellent travail",
    "message": "Merci pour cette excellente initiative !",
    "anonymous": true,
    "rating": null,
    "sessionId": null,
    "submittedBy": null,
    "submittedAt": "2024-12-10T11:00:00Z",
    "status": "new",
    "createdAt": "2024-12-10T11:00:00Z",
    "updatedAt": "2024-12-10T11:00:00Z"
  }
}
```

### Example 5: Admin Updates Feedback Status

**Request**:
```bash
PATCH /api/v1/feedbacks/550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
Authorization: Bearer {admin_token}

{
  "status": "resolved"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Statut du feedback mis à jour avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "Session",
    "type": "Suggestion",
    "subject": "Améliorer la qualité audio",
    "message": "L'audio de la session était parfois difficile à entendre.",
    "anonymous": false,
    "rating": 4,
    "sessionId": "session-uuid-1",
    "submittedBy": "user-uuid-1",
    "submittedAt": "2024-12-10T10:00:00Z",
    "status": "resolved",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T15:00:00Z"
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "detail": "File size exceeds maximum allowed size of 10485760 bytes"
}
```

**Causes**:
- File upload exceeds `MAX_UPLOAD_SIZE`
- Invalid request body format
- Missing required fields

#### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

**Causes**:
- Missing or invalid JWT token
- Token expired
- User not authenticated

#### 403 Forbidden
```json
{
  "detail": "Admin access required"
}
```

**Causes**:
- User does not have admin/super_admin role
- Attempting to access admin-only endpoints

#### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

or

```json
{
  "detail": "Feedback not found"
}
```

**Causes**:
- Resource/feedback ID does not exist
- Invalid UUID format

#### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Causes**:
- Validation errors in request body
- Invalid field types or values
- Missing required fields

---

## Security & Access Control

### Resources

- **View Resources**: Public access (approved resources only by default). Admins can view all resources.
- **Create Resources**: Requires authentication (normal users create pending resources)
- **Create Resources Directly**: Admin/Super Admin only (creates approved resources, bypasses approval)
- **View Pending Resources**: Admin/Super Admin only
- **Approve/Reject Resources**: Admin/Super Admin only
- **Update Resources**: Requires authentication (users can update their own resources)
- **Delete Resources**: Requires authentication (users can delete their own resources)

### Feedback

- **Submit Feedback**: Requires authentication (any authenticated user)
- **View Feedbacks**: Admin/Super Admin only
- **Update Feedback Status**: Admin/Super Admin only
- **Delete Feedback**: Admin/Super Admin only

### File Upload Security

- File size is validated against `MAX_UPLOAD_SIZE` configuration
- Files are stored in a configured `UPLOAD_DIR` directory
- File names are prefixed with user ID to prevent conflicts
- Files are deleted when resource is deleted

### Anonymous Feedback

- Users can submit feedback anonymously
- Anonymous feedbacks have `submittedBy: null`
- Useful for sensitive feedback or complaints
- Admins can still view and manage anonymous feedbacks

---

## Best Practices

### Resources

1. **File Uploads**:
   - Always validate file size before upload
   - Use appropriate file types for different resource types
   - Provide meaningful titles and descriptions
   - Link resources to sessions when relevant

2. **Resource Organization**:
   - Use categories to organize resources
   - Provide clear descriptions for better discoverability
   - Use folder type for grouping related resources

3. **Link Resources**:
   - For video/audio resources, use direct links (YouTube, Vimeo, etc.)
   - Ensure links are accessible and valid
   - Consider providing both link and file upload options

### Feedback

1. **Feedback Submission**:
   - Provide clear, actionable feedback
   - Use appropriate categories and types
   - Include ratings for session feedbacks when applicable
   - Consider using anonymous option for sensitive feedback

2. **Feedback Management** (Admin):
   - Regularly review and update feedback status
   - Respond to feedback appropriately
   - Use status workflow (new → read → resolved)
   - Delete inappropriate or spam feedbacks

3. **Session Feedback**:
   - Encourage users to provide session feedback
   - Use ratings to track session quality
   - Link feedbacks to specific sessions for context

---

## Troubleshooting

### Issue: File Upload Fails

**Symptoms**: 400 Bad Request with file size error

**Solutions**:
- Check file size against `MAX_UPLOAD_SIZE` configuration
- Ensure `UPLOAD_DIR` directory exists and is writable
- Verify file is not corrupted
- Check available disk space

### Issue: Resource Not Found After Creation

**Symptoms**: Resource created but returns 404 when accessed

**Solutions**:
- Verify resource ID is correct (UUID format)
- Check database connection
- Ensure resource was actually created (check database)

### Issue: Feedback Not Appearing in List

**Symptoms**: Feedback created but not visible in admin list

**Solutions**:
- Verify user has admin/super_admin role
- Check feedback status filter
- Verify feedback was actually created (check database)
- Check pagination parameters

### Issue: Anonymous Feedback Shows User ID

**Symptoms**: Anonymous feedback has `submittedBy` set

**Solutions**:
- Verify `anonymous: true` was sent in request
- Check service logic for anonymous handling
- Ensure `submittedBy` is set to `null` when anonymous

### Issue: File Not Deleted When Resource Deleted

**Symptoms**: Resource deleted but file remains on server

**Solutions**:
- Check file path is correct
- Verify file exists at specified path
- Check file permissions
- Ensure delete logic runs before database deletion

---

## Summary

The Resources and Feedback APIs provide comprehensive functionality for:

- **Resources**: Managing files, videos, audio, links, and folders with optional file uploads and session linking
- **Feedback**: Submitting and managing user feedback with support for anonymous submissions and status tracking

Both APIs follow RESTful principles and provide proper error handling, authentication, and access control. Resources are accessible to all users for viewing, while feedback management is restricted to admins for privacy and moderation purposes.


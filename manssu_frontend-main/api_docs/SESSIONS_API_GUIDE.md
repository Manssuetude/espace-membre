# Sessions API Guide

Complete documentation for session management endpoints in the MANSSU backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Session CRUD Operations](#session-crud-operations)
3. [Session Registration](#session-registration)
4. [Work Groups Management](#work-groups-management)
5. [Request/Response Schemas](#requestresponse-schemas)
6. [Business Logic & Workflow](#business-logic--workflow)
7. [Examples](#examples)
8. [Error Handling](#error-handling)

---

## Overview

The Sessions API manages educational sessions, including workshops, conferences, group sessions, and individual sessions. Sessions can be linked to themes, locations, and include work groups for collaborative activities.

### Key Concepts

- **Session Types**: `workshop`, `conference`, `group`, `individual`
- **Session Status**: `upcoming`, `ongoing`, `completed`, `cancelled`
- **Location**: Sessions reference Location model via `location_id` (not inline location data)
- **Work Groups**: Collaborative groups created for sessions with automatic or manual member assignment
- **Registration**: Users can register for sessions (with capacity limits)

### Access Levels

- **Public**: View sessions, get session details, view work groups
- **Authenticated Users**: Register for sessions
- **Admin/Super Admin**: Create, update, delete sessions, manage work groups

---

## Session CRUD Operations

Base URL: `/api/v1/sessions`

### 1. Get All Sessions

**GET** `/api/v1/sessions?status=all&theme=&search=&page=1&limit=10`

Get a paginated list of all sessions with filtering options.

**Access**: Public (no authentication required, but authenticated users get `isRegistered` field)

**Query Parameters**:
- `status` (optional): Filter by status - `all`, `upcoming`, `ongoing`, `completed`, `cancelled` (default: `all`)
- `theme` (optional): Filter by theme name (exact match)
- `search` (optional): Search in title/theme
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Example Request**:
```
GET /api/v1/sessions?status=upcoming&page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Workshop: Gestion du stress",
        "description": "Un atelier complet sur la gestion du stress au quotidien",
        "theme": "Gestion du stress",
        "type": "workshop",
        "date": "2024-12-20",
        "startTime": "09:00",
        "endTime": "12:00",
        "locationId": "location-uuid",
        "location": {
          "id": "location-uuid",
          "name": "Main Conference Room",
          "address": "123 Main Street, Paris, France",
          "instructions": "Enter through the main door",
          "latitude": 48.8566,
          "longitude": 2.3522,
          "googlePlaceId": "ChIJ..."
        },
        "isOnline": false,
        "maxParticipants": 30,
        "objectives": [
          "Comprendre les mécanismes du stress",
          "Apprendre des techniques de gestion"
        ],
        "registered": 15,
        "status": "upcoming",
        "isRegistered": false,
        "attendanceRate": null,
        "averageGrade": null,
        "duration": null,
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-10T10:00:00Z"
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

### 2. Get Session by ID

**GET** `/api/v1/sessions/{session_id}`

Get detailed information about a specific session, including work groups, polls, and resources.

**Access**: Public (no authentication required, but authenticated users get `isRegistered` field)

**Path Parameters**:
- `session_id` (UUID): The ID of the session to retrieve

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Workshop: Gestion du stress",
    "description": "Un atelier complet sur la gestion du stress au quotidien",
    "theme": "Gestion du stress",
    "type": "workshop",
    "date": "2024-12-20",
    "startTime": "09:00",
    "endTime": "12:00",
    "locationId": "location-uuid",
    "location": {
      "id": "location-uuid",
      "name": "Main Conference Room",
      "address": "123 Main Street, Paris, France",
      "instructions": "Enter through the main door",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "googlePlaceId": "ChIJ..."
    },
    "isOnline": false,
    "maxParticipants": 30,
    "objectives": [
      "Comprendre les mécanismes du stress",
      "Apprendre des techniques de gestion"
    ],
    "registered": 15,
    "status": "upcoming",
    "isRegistered": false,
    "workGroups": [
      {
        "id": "group-uuid",
        "name": "Groupe A",
        "letter": "A",
        "color": "primary",
        "members": [
          {
            "id": "user-uuid",
            "name": "Marie Dubois",
            "avatar": "avatar-url",
            "isLeader": true
          }
        ]
      }
    ],
    "polls": [],
    "resources": [],
    "attendanceRate": null,
    "averageGrade": null,
    "duration": null,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Session not found"
}
```

---

### 3. Create Session

**POST** `/api/v1/sessions`

Create a new session. Only admins can create sessions.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "title": "Workshop: Gestion du stress",
  "description": "Un atelier complet sur la gestion du stress au quotidien",
  "theme": "Gestion du stress",
  "type": "workshop",
  "date": "2024-12-20",
  "startTime": "09:00",
  "endTime": "12:00",
  "locationId": "location-uuid",
  "isOnline": false,
  "maxParticipants": 30,
  "objectives": [
    "Comprendre les mécanismes du stress",
    "Apprendre des techniques de gestion"
  ]
}
```

**Field Descriptions**:
- `title` (required): Session title
- `description` (optional): Detailed description of the session
- `theme` (optional): Theme name (string, not linked to themes table)
- `type` (required): Session type - `workshop`, `conference`, `group`, `individual`
- `date` (optional): Session date (ISO date format: YYYY-MM-DD)
- `startTime` (optional): Start time (HH:MM format)
- `endTime` (optional): End time (HH:MM format)
- `locationId` (optional): UUID of location from locations table
- `isOnline` (required): Whether session is online (default: false)
- `maxParticipants` (required): Maximum number of participants
- `objectives` (optional): Array of learning objectives (strings)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Workshop: Gestion du stress",
    "description": "Un atelier complet sur la gestion du stress au quotidien",
    "theme": "Gestion du stress",
    "type": "workshop",
    "date": "2024-12-20",
    "startTime": "09:00",
    "endTime": "12:00",
    "locationId": "location-uuid",
    "location": {
      "id": "location-uuid",
      "name": "Main Conference Room",
      "address": "123 Main Street, Paris, France",
      "instructions": "Enter through the main door",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "googlePlaceId": "ChIJ..."
    },
    "isOnline": false,
    "maxParticipants": 30,
    "objectives": [
      "Comprendre les mécanismes du stress",
      "Apprendre des techniques de gestion"
    ],
    "registered": 0,
    "status": "upcoming",
    "isRegistered": false,
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  },
  "message": "Session créée avec succès"
}
```

**Important Notes**:
- Sessions use `locationId` to reference the Location model (not inline location data)
- If `locationId` is provided, the full location details are included in the response
- Theme is stored as a string (can match theme titles from themes table)

---

### 4. Update Session

**PATCH** `/api/v1/sessions/{session_id}`

Update an existing session. Only admins can update sessions.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `session_id` (UUID): The ID of the session to update

**Request Body**: All fields optional
```json
{
  "title": "Updated Workshop Title",
  "description": "Updated description",
  "status": "ongoing",
  "maxParticipants": 35,
  "locationId": "new-location-uuid",
  "objectives": ["New objective 1", "New objective 2"]
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Workshop Title",
    "description": "Updated description",
    "status": "ongoing",
    "maxParticipants": 35,
    "locationId": "new-location-uuid",
    "location": {
      "id": "new-location-uuid",
      "name": "New Location",
      "address": "456 New Street",
      "instructions": null,
      "latitude": 48.8606,
      "longitude": 2.3376,
      "googlePlaceId": null
    },
    "objectives": ["New objective 1", "New objective 2"],
    "isRegistered": false
  },
  "message": "Session mise à jour avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Session not found"
}
```

---

### 5. Delete Session

**DELETE** `/api/v1/sessions/{session_id}`

Permanently delete a session. Only admins can delete sessions.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `session_id` (UUID): The ID of the session to delete

**Success Response** (200):
```json
{
  "success": true,
  "message": "Session supprimée avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Session not found"
}
```

**Warning**: This action is permanent and will delete all related data (registrations, work groups, objectives, etc.).

---

## Session Registration

### 6. Register for Session

**POST** `/api/v1/sessions/{session_id}/register`

Register the current user for a session.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `session_id` (UUID): The ID of the session to register for

**Success Response** (200):
```json
{
  "success": true,
  "message": "Inscription réussie"
}
```

**Error Responses**:

- **400 Bad Request** - Already registered or session full:
```json
{
  "success": false,
  "message": "Cannot register: session full or already registered"
}
```

**Business Logic**:
- Checks if user is already registered
- Checks if session has reached `maxParticipants`
- Increments `registered` count on session
- Creates `SessionRegistration` record

---

### 7. Unregister from Session

**DELETE** `/api/v1/sessions/{session_id}/register`

Unregister the current user from a session.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `session_id` (UUID): The ID of the session to unregister from

**Success Response** (200):
```json
{
  "success": true,
  "message": "Désinscription réussie"
}
```

**Error Responses**:

- **400 Bad Request** - Not registered:
```json
{
  "success": false,
  "message": "Cannot unregister: not registered for this session"
}
```

**Business Logic**:
- Checks if user is registered for the session
- Deletes the `SessionRegistration` record
- Decrements `registered` count on session
- If user is not registered, returns error

---

## Work Groups Management

### 8. Create Work Groups

**POST** `/api/v1/sessions/{session_id}/groups`

Create work groups for a session. Automatically assigns registered users to groups.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `session_id` (UUID): The ID of the session

**Request Body**:
```json
{
  "numberOfGroups": 4,
  "isRandom": true,
  "assignments": {
    "user-uuid-1": 0,
    "user-uuid-2": 1
  }
}
```

**Field Descriptions**:
- `numberOfGroups` (required): Number of groups to create
- `isRandom` (optional): Whether to randomly assign users (default: false)
- `assignments` (optional): Manual assignments - `{user_id: group_index}` where group_index is 0-based

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "group-uuid-1",
      "name": "Groupe A",
      "letter": "A",
      "color": "primary",
      "members": [
        {
          "id": "user-uuid-1",
          "name": "Marie Dubois",
          "avatar": "avatar-url",
          "isLeader": true
        },
        {
          "id": "user-uuid-2",
          "name": "Pierre Martin",
          "avatar": "avatar-url",
          "isLeader": false
        }
      ]
    },
    {
      "id": "group-uuid-2",
      "name": "Groupe B",
      "letter": "B",
      "color": "accent",
      "members": [
        {
          "id": "user-uuid-3",
          "name": "Jean Dupont",
          "avatar": "avatar-url",
          "isLeader": true
        }
      ]
    }
  ],
  "message": "Groupes créés avec succès"
}
```

**Business Logic**:
1. Deletes existing groups for the session
2. Creates new groups (named "Groupe A", "Groupe B", etc.)
3. Assigns colors: `primary`, `accent`, `secondary`, `success` (rotating)
4. Assigns registered users to groups:
   - If `isRandom` is true, shuffles users before assignment
   - If `assignments` provided, uses manual assignments
   - Otherwise, assigns sequentially (round-robin)
5. First user in each group becomes leader (`isLeader: true`)

**Group Naming**:
- Groups are named "Groupe A", "Groupe B", "Groupe C", etc.
- Letters are assigned sequentially (A, B, C, ...)

---

### 9. Get Work Groups

**GET** `/api/v1/sessions/{session_id}/groups`

Get all work groups for a session with their members.

**Access**: Public (no authentication required, but authenticated users get `isRegistered` field)

**Path Parameters**:
- `session_id` (UUID): The ID of the session

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "group-uuid-1",
      "name": "Groupe A",
      "letter": "A",
      "color": "primary",
      "members": [
        {
          "id": "user-uuid-1",
          "name": "Marie Dubois",
          "avatar": "avatar-url",
          "isLeader": true
        },
        {
          "id": "user-uuid-2",
          "name": "Pierre Martin",
          "avatar": "avatar-url",
          "isLeader": false
        }
      ]
    }
  ]
}
```

---

## Request/Response Schemas

### Session Schemas

#### CreateSessionRequest
```typescript
{
  title: string;                    // Required
  description?: string;            // Optional
  theme?: string;                   // Optional
  type: "workshop" | "conference" | "group" | "individual";  // Required
  date?: string;                    // Optional (ISO date: YYYY-MM-DD)
  startTime?: string;               // Optional (HH:MM)
  endTime?: string;                 // Optional (HH:MM)
  locationId?: string;              // Optional (UUID)
  isOnline: boolean;                // Required (default: false)
  maxParticipants: number;          // Required
  objectives?: string[];           // Optional (array of strings)
}
```

#### UpdateSessionRequest
```typescript
{
  title?: string;
  description?: string;
  theme?: string;
  type?: "workshop" | "conference" | "group" | "individual";
  date?: string;
  startTime?: string;
  endTime?: string;
  locationId?: string;
  isOnline?: boolean;
  maxParticipants?: number;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
  objectives?: string[];            // If provided, replaces all existing objectives
}
```

#### SessionResponse
```typescript
{
  id: string;
  title: string;
  description: string | null;
  theme: string | null;
  type: string;
  date: string | null;              // ISO date
  startTime: string | null;        // HH:MM
  endTime: string | null;          // HH:MM
  locationId: string | null;       // UUID
  location: {
    id: string;
    name: string | null;
    address: string;
    instructions: string | null;
    latitude: number | null;
    longitude: number | null;
    googlePlaceId: string | null;
  } | null;
  isOnline: boolean;
  maxParticipants: number;
  objectives: string[];             // Always an array (empty if none)
  registered: number;
  status: string;
  isRegistered: boolean;            // true if authenticated user is registered
  attendanceRate: number | null;
  averageGrade: number | null;
  duration: string | null;
  createdAt: string | null;         // ISO 8601 timestamp
  updatedAt: string | null;        // ISO 8601 timestamp
}
```

#### SessionDetailResponse
Extends `SessionResponse` with:
```typescript
{
  workGroups: Array<{
    id: string;
    name: string;
    letter: string;
    color: string;
    members: Array<{
      id: string;
      name: string;
      avatar: string | null;
      isLeader: boolean;
    }>;
  }> | null;
  polls: any[] | null;
  resources: any[] | null;
}
```

#### WorkGroupCreateRequest
```typescript
{
  numberOfGroups: number;           // Required
  isRandom: boolean;                // Optional (default: false)
  assignments?: {                   // Optional
    [user_id: string]: number;      // user_id -> group_index (0-based)
  };
}
```

#### WorkGroupResponse
```typescript
{
  id: string;
  name: string;
  letter: string;
  color: string;
  members: Array<{
    id: string;
    name: string;
    avatar: string | null;
    isLeader: boolean;
  }> | null;
}
```

---

## Business Logic & Workflow

### Session Lifecycle

1. **Creation** (Admin)
   - Admin creates session with basic info
   - Session starts with status `upcoming`
   - `registered` count starts at 0

2. **Registration** (Users)
   - Users register for session
   - `registered` count increments
   - Registration fails if session is full

3. **Group Assignment** (Admin)
   - Admin creates work groups
   - Registered users are assigned to groups
   - Groups can be random or manually assigned

4. **Session Execution**
   - Admin updates status to `ongoing`
   - Work groups collaborate
   - Polls and resources can be added

5. **Completion**
   - Admin updates status to `completed`
   - Attendance and grades can be recorded
   - `attendanceRate` and `averageGrade` are calculated

### Location Integration

- Sessions reference Location model via `location_id` foreign key
- Location details are included in session responses via relationship
- If `locationId` is null, session is online or location TBD
- Location includes: `id`, `name`, `address`, `instructions`, `latitude`, `longitude`, `googlePlaceId`

### Registration Status

- The `isRegistered` field indicates if the authenticated user is registered for the session
- For unauthenticated requests, `isRegistered` is always `false`
- For authenticated requests, `isRegistered` reflects the user's actual registration status
- This field is included in all session list and detail responses

### Work Group Assignment Logic

1. **Sequential Assignment** (default):
   - Users assigned round-robin: User 1 → Group A, User 2 → Group B, etc.

2. **Random Assignment** (`isRandom: true`):
   - Users shuffled randomly before assignment
   - Then assigned round-robin

3. **Manual Assignment** (`assignments` provided):
   - Specific users assigned to specific groups
   - Other users assigned sequentially

4. **Leader Assignment**:
   - First user in each group becomes leader
   - Leader flag: `isLeader: true`

### Session Status Flow

```
upcoming → ongoing → completed
         ↘ cancelled
```

- `upcoming`: Scheduled, not started
- `ongoing`: Currently in progress
- `completed`: Finished
- `cancelled`: Cancelled before completion

---

## Examples

### Complete Session Workflow

#### Step 1: Create Session (Admin)
```bash
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop: Gestion du stress",
    "description": "Un atelier complet sur la gestion du stress au quotidien",
    "theme": "Gestion du stress",
    "type": "workshop",
    "date": "2024-12-20",
    "startTime": "09:00",
    "endTime": "12:00",
    "locationId": "location-uuid",
    "isOnline": false,
    "maxParticipants": 30,
    "objectives": [
      "Comprendre les mécanismes du stress",
      "Apprendre des techniques de gestion"
    ]
  }'
```

#### Step 2: Users Register
```bash
curl -X POST http://localhost:8000/api/v1/sessions/{session_id}/register \
  -H "Authorization: Bearer <user_token>"
```

#### Step 2b: User Unregisters (Optional)
```bash
curl -X DELETE http://localhost:8000/api/v1/sessions/{session_id}/register \
  -H "Authorization: Bearer <user_token>"
```

#### Step 3: Admin Creates Work Groups
```bash
curl -X POST http://localhost:8000/api/v1/sessions/{session_id}/groups \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGroups": 4,
    "isRandom": true
  }'
```

#### Step 4: Get Session Details
```bash
curl -X GET http://localhost:8000/api/v1/sessions/{session_id} \
  -H "Authorization: Bearer <token>"
```

### Querying Sessions

#### Get Upcoming Sessions
```bash
curl -X GET "http://localhost:8000/api/v1/sessions?status=upcoming&page=1&limit=10"
```

#### Search Sessions
```bash
curl -X GET "http://localhost:8000/api/v1/sessions?search=stress&page=1&limit=10"
```

#### Filter by Theme
```bash
curl -X GET "http://localhost:8000/api/v1/sessions?theme=Gestion%20du%20stress"
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message description"
}
```

### Common Error Scenarios

#### 1. Session Not Found
```json
{
  "success": false,
  "message": "Session not found"
}
```

**Cause**: Invalid session ID or session was deleted

**Solution**: Verify session ID exists

#### 2. Registration Failed
```json
{
  "success": false,
  "message": "Cannot register: session full or already registered"
}
```

**Cause**: 
- User already registered
- Session reached `maxParticipants`

**Solution**: Check registration status or wait for available spots

#### 2b. Unregistration Failed
```json
{
  "success": false,
  "message": "Cannot unregister: not registered for this session"
}
```

**Cause**: 
- User is not registered for the session

**Solution**: Verify registration status before attempting to unregister

#### 3. Unauthorized Access
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
- Registration endpoint requires authentication
- Admin endpoints require admin/super_admin role
- Public endpoints (GET) don't require authentication

### 2. Authorization
- Session creation/update/deletion: Admin/Super Admin only
- Work group creation: Admin/Super Admin only
- Registration/Unregistration: Any authenticated user

### 3. Capacity Management
- Registration checks `maxParticipants` limit
- Prevents overbooking
- Registration count is automatically maintained

### 4. Data Integrity
- Location references are validated (foreign key)
- Work groups are tied to sessions
- Deletion cascades to related data

---

## Best Practices

### For Admins

1. **Session Planning**
   - Set realistic `maxParticipants` limits
   - Link sessions to existing locations via `locationId`
   - Provide clear objectives

2. **Work Group Management**
   - Create groups after most registrations are complete
   - Use random assignment for balanced groups
   - Use manual assignment for specific requirements

3. **Status Management**
   - Update status to `ongoing` when session starts
   - Update to `completed` when finished
   - Mark as `cancelled` if needed

### For Users

1. **Registration**
   - Register early for popular sessions
   - Check session capacity before registering
   - Verify registration was successful
   - Use unregister endpoint if you need to cancel your registration
   - Unregistering frees up a spot for other users

2. **Group Participation**
   - Check work group assignments
   - Coordinate with group members
   - Follow group leader guidance

---

## API Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/sessions` | GET | Public | List sessions (paginated, filtered) |
| `/sessions/{id}` | GET | Public | Get session details |
| `/sessions` | POST | Admin | Create session |
| `/sessions/{id}` | PATCH | Admin | Update session |
| `/sessions/{id}` | DELETE | Admin | Delete session |
| `/sessions/{id}/register` | POST | Authenticated | Register for session |
| `/sessions/{id}/register` | DELETE | Authenticated | Unregister from session |
| `/sessions/{id}/groups` | POST | Admin | Create work groups |
| `/sessions/{id}/groups` | GET | Public | Get work groups |

---

## Troubleshooting

### Common Issues

#### 1. "Cannot register: session full or already registered"
**Solution**: Check if you're already registered or if session has reached capacity

#### 2. Location Not Showing in Response
**Possible Causes**:
- `locationId` is null
- Location was deleted
- Location relationship not loaded

**Solution**: Verify location exists and `locationId` is correct

#### 3. Work Groups Not Created
**Possible Causes**:
- No users registered for session
- Invalid session ID

**Solution**: Ensure users have registered before creating groups

---

## Support

For issues or questions:
- Check the main [Backend Guide](./BACKEND_GUIDE.md)
- Review error messages for specific guidance
- Check FastAPI auto-generated docs at `/docs`

---

## Changelog

### Version 1.1.0
- Added `description` field to sessions (optional)
- Added `isRegistered` field to session responses (for authenticated users)
- Added `latitude` and `longitude` to location objects in responses
- Objectives always returned as array (never null)
- Added unregister endpoint (`DELETE /sessions/{id}/register`)

### Version 1.0.0
- Initial implementation
- Session CRUD operations
- Registration system
- Work groups management
- Location integration via foreign key


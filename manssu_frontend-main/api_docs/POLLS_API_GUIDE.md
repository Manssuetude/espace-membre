# Polls API Guide

Complete documentation for poll management and voting endpoints in the MANSSU backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Poll CRUD Operations](#poll-crud-operations)
3. [Voting](#voting)
4. [Request/Response Schemas](#requestresponse-schemas)
5. [Business Logic & Workflow](#business-logic--workflow)
6. [Examples](#examples)
7. [Error Handling](#error-handling)

---

## Overview

The Polls API manages interactive polls and surveys that can be linked to sessions. Polls support multiple choice questions, real-time or hidden results, anonymous voting, and configurable response limits.

### Key Concepts

- **Poll Status**: `draft`, `active`, `completed`
- **Results Visibility**: `realtime` (show results immediately) or `hidden` (hide until poll ends)
- **Single Response**: Controls whether users can select multiple options (`false`) or only one (`true`)
- **Anonymous Voting**: Whether votes are associated with user identities
- **Options**: Multiple choice answers for the poll question
- **Votes**: User selections on poll options

### Access Levels

- **Public**: View polls, view poll details
- **Authenticated Users**: Vote on active polls
- **Admin/Super Admin**: Create, update, delete polls

---

## Poll CRUD Operations

Base URL: `/api/v1/polls`

### 1. Get All Polls

**GET** `/api/v1/polls?status=all&page=1&limit=10`

Get a paginated list of all polls with filtering options. Includes all options with vote counts and percentages.

**Access**: Public (no authentication required)

**Query Parameters**:
- `status` (optional): Filter by status - `all`, `draft`, `active`, `completed` (default: `all`)
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Example Request**:
```
GET /api/v1/polls?status=active&page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Préférence de format",
        "question": "Quel format préférez-vous pour la prochaine session ?",
        "description": "Votez pour votre format préféré",
        "status": "active",
        "totalResponses": 15,
        "totalMembers": 30,
        "participation": 50.0,
        "resultsVisibility": "realtime",
        "anonymous": false,
        "singleResponse": true,
        "startDate": "2024-12-20",
        "endDate": "2024-12-25",
        "daysLeft": 5,
        "options": [
          {
            "id": "option-uuid-1",
            "label": "En présentiel",
            "votes": 8,
            "percentage": 53.33,
            "color": "primary",
            "orderIndex": 0
          },
          {
            "id": "option-uuid-2",
            "label": "En ligne",
            "votes": 5,
            "percentage": 33.33,
            "color": "accent",
            "orderIndex": 1
          },
          {
            "id": "option-uuid-3",
            "label": "Hybride",
            "votes": 2,
            "percentage": 13.33,
            "color": "secondary",
            "orderIndex": 2
          }
        ],
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

### 2. Get Poll by ID

**GET** `/api/v1/polls/{poll_id}`

Get detailed information about a specific poll, including all options with vote counts and percentages, and the full list of voters.

**Access**: Public (no authentication required)

**Path Parameters**:
- `poll_id` (UUID): The ID of the poll to retrieve

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Préférence de format",
    "question": "Quel format préférez-vous pour la prochaine session ?",
    "description": "Votez pour votre format préféré",
    "status": "active",
    "totalResponses": 15,
    "totalMembers": 30,
    "participation": 50.0,
    "resultsVisibility": "realtime",
    "anonymous": false,
    "singleResponse": true,
    "startDate": "2024-12-20",
    "endDate": "2024-12-25",
    "daysLeft": 5,
    "options": [
      {
        "id": "option-uuid-1",
        "label": "En présentiel",
        "votes": 8,
        "percentage": 53.33,
        "color": "primary",
        "orderIndex": 0
      },
      {
        "id": "option-uuid-2",
        "label": "En ligne",
        "votes": 5,
        "percentage": 33.33,
        "color": "accent",
        "orderIndex": 1
      },
      {
        "id": "option-uuid-3",
        "label": "Hybride",
        "votes": 2,
        "percentage": 13.33,
        "color": "secondary",
        "orderIndex": 2
      }
    ],
    "voters": [
      {
        "id": "user-uuid-1",
        "firstName": "Marie",
        "lastName": "Dubois",
        "name": "Marie Dubois",
        "avatar": "avatar-url",
        "optionId": "option-uuid-1",
        "optionLabel": "En présentiel",
        "votedAt": "2024-12-20T10:15:00Z"
      },
      {
        "id": "user-uuid-2",
        "firstName": "Pierre",
        "lastName": "Martin",
        "name": "Pierre Martin",
        "avatar": "avatar-url",
        "optionId": "option-uuid-2",
        "optionLabel": "En ligne",
        "votedAt": "2024-12-20T11:30:00Z"
      }
    ],
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  }
}
```

**Voters Field**:
- Contains the full list of users who voted on the poll
- Ordered by vote time (earliest first)
- Includes user information and which option they voted for
- Each voter entry includes: `id`, `firstName`, `lastName`, `name`, `avatar`, `optionId`, `optionLabel`, `votedAt`

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Poll not found"
}
```

---

### 3. Create Poll

**POST** `/api/v1/polls`

Create a new poll with options. Only admins can create polls.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "title": "Préférence de format",
  "question": "Quel format préférez-vous pour la prochaine session ?",
  "description": "Votez pour votre format préféré",
  "startDate": "2024-12-20",
  "endDate": "2024-12-25",
  "resultsVisibility": "realtime",
  "anonymous": false,
  "singleResponse": true,
  "sessionId": "session-uuid-here",
  "options": [
    {
      "label": "En présentiel",
      "color": "primary"
    },
    {
      "label": "En ligne",
      "color": "accent"
    },
    {
      "label": "Hybride",
      "color": "secondary"
    }
  ]
}
```

**Field Descriptions**:
- `title` (required): Poll title
- `question` (required): The poll question text
- `description` (optional): Additional description or context
- `startDate` (required): When the poll becomes active (ISO date: YYYY-MM-DD)
- `endDate` (optional): When the poll ends (ISO date: YYYY-MM-DD)
- `resultsVisibility` (optional): `"realtime"` (default) or `"hidden"` - when to show results
- `anonymous` (optional): Whether votes are anonymous (default: `false`)
- `singleResponse` (optional): Whether users can only select one option (default: `true`)
  - `true`: Users can vote once but can change their vote
  - `false`: Users can vote multiple times on different options
- `sessionId` (optional): UUID of session to link poll to
- `options` (required): Array of poll options (minimum 2)
  - `label` (required): The option text
  - `color` (optional): Color for the option (`"primary"`, `"accent"`, `"secondary"`, `"success"`)
    - If not provided, colors are assigned automatically in rotation

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Préférence de format",
    "question": "Quel format préférez-vous pour la prochaine session ?",
    "description": "Votez pour votre format préféré",
    "status": "active",
    "totalResponses": 0,
    "totalMembers": 0,
    "participation": null,
    "resultsVisibility": "realtime",
    "anonymous": false,
    "singleResponse": true,
    "startDate": "2024-12-20",
    "endDate": "2024-12-25",
    "daysLeft": 5,
    "options": [
      {
        "id": "option-uuid-1",
        "label": "En présentiel",
        "votes": 0,
        "percentage": 0.0,
        "color": "primary",
        "orderIndex": 0
      },
      {
        "id": "option-uuid-2",
        "label": "En ligne",
        "votes": 0,
        "percentage": 0.0,
        "color": "accent",
        "orderIndex": 1
      },
      {
        "id": "option-uuid-3",
        "label": "Hybride",
        "votes": 0,
        "percentage": 0.0,
        "color": "secondary",
        "orderIndex": 2
      }
    ],
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  },
  "message": "Sondage créé avec succès"
}
```

**Important Notes**:
- Polls are created with status `"active"` by default
- Options are assigned colors automatically if not provided (rotating: primary, accent, secondary, success)
- Option order is preserved based on the array order
- Polls can be linked to sessions via `sessionId`

---

### 4. Update Poll

**PATCH** `/api/v1/polls/{poll_id}`

Update an existing poll. Only admins can update polls.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `poll_id` (UUID): The ID of the poll to update

**Request Body**: All fields optional
```json
{
  "title": "Updated Poll Title",
  "question": "Updated question?",
  "description": "Updated description",
  "status": "completed",
  "resultsVisibility": "hidden",
  "endDate": "2024-12-30"
}
```

**Field Descriptions**:
- `title` (optional): Poll title
- `question` (optional): The poll question text
- `description` (optional): Additional description
- `status` (optional): Poll status - `"draft"`, `"active"`, `"completed"`
- `resultsVisibility` (optional): `"realtime"` or `"hidden"`
- `endDate` (optional): When the poll ends (ISO date: YYYY-MM-DD)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Poll Title",
    "question": "Updated question?",
    "status": "completed",
    "resultsVisibility": "hidden"
  },
  "message": "Sondage mis à jour avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Poll not found"
}
```

**Note**: Poll options cannot be updated after creation. To change options, delete and recreate the poll.

---

### 5. Delete Poll

**DELETE** `/api/v1/polls/{poll_id}`

Permanently delete a poll. Only admins can delete polls.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `poll_id` (UUID): The ID of the poll to delete

**Success Response** (200):
```json
{
  "success": true,
  "message": "Sondage supprimé avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Poll not found"
}
```

**Warning**: This action is permanent and will delete all related data (options, votes, etc.).

---

## Voting

### 6. Vote on Poll

**POST** `/api/v1/polls/{poll_id}/vote`

Vote on a poll option. Users can vote on active polls.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `poll_id` (UUID): The ID of the poll to vote on

**Request Body**:
```json
{
  "optionId": "option-uuid-1"
}
```

**Field Descriptions**:
- `optionId` (required): UUID of the poll option to vote for

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Vote enregistré avec succès",
    "pollId": "550e8400-e29b-41d4-a716-446655440000",
    "optionId": "option-uuid-1"
  },
  "message": "Vote enregistré avec succès"
}
```

**Error Responses**:

- **400 Bad Request** - Cannot vote:
```json
{
  "success": false,
  "message": "Cannot vote: poll not active, already voted, or invalid option"
}
```

**Business Logic**:
- Checks if poll is active and within date range
- If `singleResponse` is `true`: Updates existing vote if user already voted, otherwise creates new vote
- If `singleResponse` is `false`: Creates a new vote (allows multiple selections)
- Updates option vote counts and percentages
- Recalculates participation percentage
- Updates `daysLeft` if `endDate` is set

---

## Request/Response Schemas

### Poll Schemas

#### CreatePollRequest
```typescript
{
  title: string;                    // Required
  question: string;                 // Required
  description?: string;              // Optional
  startDate: string;                // Required (ISO date: YYYY-MM-DD)
  endDate?: string;                  // Optional (ISO date: YYYY-MM-DD)
  resultsVisibility?: string;        // Optional ("realtime" | "hidden", default: "realtime")
  anonymous?: boolean;              // Optional (default: false)
  singleResponse?: boolean;         // Optional (default: true)
  sessionId?: string;              // Optional (UUID)
  options: Array<{                  // Required (minimum 2)
    label: string;                  // Required
    color?: string;                 // Optional ("primary" | "accent" | "secondary" | "success")
  }>;
}
```

#### UpdatePollRequest
```typescript
{
  title?: string;
  question?: string;
  description?: string;
  status?: "draft" | "active" | "completed";
  resultsVisibility?: "realtime" | "hidden";
  endDate?: string;                 // ISO date: YYYY-MM-DD
}
```

#### PollResponse
```typescript
{
  id: string;
  title: string;
  question: string;
  description: string | null;
  status: "draft" | "active" | "completed";
  totalResponses: number;
  totalMembers: number;
  participation: number | null;     // Percentage
  resultsVisibility: "realtime" | "hidden";
  anonymous: boolean;
  singleResponse: boolean;
  startDate: string;               // ISO date
  endDate: string | null;           // ISO date
  daysLeft: number | null;
  options: Array<{
    id: string;
    label: string;
    votes: number;
    percentage: number;
    color: string;
    orderIndex: number;
  }>;                              // Always included with vote counts and percentages
  createdAt: string | null;         // ISO 8601 timestamp
  updatedAt: string | null;         // ISO 8601 timestamp
}
```

#### PollOptionResponse
```typescript
{
  id: string;
  label: string;
  votes: number;
  percentage: number;
  color: string;
  orderIndex: number;
}
```

#### VoteRequest
```typescript
{
  optionId: string;                 // Required (UUID)
}
```

#### VoteResponse
```typescript
{
  message: string;
  pollId: string;
  optionId: string;
}
```

---

## Business Logic & Workflow

### Poll Lifecycle

1. **Creation** (Admin)
   - Admin creates poll with question and options
   - Poll starts with status `"active"`
   - `totalResponses` starts at 0
   - Options are created with 0 votes and 0% percentage

2. **Voting** (Users)
   - Users vote on active polls
   - Vote counts and percentages are updated in real-time
   - Participation percentage is recalculated

3. **Completion**
   - Poll status automatically changes to `"completed"` when `endDate` is reached
   - Admin can manually set status to `"completed"`
   - Results can be hidden until completion if `resultsVisibility` is `"hidden"`

### Single Response vs Multiple Responses

**`singleResponse: true`** (default):
- Users can only have one active vote
- If user votes again, their previous vote is updated (they can change their mind)
- `totalResponses` counts unique voters, not total votes
- Best for: "Choose one" type questions

**`singleResponse: false`**:
- Users can vote multiple times on different options
- Each vote creates a new record
- `totalResponses` counts total votes (may exceed number of voters)
- Best for: "Select all that apply" type questions

### Results Visibility

**`resultsVisibility: "realtime"`** (default):
- Vote counts and percentages are visible immediately
- Users can see results as they vote
- Updates in real-time

**`resultsVisibility: "hidden"`**:
- Results are hidden until poll is completed
- Vote counts and percentages are `0` or hidden in responses
- Useful for preventing bias in voting

### Anonymous Voting

**`anonymous: false`** (default):
- Votes are associated with user IDs
- Can track who voted for what
- Useful for accountability

**`anonymous: true`**:
- Votes are not linked to user identities
- Privacy-focused voting
- Note: Still requires authentication to vote

### Option Colors

If `color` is not provided when creating options, colors are assigned automatically in rotation:
1. `"primary"`
2. `"accent"`
3. `"secondary"`
4. `"success"`
5. (repeats)

### Vote Calculation

- **Vote Count**: Number of votes for each option
- **Percentage**: `(option.votes / totalResponses) * 100`
- **Participation**: `(totalResponses / totalMembers) * 100` (if `totalMembers` is set)
- **Days Left**: `(endDate - today).days` (if `endDate` is set)

### Session Integration

- Polls can be linked to sessions via `sessionId`
- Useful for session-specific polls
- Polls can also exist independently (no `sessionId`)

---

## Examples

### Complete Poll Workflow

#### Step 1: Create Poll (Admin)
```bash
curl -X POST http://localhost:8000/api/v1/polls \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Préférence de format",
    "question": "Quel format préférez-vous pour la prochaine session ?",
    "description": "Votez pour votre format préféré",
    "startDate": "2024-12-20",
    "endDate": "2024-12-25",
    "resultsVisibility": "realtime",
    "anonymous": false,
    "singleResponse": true,
    "sessionId": "session-uuid",
    "options": [
      {
        "label": "En présentiel",
        "color": "primary"
      },
      {
        "label": "En ligne",
        "color": "accent"
      },
      {
        "label": "Hybride"
      }
    ]
  }'
```

#### Step 2: Users Vote
```bash
curl -X POST http://localhost:8000/api/v1/polls/{poll_id}/vote \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "optionId": "option-uuid-1"
  }'
```

#### Step 3: Get Poll Results
```bash
curl -X GET http://localhost:8000/api/v1/polls/{poll_id} \
  -H "Authorization: Bearer <token>"
```

### Querying Polls

#### Get Active Polls
```bash
curl -X GET "http://localhost:8000/api/v1/polls?status=active&page=1&limit=10"
```

#### Get Completed Polls
```bash
curl -X GET "http://localhost:8000/api/v1/polls?status=completed"
```

### Multiple Response Poll Example

```json
{
  "title": "Intérêts de formation",
  "question": "Quels sujets vous intéressent ? (Plusieurs choix possibles)",
  "startDate": "2024-12-20",
  "singleResponse": false,
  "options": [
    { "label": "Gestion du stress" },
    { "label": "Communication" },
    { "label": "Leadership" },
    { "label": "Productivité" }
  ]
}
```

### Hidden Results Poll Example

```json
{
  "title": "Élection du thème",
  "question": "Quel thème préférez-vous pour la prochaine session ?",
  "startDate": "2024-12-20",
  "endDate": "2024-12-25",
  "resultsVisibility": "hidden",
  "singleResponse": true,
  "options": [
    { "label": "Thème A" },
    { "label": "Thème B" },
    { "label": "Thème C" }
  ]
}
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

#### 1. Poll Not Found
```json
{
  "success": false,
  "message": "Poll not found"
}
```

**Cause**: Invalid poll ID or poll was deleted

**Solution**: Verify poll ID exists

#### 2. Cannot Vote
```json
{
  "success": false,
  "message": "Cannot vote: poll not active, already voted, or invalid option"
}
```

**Causes**:
- Poll is not active (status is not `"active"`)
- Poll hasn't started yet (`startDate` is in the future)
- Poll has ended (`endDate` has passed)
- Invalid `optionId` (option doesn't belong to poll)
- User already voted and `singleResponse` is `true` (though they can change their vote)

**Solution**: Check poll status, dates, and option validity

#### 3. Unauthorized Access
```json
{
  "success": false,
  "message": "Not authorized"
}
```

**Cause**: User doesn't have admin role for admin-only endpoints

**Solution**: Use admin or super_admin account

#### 4. Validation Error
```json
{
  "success": false,
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "question"],
      "msg": "Field required"
    }
  ]
}
```

**Cause**: Missing required fields or invalid data format

**Solution**: Check request body matches schema requirements

---

## Security Considerations

### 1. Authentication
- Voting endpoint requires authentication
- Admin endpoints require admin/super_admin role
- Public endpoints (GET) don't require authentication

### 2. Authorization
- Poll creation/update/deletion: Admin/Super Admin only
- Voting: Any authenticated user
- Viewing: Public (no authentication required)

### 3. Vote Integrity
- Users can only vote on active polls
- Option validation ensures votes are for valid options
- Single response enforcement prevents duplicate votes (when enabled)
- Vote updates are tracked with timestamps

### 4. Data Integrity
- Session references are validated (foreign key)
- Options are tied to polls
- Deletion cascades to related data (options, votes)

---

## Best Practices

### For Admins

1. **Poll Planning**
   - Set clear start and end dates
   - Use `singleResponse: true` for "choose one" questions
   - Use `singleResponse: false` for "select all that apply" questions
   - Use `resultsVisibility: "hidden"` to prevent voting bias

2. **Option Design**
   - Provide at least 2 options
   - Keep option labels clear and concise
   - Use colors to visually distinguish options
   - Order options logically

3. **Status Management**
   - Create polls in `"draft"` status if not ready
   - Set to `"active"` when ready for voting
   - Set to `"completed"` when voting period ends
   - Polls automatically complete when `endDate` is reached

### For Users

1. **Voting**
   - Check poll status before voting
   - Verify poll dates (start/end)
   - Understand `singleResponse` setting
   - You can change your vote if `singleResponse` is `true`

2. **Viewing Results**
   - Results are visible in real-time if `resultsVisibility` is `"realtime"`
   - Results are hidden if `resultsVisibility` is `"hidden"` until poll completes
   - Check participation percentage to gauge engagement

---

## API Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/polls` | GET | Public | List polls (paginated, filtered) |
| `/polls/{id}` | GET | Public | Get poll details with options |
| `/polls` | POST | Admin | Create poll |
| `/polls/{id}` | PATCH | Admin | Update poll |
| `/polls/{id}` | DELETE | Admin | Delete poll |
| `/polls/{id}/vote` | POST | Authenticated | Vote on poll |

---

## Troubleshooting

### Common Issues

#### 1. "Cannot vote: poll not active, already voted, or invalid option"
**Possible Causes**:
- Poll status is not `"active"`
- Poll `startDate` is in the future
- Poll `endDate` has passed
- Invalid `optionId`
- User already voted (check `singleResponse` setting)

**Solution**: Verify poll status, dates, and option validity. If `singleResponse` is `true`, users can change their vote.

#### 2. Results Not Showing
**Possible Causes**:
- `resultsVisibility` is set to `"hidden"`
- Poll is not completed yet

**Solution**: Wait for poll completion or change `resultsVisibility` to `"realtime"`

#### 3. Vote Count Not Updating
**Possible Causes**:
- Poll is not active
- Invalid option ID
- Database transaction issue

**Solution**: Verify poll status and option validity. Check server logs for errors.

#### 4. Percentage Calculation Issues
**Possible Causes**:
- `totalResponses` is 0 (division by zero)
- Vote counts not properly updated

**Solution**: Ensure votes are being recorded correctly. Percentages are calculated as `(option.votes / totalResponses) * 100`

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
- Poll CRUD operations
- Voting system
- Single and multiple response support
- Real-time and hidden results
- Session integration
- Anonymous voting support


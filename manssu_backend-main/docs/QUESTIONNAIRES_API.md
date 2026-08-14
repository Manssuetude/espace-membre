## Questionnaires API Documentation

Base URL: `/api/v1/questionnaires`

All endpoints require authentication via Bearer token in the `Authorization` header.

- **Admin**: `admin`, `super_admin`
- **Member**: `member`
- **Guest**: `guest`

---

## 1. Admin endpoints

### 1.1 GET `/api/v1/questionnaires`

List questionnaires with filtering and pagination.

- **Access**: Admin only (`admin` or `super_admin`)

**Headers**:

```text
Authorization: Bearer <admin_access_token>
```

**Query parameters**:

- **`status`** (optional, string, default: `"all"`):  
  - Allowed values: `"all"`, `"draft"`, `"published"`, `"closed"`
- **`page`** (optional, integer, default: `1`, minimum: `1`): Page number
- **`limit`** (optional, integer, default: `10`, minimum: `1`, maximum: `100`): Items per page

**Example request**:

```text
GET /api/v1/questionnaires?status=published&page=1&limit=20
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
        "title": "Onboarding questionnaire",
        "description": "Collect some basic information about new members",
        "status": "published",
        "startDate": "2026-01-28",
        "endDate": "2026-02-15",
        "editWindowMinutes": 1440,
        "hasResponse": false,
        "isSubmitted": false,
        "createdAt": "2026-01-28T10:00:00Z",
        "updatedAt": "2026-01-28T10:00:00Z"
      },
      {
        "id": "d2f2c0b3-2345-4b8d-9e0d-222222222222",
        "title": "Satisfaction questionnaire - January",
        "description": "Feedback on recent activities",
        "status": "closed",
        "startDate": "2026-01-01",
        "endDate": "2026-01-15",
        "editWindowMinutes": 60,
        "hasResponse": true,
        "isSubmitted": true,
        "createdAt": "2026-01-01T08:00:00Z",
        "updatedAt": "2026-01-16T09:30:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

Notes:

- `hasResponse` / `isSubmitted` refer to the **current admin user** if they have answered (usually not used, but consistent with member view).

---

### 1.2 POST `/api/v1/questionnaires`

Create a new questionnaire (questions + options).

- **Access**: Admin only

**Headers**:

```text
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request body**:

```json
{
  "title": "Onboarding questionnaire",
  "description": "Collect some basic information about new members",
  "startDate": "2026-01-28",
  "endDate": "2026-02-15",
  "editWindowMinutes": 1440,
  "questions": [
    {
      "question": "How did you hear about us?",
      "description": "Choose the main source",
      "type": "single_choice",
      "required": true,
      "orderIndex": 0,
      "options": [
        { "label": "Friend or family" },
        { "label": "Social media" },
        { "label": "Event" },
        { "label": "Other" }
      ]
    },
    {
      "question": "Which topics are you interested in?",
      "description": "Select one or more",
      "type": "multiple_choice",
      "required": false,
      "orderIndex": 1,
      "options": [
        { "label": "Philosophy" },
        { "label": "Psychology" },
        { "label": "Politics" },
        { "label": "Science" }
      ]
    },
    {
      "question": "Tell us a bit about yourself",
      "type": "text",
      "required": false,
      "orderIndex": 2
    },
    {
      "question": "How comfortable are you with public speaking?",
      "type": "rating",
      "required": false,
      "orderIndex": 3
    }
  ]
}
```

**Field descriptions**:

- **`title`** (required, string): Questionnaire title (max 255 chars).
- **`description`** (optional, string): Description shown to members.
- **`startDate`** (optional, string, `YYYY-MM-DD`): First day it becomes active when status = `published`. If `null`, active immediately after publish.
- **`endDate`** (optional, string, `YYYY-MM-DD`): Last day for answering. After this, questionnaire is considered over.
- **`editWindowMinutes`** (optional, integer): How long a user can edit their answers after first submission (per user). If `null`, defaults to 60 minutes in the service.
- **`questions`** (required, array): List of question definitions:
  - `question` (required, string): Question text.
  - `description` (optional, string): Helper text.
  - `type` (required, string): One of:
    - `"single_choice"`
    - `"multiple_choice"`
    - `"text"`
    - `"rating"`
    - `"number"`
    - `"date"`
  - `required` (optional, boolean, default: `false`): If `true`, question is mandatory from a UX point of view (backend does not yet enforce per-question required logic).
  - `orderIndex` (optional, integer, default: `0`): Display order.
  - `options` (required for choice types, optional otherwise):
    - Each option:
      - `label` (required, string)
      - `value` (optional, string): Internal code; if omitted, frontend can just use label.

**Success response** (200):

```json
{
  "success": true,
  "message": "Questionnaire créé avec succès",
  "data": {
    "id": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
    "title": "Onboarding questionnaire",
    "description": "Collect some basic information about new members",
    "status": "draft",
    "startDate": "2026-01-28",
    "endDate": "2026-02-15",
    "editWindowMinutes": 1440,
    "hasResponse": false,
    "isSubmitted": false,
    "createdAt": "2026-01-28T10:00:00Z",
    "updatedAt": "2026-01-28T10:00:00Z",
    "questions": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "question": "How did you hear about us?",
        "description": "Choose the main source",
        "type": "single_choice",
        "required": true,
        "orderIndex": 0,
        "options": [
          {
            "id": "aaaaaaa1-1111-1111-1111-111111111111",
            "label": "Friend or family",
            "value": null,
            "orderIndex": 0
          },
          {
            "id": "aaaaaaa2-1111-1111-1111-111111111111",
            "label": "Social media",
            "value": null,
            "orderIndex": 1
          }
        ]
      }
      // ... other questions ...
    ]
  }
}
```

**Error responses**:

- **401 Unauthorized** – missing or invalid token.
- **403 Forbidden** – user is not admin.
- **422 Validation Error** – invalid body (e.g. missing `questions` or invalid type).

---

### 1.3 GET `/api/v1/questionnaires/{id}`

Get questionnaire details (admin).

- **Access**: Admin only

**Headers**:

```text
Authorization: Bearer <admin_access_token>
```

**Path parameters**:

- `id` (string, UUID): Questionnaire ID.

**Example request**:

```text
GET /api/v1/questionnaires/c1f1b0a2-1234-4b8d-9e0d-111111111111
```

**Success response** (200): same shape as the `data` section in the create response above, including `questions`.

**Error responses**:

- **404 Not Found** – questionnaire does not exist.
- **401 / 403** – auth / permission errors.

---

### 1.4 PATCH `/api/v1/questionnaires/{id}`

Update questionnaire metadata (status, dates, edit window, title, description).

- **Access**: Admin only

**Headers**:

```text
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Path parameters**:

- `id` (string, UUID): Questionnaire ID.

**Request body** (all fields optional):

```json
{
  "title": "Updated onboarding questionnaire",
  "description": "Updated description",
  "status": "published",
  "startDate": "2026-01-29",
  "endDate": "2026-02-20",
  "editWindowMinutes": 120
}
```

Notes:

- `status` allowed values: `"draft"`, `"published"`, `"closed"`.
- Changing `status` to `"published"` + valid date range will make it visible to members.

**Success response** (200): same shape as GET by id.

**Error responses**:

- **404 Not Found** – questionnaire not found.

---

### 1.5 DELETE `/api/v1/questionnaires/{id}`

Delete a questionnaire and all its responses.

- **Access**: Admin only

**Headers**:

```text
Authorization: Bearer <admin_access_token>
```

**Path parameters**:

- `id` (string, UUID): Questionnaire ID.

**Example request**:

```text
DELETE /api/v1/questionnaires/c1f1b0a2-1234-4b8d-9e0d-111111111111
```

**Success response** (200):

```json
{
  "success": true,
  "message": "Questionnaire supprimé avec succès"
}
```

**Error responses**:

- **404 Not Found** – questionnaire not found.

---

### 1.6 GET `/api/v1/questionnaires/{id}/responses`

List responses for a questionnaire (one per user).

- **Access**: Admin only

**Headers**:

```text
Authorization: Bearer <admin_access_token>
```

**Query parameters**:

- `page`, `limit`: same pagination as above.

**Example response** (200):

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "r1-1111-1111-1111-111111111111",
        "questionnaireId": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
        "userId": "u1-1111-1111-1111-111111111111",
        "status": "submitted",
        "createdAt": "2026-01-28T10:15:00Z",
        "submittedAt": "2026-01-28T10:17:00Z",
        "editUntil": "2026-01-29T10:17:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Note:

- This endpoint returns **summary-level responses**, not the full answers. Use member/history or a separate admin detail view built on top of user id + questionnaire id to see answers.

---

## 2. Member endpoints

All member endpoints require a logged-in user (member or guest).

### 2.1 GET `/api/v1/questionnaires/me/unanswered`

Get **active** questionnaires which the current user has **not yet submitted**.

- **Access**: Member or guest (any authenticated user)

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Query parameters**:

- `page`, `limit`: standard pagination.

**Example request**:

```text
GET /api/v1/questionnaires/me/unanswered?page=1&limit=10
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
        "title": "Onboarding questionnaire",
        "description": "Collect some basic information about new members",
        "status": "published",
        "startDate": "2026-01-28",
        "endDate": "2026-02-15",
        "editWindowMinutes": 1440,
        "hasResponse": false,
        "isSubmitted": false,
        "createdAt": "2026-01-28T10:00:00Z",
        "updatedAt": "2026-01-28T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Notes:

- Active = `status = "published"` and within `[startDate, endDate]` if those are set.
- If user has a **draft** (`in_progress`) response, `hasResponse = true`, `isSubmitted = false`, but it still appears in this list (so they can finish it).

---

### 2.2 GET `/api/v1/questionnaires/{id}/me`

Get questionnaire details plus **current user's response** (if any).

- **Access**: Member or guest

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Path parameters**:

- `id` (string, UUID): Questionnaire ID.

**Example request**:

```text
GET /api/v1/questionnaires/c1f1b0a2-1234-4b8d-9e0d-111111111111/me
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "id": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
    "title": "Onboarding questionnaire",
    "description": "Collect some basic information about new members",
    "status": "published",
    "startDate": "2026-01-28",
    "endDate": "2026-02-15",
    "editWindowMinutes": 1440,
    "hasResponse": true,
    "isSubmitted": true,
    "createdAt": "2026-01-28T10:00:00Z",
    "updatedAt": "2026-01-28T10:00:00Z",
    "questions": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "question": "How did you hear about us?",
        "description": "Choose the main source",
        "type": "single_choice",
        "required": true,
        "orderIndex": 0,
        "options": [
          {
            "id": "aaaaaaa1-1111-1111-1111-111111111111",
            "label": "Friend or family",
            "value": null,
            "orderIndex": 0
          }
        ]
      }
      // ...
    ],
    "response": {
      "id": "r1-1111-1111-1111-111111111111",
      "questionnaireId": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
      "userId": "u1-1111-1111-1111-111111111111",
      "status": "submitted",
      "createdAt": "2026-01-28T10:15:00Z",
      "submittedAt": "2026-01-28T10:17:00Z",
      "editUntil": "2026-01-29T10:17:00Z",
      "answers": [
        {
          "questionId": "11111111-1111-1111-1111-111111111111",
          "type": "single_choice",
          "answer": {
            "option_id": "aaaaaaa1-1111-1111-1111-111111111111"
          }
        },
        {
          "questionId": "22222222-2222-2222-2222-222222222222",
          "type": "text",
          "answer": {
            "text": "I'm interested in debates and philosophy."
          }
        }
      ]
    }
  }
}
```

If the user has **no response yet**, `response` will be `null`.

---

### 2.3 POST `/api/v1/questionnaires/{id}/me/answers`

Create or update the current user’s answers for a questionnaire.

- **Access**: Member or guest

Rules:

- The questionnaire must be **active** (`status = "published"` and within date window).
- If the user has never answered:
  - A `QuestionnaireResponse` is created with status `in_progress` or `submitted` depending on `submit`.
- If they have already answered:
  - They can edit if:
    - Questionnaire is still active, and
    - Either response is still `in_progress`, or
    - Response is `submitted` but `now <= editUntil`.

**Headers**:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path parameters**:

- `id` (string, UUID): Questionnaire ID.

**Request body**:

```json
{
  "answers": [
    {
      "questionId": "11111111-1111-1111-1111-111111111111",
      "type": "single_choice",
      "answer": {
        "optionId": "aaaaaaa1-1111-1111-1111-111111111111"
      }
    },
    {
      "questionId": "22222222-2222-2222-2222-222222222222",
      "type": "multiple_choice",
      "answer": {
        "optionIds": [
          "bbbbbbb1-2222-2222-2222-222222222222",
          "bbbbbbb2-2222-2222-2222-222222222222"
        ]
      }
    },
    {
      "questionId": "33333333-3333-3333-3333-333333333333",
      "type": "text",
      "answer": {
        "text": "I'm mainly available in the evenings."
      }
    },
    {
      "questionId": "44444444-4444-4444-4444-444444444444",
      "type": "rating",
      "answer": {
        "rating": 4
      }
    },
    {
      "questionId": "55555555-5555-5555-5555-555555555555",
      "type": "number",
      "answer": {
        "number": 3
      }
    },
    {
      "questionId": "66666666-6666-6666-6666-666666666666",
      "type": "date",
      "answer": {
        "date": "2026-02-01"
      }
    }
  ],
  "submit": true
}
```

Notes:

- `type` in each answer **must match** the question’s type.
- For choice questions, all `optionId(s)` must exist on that question or the whole request is rejected.
- `submit`:
  - `true`: mark response as `submitted`, set `submittedAt` and `editUntil` (if not already set).
  - `false`: keep as `in_progress` draft.

**Success response** (200):

```json
{
  "success": true,
  "message": "Réponses enregistrées avec succès",
  "data": {
    "id": "r1-1111-1111-1111-111111111111",
    "questionnaireId": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
    "userId": "u1-1111-1111-1111-111111111111",
    "status": "submitted",
    "createdAt": "2026-01-28T10:15:00Z",
    "submittedAt": "2026-01-28T10:17:00Z",
    "editUntil": "2026-01-29T10:17:00Z",
    "answers": [
      {
        "questionId": "11111111-1111-1111-1111-111111111111",
        "type": "single_choice",
        "answer": {
          "option_id": "aaaaaaa1-1111-1111-1111-111111111111"
        }
      }
      // ...
    ]
  }
}
```

**Error responses**:

- **400 Bad Request**:
  - Questionnaire not active.
  - Question not found.
  - Type mismatch.
  - Option IDs invalid.
  - Edit window expired.
- **404 Not Found** – questionnaire not found.

---

### 2.4 GET `/api/v1/questionnaires/me/history`

Get a **history** of questionnaires where the current user has **any response** (draft or submitted), including their answers.

- **Access**: Member or guest

**Headers**:

```text
Authorization: Bearer <access_token>
```

**Query parameters**:

- `page`, `limit`: standard pagination.

**Example request**:

```text
GET /api/v1/questionnaires/me/history?page=1&limit=10
```

**Success response** (200):

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "r1-1111-1111-1111-111111111111",
        "questionnaireId": "c1f1b0a2-1234-4b8d-9e0d-111111111111",
        "userId": "u1-1111-1111-1111-111111111111",
        "status": "submitted",
        "createdAt": "2026-01-28T10:15:00Z",
        "submittedAt": "2026-01-28T10:17:00Z",
        "editUntil": "2026-01-29T10:17:00Z",
        "answers": [
          {
            "questionId": "11111111-1111-1111-1111-111111111111",
            "type": "single_choice",
            "answer": {
              "option_id": "aaaaaaa1-1111-1111-1111-111111111111"
            }
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

Notes:

- Responses are ordered by `createdAt` (most recent first).
- You can combine this with separate calls to `GET /api/v1/questionnaires/{id}/me` if you need question metadata.

---

## 3. Data model summary

### 3.1 Questionnaire fields

| Field              | Type              | Required | Description                                                    |
|--------------------|-------------------|----------|----------------------------------------------------------------|
| `id`               | string (UUID)     | auto     | Unique questionnaire ID                                        |
| `title`            | string            | yes      | Questionnaire title                                            |
| `description`      | string \| null    | no       | Description shown to members                                   |
| `status`           | string            | auto     | `"draft"`, `"published"`, `"closed"`                           |
| `startDate`        | string (date)     | no       | When it becomes active when published                          |
| `endDate`          | string (date)     | no       | When it stops accepting answers                                |
| `editWindowMinutes`| integer \| null   | no       | Edit window length after submission (per user)                 |
| `createdAt`        | string (datetime) | auto     | Creation timestamp                                             |
| `updatedAt`        | string (datetime) | auto     | Last update timestamp                                          |
| `hasResponse`      | boolean           | auto     | Whether current user has a response (in some responses)        |
| `isSubmitted`      | boolean           | auto     | Whether current user’s response is submitted                   |

### 3.2 Question fields

| Field         | Type              | Required | Description                                  |
|---------------|-------------------|----------|----------------------------------------------|
| `id`         | string (UUID)     | auto     | Question ID                                  |
| `question`   | string            | yes      | Text of the question                         |
| `description`| string \| null    | no       | Helper text                                  |
| `type`       | string            | yes      | `"single_choice"`, `"multiple_choice"`, `"text"`, `"rating"`, `"number"`, `"date"` |
| `required`   | boolean           | no       | Whether the question is required (UX level)  |
| `orderIndex` | integer           | no       | Display order                                |
| `options`    | array \| null     | depends  | For choice types, list of possible options   |

### 3.3 Option fields

| Field        | Type              | Required | Description                     |
|--------------|-------------------|----------|---------------------------------|
| `id`        | string (UUID)     | auto     | Option ID                       |
| `label`     | string            | yes      | Text shown to user              |
| `value`     | string \| null    | no       | Internal code                   |
| `orderIndex`| integer           | no       | Option display order            |

### 3.4 Response fields

| Field           | Type              | Description                                              |
|-----------------|-------------------|----------------------------------------------------------|
| `id`           | string (UUID)     | Response ID                                             |
| `questionnaireId`| string (UUID)   | Questionnaire ID                                        |
| `userId`       | string (UUID)     | User ID                                                 |
| `status`       | string            | `"in_progress"` or `"submitted"`                        |
| `createdAt`    | string (datetime) | When the response object was first created              |
| `submittedAt`  | string (datetime) | When user submitted (first submit)                      |
| `editUntil`    | string (datetime) | Last time user can edit answers after submission        |
| `answers`      | array             | One item per question answered                          |

### 3.5 Answer payload format

For each `answers[]` entry, payload shape depends on `type`:

- **single_choice**:

  ```json
  {
    "questionId": "...",
    "type": "single_choice",
    "answer": {
      "optionId": "<option-uuid>"
    }
  }
  ```

- **multiple_choice**:

  ```json
  {
    "questionId": "...",
    "type": "multiple_choice",
    "answer": {
      "optionIds": ["<uuid1>", "<uuid2>"]
    }
  }
  ```

- **text**:

  ```json
  {
    "questionId": "...",
    "type": "text",
    "answer": {
      "text": "Free text answer"
    }
  }
  ```

- **rating**:

  ```json
  {
    "questionId": "...",
    "type": "rating",
    "answer": {
      "rating": 4
    }
  }
  ```

- **number**:

  ```json
  {
    "questionId": "...",
    "type": "number",
    "answer": {
      "number": 3
    }
  }
  ```

- **date**:

  ```json
  {
    "questionId": "...",
    "type": "date",
    "answer": {
      "date": "2026-02-01"
    }
  }
  ```

---

This document should give you everything needed to integrate questionnaires on the frontend: creation by admins, listing unanswered questionnaires, answering/editing within the allowed window, and browsing per-member history. 



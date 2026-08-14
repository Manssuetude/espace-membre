# Activity Templates API Documentation

Base URL: `/api/v1/activity-templates`

All endpoints require authentication via Bearer token in the Authorization header.

---

## 1. GET /api/v1/activity-templates

Get all activity templates with filtering and pagination.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `search` (optional, string): Search term to filter by title or description
- `page` (optional, integer, default: 1, minimum: 1): Page number
- `limit` (optional, integer, default: 10, minimum: 1, maximum: 100): Items per page

**Example Request**:
```
GET /api/v1/activity-templates?search=discussion&page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Brainstorming Session",
        "description": "A collaborative session for generating creative ideas and solutions",
        "color": "#4CAF50",
        "icon": "lightbulb",
        "rules": [
          "No criticism during the brainstorming phase",
          "Encourage wild ideas",
          "Build on others' ideas",
          "Focus on quantity over quality initially"
        ],
        "duration": "30min",
        "examples": [
          "Product feature brainstorming",
          "Problem-solving session",
          "Creative ideation workshop"
        ],
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "title": "Group Discussion",
        "description": "An open forum for exchanging ideas and perspectives",
        "color": "#2196F3",
        "icon": "users",
        "rules": [
          "Respect speaking time",
          "Listen actively",
          "One person speaks at a time"
        ],
        "duration": "45min",
        "examples": [
          "Book club discussion",
          "Case study analysis",
          "Topic debate"
        ],
        "createdAt": "2024-01-16T14:30:00Z",
        "updatedAt": "2024-01-16T14:30:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Empty Result Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [],
    "total": 0,
    "page": 1,
    "limit": 10,
    "totalPages": 0
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid token
```json
{
  "detail": "Not authenticated"
}
```

---

## 2. GET /api/v1/activity-templates/{template_id}

Get a specific activity template by ID.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `template_id` (string, UUID): The ID of the activity template

**Example Request**:
```
GET /api/v1/activity-templates/550e8400-e29b-41d4-a716-446655440000
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Brainstorming Session",
    "description": "A collaborative session for generating creative ideas and solutions",
    "color": "#4CAF50",
    "icon": "lightbulb",
    "rules": [
      "No criticism during the brainstorming phase",
      "Encourage wild ideas",
      "Build on others' ideas",
      "Focus on quantity over quality initially"
    ],
    "duration": "30min",
    "examples": [
      "Product feature brainstorming",
      "Problem-solving session",
      "Creative ideation workshop"
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses**:
- **404 Not Found**: Template not found
```json
{
  "detail": "Activity template not found"
}
```

- **401 Unauthorized**: Missing or invalid token
```json
{
  "detail": "Not authenticated"
}
```

---

## 3. POST /api/v1/activity-templates

Create a new activity template.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Brainstorming Session",
  "description": "A collaborative session for generating creative ideas and solutions",
  "color": "#4CAF50",
  "icon": "lightbulb",
  "rules": [
    "No criticism during the brainstorming phase",
    "Encourage wild ideas",
    "Build on others' ideas",
    "Focus on quantity over quality initially"
  ],
  "duration": "30min",
  "examples": [
    "Product feature brainstorming",
    "Problem-solving session",
    "Creative ideation workshop"
  ]
}
```

**Field Descriptions**:
- `title` (required, string): The title of the activity template (max 255 characters)
- `description` (optional, string): A detailed description of the activity template
- `color` (optional, string): Color identifier (e.g., "#4CAF50", "blue", "primary", "green")
- `icon` (optional, string): Icon identifier (e.g., "lightbulb", "users", "presentation", "discussion")
- `rules` (optional, array of strings): List of rules/guidelines for the activity
- `duration` (optional, string): Duration of the activity (e.g., "30min", "1h", "2h30min", "45min")
- `examples` (optional, array of strings): List of example use cases for the activity

**Minimal Request Example** (only required field):
```json
{
  "title": "Quick Discussion"
}
```

**Full Request Example**:
```json
{
  "title": "Presentation & Q&A",
  "description": "A structured presentation followed by a question and answer session",
  "color": "#FF9800",
  "icon": "presentation",
  "rules": [
    "Presenter has 20 minutes",
    "5 minutes for questions",
    "Questions should be relevant to the topic",
    "Respect the time limit"
  ],
  "duration": "25min",
  "examples": [
    "Project presentation",
    "Research findings",
    "Product demo",
    "Training session"
  ]
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Modèle d'activité créé avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Brainstorming Session",
    "description": "A collaborative session for generating creative ideas and solutions",
    "color": "#4CAF50",
    "icon": "lightbulb",
    "rules": [
      "No criticism during the brainstorming phase",
      "Encourage wild ideas",
      "Build on others' ideas",
      "Focus on quantity over quality initially"
    ],
    "duration": "30min",
    "examples": [
      "Product feature brainstorming",
      "Problem-solving session",
      "Creative ideation workshop"
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Error Responses**:
- **401 Unauthorized**: Missing or invalid token
```json
{
  "detail": "Not authenticated"
}
```

- **403 Forbidden**: User is not an admin
```json
{
  "detail": "Admin access required"
}
```

- **422 Unvalidation Error**: Invalid request body
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

---

## 4. PATCH /api/v1/activity-templates/{template_id}

Update an existing activity template. All fields are optional - only provided fields will be updated.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Path Parameters**:
- `template_id` (string, UUID): The ID of the activity template to update

**Request Body** (all fields optional):
```json
{
  "title": "Updated Brainstorming Session",
  "description": "An enhanced collaborative session for generating creative ideas and solutions",
  "color": "#5CBF60",
  "icon": "brain",
  "rules": [
    "No criticism during the brainstorming phase",
    "Encourage wild ideas",
    "Build on others' ideas",
    "Focus on quantity over quality initially",
    "Take breaks every 15 minutes"
  ],
  "duration": "45min",
  "examples": [
    "Product feature brainstorming",
    "Problem-solving session",
    "Creative ideation workshop",
    "Marketing campaign ideas"
  ]
}
```

**Partial Update Example** (only update specific fields):
```json
{
  "duration": "1h",
  "color": "#2196F3"
}
```

**Update Only Rules Example**:
```json
{
  "rules": [
    "New rule 1",
    "New rule 2"
  ]
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Modèle d'activité mis à jour avec succès",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Brainstorming Session",
    "description": "An enhanced collaborative session for generating creative ideas and solutions",
    "color": "#5CBF60",
    "icon": "brain",
    "rules": [
      "No criticism during the brainstorming phase",
      "Encourage wild ideas",
      "Build on others' ideas",
      "Focus on quantity over quality initially",
      "Take breaks every 15 minutes"
    ],
    "duration": "45min",
    "examples": [
      "Product feature brainstorming",
      "Problem-solving session",
      "Creative ideation workshop",
      "Marketing campaign ideas"
    ],
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-16T15:30:00Z"
  }
}
```

**Error Responses**:
- **404 Not Found**: Template not found
```json
{
  "detail": "Activity template not found"
}
```

- **401 Unauthorized**: Missing or invalid token
```json
{
  "detail": "Not authenticated"
}
```

- **403 Forbidden**: User is not an admin
```json
{
  "detail": "Admin access required"
}
```

---

## 5. DELETE /api/v1/activity-templates/{template_id}

Delete an activity template.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `template_id` (string, UUID): The ID of the activity template to delete

**Example Request**:
```
DELETE /api/v1/activity-templates/550e8400-e29b-41d4-a716-446655440000
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Modèle d'activité supprimé avec succès"
}
```

**Error Responses**:
- **404 Not Found**: Template not found
```json
{
  "detail": "Activity template not found"
}
```

- **401 Unauthorized**: Missing or invalid token
```json
{
  "detail": "Not authenticated"
}
```

- **403 Forbidden**: User is not an admin
```json
{
  "detail": "Admin access required"
}
```

---

## Data Types and Constraints

### Activity Template Fields

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string (UUID) | Auto-generated | Unique identifier | `"550e8400-e29b-41d4-a716-446655440000"` |
| `title` | string | Yes (create) | Activity template title | `"Brainstorming Session"` |
| `description` | string | No | Detailed description of the activity template | `"A collaborative session for generating creative ideas"` |
| `color` | string | No | Color identifier | `"#4CAF50"`, `"blue"`, `"primary"` |
| `icon` | string | No | Icon identifier | `"lightbulb"`, `"users"`, `"presentation"` |
| `rules` | array of strings | No | List of activity rules | `["Rule 1", "Rule 2"]` |
| `duration` | string | No | Activity duration | `"30min"`, `"1h"`, `"2h30min"` |
| `examples` | array of strings | No | Example use cases | `["Example 1", "Example 2"]` |
| `createdAt` | string (ISO 8601) | Auto-generated | Creation timestamp | `"2024-01-15T10:00:00Z"` |
| `updatedAt` | string (ISO 8601) | Auto-generated | Last update timestamp | `"2024-01-15T10:00:00Z"` |

### Notes

- **Arrays**: `rules` and `examples` are stored as JSON arrays. Empty arrays `[]` are valid.
- **Null vs Empty**: If a field is not provided in a PATCH request, it remains unchanged. To clear a field, you can set it to `null` (for optional fields) or an empty array `[]` (for array fields).
- **Duration Format**: The `duration` field accepts free-form text. Common formats include: `"30min"`, `"1h"`, `"2h30min"`, `"45 minutes"`, etc.
- **Color Format**: The `color` field accepts any string format (hex codes, color names, CSS classes, etc.).
- **Icon Format**: The `icon` field accepts any string identifier that can be used by the frontend to display the appropriate icon.

---

## Example Use Cases

### Creating a Discussion Template
```json
POST /api/v1/activity-templates
{
  "title": "Round Table Discussion",
  "description": "An inclusive discussion format where all participants have equal voice",
  "color": "#2196F3",
  "icon": "users",
  "rules": [
    "Equal speaking time for all participants",
    "Respect different viewpoints",
    "Stay on topic"
  ],
  "duration": "1h",
  "examples": [
    "Book club discussion",
    "Philosophy debate",
    "Case study analysis"
  ]
}
```

### Creating a Workshop Template
```json
POST /api/v1/activity-templates
{
  "title": "Hands-on Workshop",
  "description": "A practical, interactive learning experience with hands-on activities",
  "color": "#9C27B0",
  "icon": "tools",
  "rules": [
    "Bring necessary materials",
    "Follow step-by-step instructions",
    "Ask questions when needed"
  ],
  "duration": "2h",
  "examples": [
    "Coding workshop",
    "Art workshop",
    "Cooking class"
  ]
}
```

### Updating Only Duration
```json
PATCH /api/v1/activity-templates/{id}
{
  "duration": "1h30min"
}
```

### Clearing Examples
```json
PATCH /api/v1/activity-templates/{id}
{
  "examples": []
}
```


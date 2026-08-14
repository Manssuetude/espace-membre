# Backend Development Guide - FastAPI

## Table of Contents
1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Development Workflow](#development-workflow)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Considerations](#deployment-considerations)

---

## Project Setup

### 1. Initialize Project

```bash
# Create project directory
mkdir manssu_backend
cd manssu_backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install FastAPI and dependencies
pip install fastapi uvicorn[standard]
pip install sqlalchemy alembic
pip install pydantic[email]
pip install python-jose[cryptography] passlib[bcrypt]
pip install python-multipart
pip install psycopg2-binary  # PostgreSQL driver
pip install python-dotenv
pip install email-validator
```

### 2. Project Structure

```
manssu_backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection
│   ├── dependencies.py         # Shared dependencies
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── theme.py
│   │   ├── resource.py
│   │   ├── poll.py
│   │   ├── feedback.py
│   │   ├── work_group.py
│   │   └── location.py
│   │
│   ├── schemas/                # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── theme.py
│   │   ├── resource.py
│   │   ├── poll.py
│   │   ├── feedback.py
│   │   ├── location.py
│   │   └── common.py           # Pagination, API response
│   │
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── deps.py             # Route dependencies
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── sessions.py
│   │   │   ├── themes.py
│   │   │   ├── resources.py
│   │   │   ├── polls.py
│   │   │   ├── feedbacks.py
│   │   │   ├── locations.py
│   │   │   └── dashboard.py
│   │
│   ├── core/                   # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py         # Password hashing, JWT
│   │   ├── config.py           # Settings
│   │   └── exceptions.py       # Custom exceptions
│   │
│   └── services/               # Business logic
│       ├── __init__.py
│       ├── auth_service.py
│       ├── user_service.py
│       ├── session_service.py
│       ├── theme_service.py
│       ├── resource_service.py
│       ├── poll_service.py
│       ├── feedback_service.py
│       └── location_service.py
│
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
│
├── tests/                      # Test files
│   ├── __init__.py
│   ├── conftest.py
│   └── test_*.py
│
├── .env                        # Environment variables
├── .env.example
├── requirements.txt
├── alembic.ini
└── README.md
```

### 3. Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/manssu_db

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OTP
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# Email (for OTP sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@manssu.com

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads

# Google Places API (optional - for server-side validation/geocoding)
# Note: Frontend uses REACT_GOOGLE_PLACES_API_KEY or VITE_REACT_GOOGLE_PLACES_API_KEY
GOOGLE_PLACES_API_KEY=your-google-places-api-key
```

---

## Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),  -- NULL for OTP-only auth
    role VARCHAR(20) NOT NULL DEFAULT 'member',  -- member, admin, super_admin
    status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, suspended
    phone VARCHAR(20),
    address TEXT,
    avatar_url VARCHAR(500),
    member_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
```

#### 2. OTP Table
```sql
CREATE TABLE otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_otps_code ON otps(code);
```

#### 3. Theme Proposal Windows Table
```sql
CREATE TABLE theme_proposal_windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_windows_active ON theme_proposal_windows(is_active);
CREATE INDEX idx_windows_dates ON theme_proposal_windows(start_date, end_date);
```

#### 4. Themes Table
```sql
CREATE TABLE themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, current
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    window_id UUID REFERENCES theme_proposal_windows(id),  -- Which window this was submitted during
    session_count INTEGER DEFAULT 0,
    next_session_date DATE,
    last_session_date DATE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_themes_status ON themes(status);
CREATE INDEX idx_themes_submitted_by ON themes(submitted_by);
CREATE INDEX idx_themes_window ON themes(window_id);
```

#### 5. Locations Table
```sql
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    instructions TEXT,
    google_place_id VARCHAR(255),  -- Google Places API place_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_address ON locations(address);
CREATE INDEX idx_locations_google_place_id ON locations(google_place_id);
```

#### 6. Sessions Table
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    theme VARCHAR(255),  -- Optional, can be from themes table or custom
    type VARCHAR(50) NOT NULL,  -- workshop, conference, group, individual
    date DATE,
    start_time TIME,
    end_time TIME,
    duration VARCHAR(20),  -- e.g., "2h"
    location_id UUID REFERENCES locations(id) ON DELETE SET NULL,  -- Reference to locations table
    location_address TEXT,  -- Legacy: can store custom address if not using location_id
    location_instructions TEXT,  -- Legacy: can store custom instructions if not using location_id
    is_online BOOLEAN DEFAULT FALSE,
    max_participants INTEGER NOT NULL,
    registered INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming',  -- upcoming, ongoing, completed, cancelled
    attendance_rate DECIMAL(5,2),  -- Percentage
    average_grade DECIMAL(3,2),  -- Out of 5
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_type ON sessions(type);
CREATE INDEX idx_sessions_location ON sessions(location_id);
```

#### 7. Session Objectives Table
```sql
CREATE TABLE session_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_objectives_session ON session_objectives(session_id);
```

#### 8. Session Registrations Table
```sql
CREATE TABLE session_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN DEFAULT FALSE,
    rating INTEGER,  -- 1-5
    comment TEXT,
    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_registrations_session ON session_registrations(session_id);
CREATE INDEX idx_registrations_user ON session_registrations(user_id);
```

#### 9. Work Groups Table
```sql
CREATE TABLE work_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    letter VARCHAR(1) NOT NULL,
    color VARCHAR(20) NOT NULL,  -- primary, accent, secondary, success
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_groups_session ON work_groups(session_id);
```

#### 10. Work Group Members Table
```sql
CREATE TABLE work_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_leader BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_group_id, user_id)
);

CREATE INDEX idx_group_members_group ON work_group_members(work_group_id);
CREATE INDEX idx_group_members_user ON work_group_members(user_id);
```

#### 11. Resources Table
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,  -- file, video, audio, folder
    link VARCHAR(500) NOT NULL,
    folder_description TEXT,
    category VARCHAR(100),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    file_path VARCHAR(500),  -- For uploaded files
    file_size INTEGER,  -- In bytes
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_session ON resources(session_id);
CREATE INDEX idx_resources_type ON resources(type);
```

#### 12. Polls Table
```sql
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, active, completed
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    total_responses INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    participation DECIMAL(5,2),  -- Percentage
    results_visibility VARCHAR(20) DEFAULT 'realtime',  -- realtime, hidden
    anonymous BOOLEAN DEFAULT FALSE,
    single_response BOOLEAN DEFAULT TRUE,
    start_date DATE NOT NULL,
    end_date DATE,
    days_left INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_session ON polls(session_id);
```

#### 13. Poll Options Table
```sql
CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    votes INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    color VARCHAR(20),  -- primary, accent, secondary, success
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
```

#### 14. Poll Votes Table
```sql
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)  -- Single response per user
);

CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);
```

#### 15. Feedbacks Table
```sql
CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,  -- Session, Général, etc.
    type VARCHAR(50) NOT NULL,  -- Suggestion, Compliment, etc.
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    anonymous BOOLEAN DEFAULT FALSE,
    submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'new',  -- new, read, resolved
    rating INTEGER,  -- 1-5 (for session feedbacks)
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedbacks_status ON feedbacks(status);
CREATE INDEX idx_feedbacks_category ON feedbacks(category);
CREATE INDEX idx_feedbacks_session ON feedbacks(session_id);
CREATE INDEX idx_feedbacks_submitted_by ON feedbacks(submitted_by);
```

---

## API Endpoints

### Base URL Structure
```
/api/v1/
```

### Response Format
All responses should follow this structure:
```json
{
  "data": {...},
  "success": true,
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Error detail"]
  }
}
```

### Pagination Format
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

## Authentication & Authorization

### 1. Send OTP
**POST** `/api/v1/auth/send-otp`

Request:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "data": {
    "message": "OTP envoyé avec succès",
    "expiresIn": 600
  },
  "success": true
}
```

### 2. Verify OTP
**POST** `/api/v1/auth/verify-otp`

Request:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:
```json
{
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "avatar": "avatar-url"
    }
  },
  "success": true
}
```

### 3. Logout
**POST** `/api/v1/auth/logout`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "data": {
    "message": "Déconnexion réussie"
  },
  "success": true
}
```

### 4. Get Current User
**GET** `/api/v1/auth/me`

Headers: `Authorization: Bearer <token>`

---

## API Endpoints by Resource

### Users/Members

#### Get All Members
**GET** `/api/v1/users?status=all&search=&page=1&limit=10`

Query Parameters:
- `status`: all, active, suspended
- `search`: Search in name/email
- `page`: Page number
- `limit`: Items per page

#### Get Member by ID
**GET** `/api/v1/users/{user_id}`

#### Create Member
**POST** `/api/v1/users`

Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "member"
}
```

#### Update Member
**PATCH** `/api/v1/users/{user_id}`

#### Suspend Member
**POST** `/api/v1/users/{user_id}/suspend`

#### Delete Member
**DELETE** `/api/v1/users/{user_id}`

---

### Sessions

#### Get All Sessions
**GET** `/api/v1/sessions?status=all&theme=&search=&page=1&limit=10`

Query Parameters:
- `status`: all, upcoming, ongoing, completed, cancelled
- `theme`: Filter by theme
- `search`: Search in title/theme
- `page`, `limit`: Pagination

#### Get Session by ID
**GET** `/api/v1/sessions/{session_id}`

Includes: work_groups, polls, resources

#### Create Session
**POST** `/api/v1/sessions`

Request:
```json
{
  "title": "Session Title",
  "theme": "Gestion du stress",
  "type": "workshop",
  "date": "2024-12-15",
  "startTime": "14:00",
  "endTime": "16:00",
    "location": {
      "address": "Address here",
      "instructions": "Instructions here"
    },
    // OR use location_id to reference existing location:
    // "locationId": "uuid-of-existing-location",
  "isOnline": false,
  "maxParticipants": 30,
  "objectives": ["Objective 1", "Objective 2"]
}
```

#### Update Session
**PATCH** `/api/v1/sessions/{session_id}`

Request (all fields optional):
```json
{
  "theme": "New theme",
  "date": "2024-12-20",
  "startTime": "10:00",
  "endTime": "12:00",
  "location": {
    "address": "New address",
    "instructions": "New instructions"
  },
  "status": "upcoming"
}
```

#### Delete Session
**DELETE** `/api/v1/sessions/{session_id}`

#### Register for Session
**POST** `/api/v1/sessions/{session_id}/register`

Headers: `Authorization: Bearer <token>`

#### Create Work Groups
**POST** `/api/v1/sessions/{session_id}/groups`

Request:
```json
{
  "numberOfGroups": 3,
  "isRandom": false,
  "assignments": {
    "user-id-1": 0,
    "user-id-2": 1
  }
}
```

#### Get Session Groups
**GET** `/api/v1/sessions/{session_id}/groups`

---

### Themes

#### Theme Proposition Window Management

**Get Current Window Status**
**GET** `/api/v1/themes/window/status`

Response:
```json
{
  "data": {
    "isOpen": true,
    "startDate": "2024-12-10T00:00:00Z",
    "endDate": "2024-12-25T23:59:59Z",
    "daysRemaining": 5,
    "nextOpeningDate": null  // If closed, when will it open next
  },
  "success": true
}
```

**Open Theme Proposition Window** (Admin only)
**POST** `/api/v1/themes/window/open`

Headers: `Authorization: Bearer <token>` (Admin only)

Request:
```json
{
  "duration": 14  // Duration in days
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "startDate": "2024-12-10T00:00:00Z",
    "endDate": "2024-12-24T23:59:59Z",
    "isActive": true
  },
  "success": true,
  "message": "Fenêtre de propositions ouverte avec succès"
}
```

**Extend Theme Proposition Window** (Admin only)
**PATCH** `/api/v1/themes/window/{window_id}/extend`

Headers: `Authorization: Bearer <token>` (Admin only)

Request:
```json
{
  "additionalDays": 7  // Additional days to add
}
```

**Close Theme Proposition Window** (Admin only)
**POST** `/api/v1/themes/window/{window_id}/close`

Headers: `Authorization: Bearer <token>` (Admin only)

Response:
```json
{
  "data": {
    "message": "Fenêtre fermée avec succès"
  },
  "success": true
}
```

#### Theme CRUD Operations

**Get All Themes**
**GET** `/api/v1/themes?status=all&page=1&limit=10`

Query Parameters:
- `status`: all, pending, approved, rejected, current
- `page`: Page number
- `limit`: Items per page

**Get Pending Themes** (Admin only)
**GET** `/api/v1/themes/pending`

Headers: `Authorization: Bearer <token>` (Admin only)

**Get Current Themes** (Themes used in active sessions)
**GET** `/api/v1/themes/current`

**Get Theme by ID**
**GET** `/api/v1/themes/{theme_id}`

**Create Theme** (Member - only when window is open)
**POST** `/api/v1/themes`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "title": "Theme Title",
  "description": "Theme description",
  "category": "Bien-être mental"  // Optional
}
```

**Business Logic:**
- Check if theme proposition window is currently open
- If closed, return error: `{"success": false, "message": "La fenêtre de propositions est actuellement fermée"}`
- Check if user has already submitted maximum allowed proposals (e.g., 2 per window)
- If limit reached, return error
- Create theme with `status: 'pending'`
- Link theme to current active window

Response:
```json
{
  "data": {
    "id": "uuid",
    "title": "Theme Title",
    "description": "Theme description",
    "status": "pending",
    "submittedBy": {
      "id": "user-uuid",
      "name": "John Doe",
      "avatar": "avatar-url"
    },
    "submittedAt": "2024-12-15T10:00:00Z"
  },
  "success": true,
  "message": "Thème proposé avec succès"
}
```

**Update Theme Status** (Admin only - Approve/Reject)
**PATCH** `/api/v1/themes/{theme_id}`

Headers: `Authorization: Bearer <token>` (Admin only)

Request:
```json
{
  "status": "approved",  // or "rejected"
  "reviewNotes": "Optional review notes"
}
```

**Business Logic:**
- Only admins can update theme status
- When status changes to `approved`:
  - Set `reviewedAt` to current timestamp
  - Set `reviewedBy` to current admin user ID
  - Optionally set status to `current` if it will be used immediately
- When status changes to `rejected`:
  - Set `reviewedAt` and `reviewedBy`
  - Store `reviewNotes` if provided

Response:
```json
{
  "data": {
    "id": "uuid",
    "title": "Theme Title",
    "status": "approved",
    "reviewedAt": "2024-12-16T10:00:00Z",
    "reviewedBy": "admin-user-id"
  },
  "success": true,
  "message": "Thème approuvé avec succès"
}
```

**Delete Theme** (Admin only)
**DELETE** `/api/v1/themes/{theme_id}`

Headers: `Authorization: Bearer <token>` (Admin only)

---

### Resources

#### Get All Resources
**GET** `/api/v1/resources?sessionId=&type=&search=&page=1&limit=10`

#### Get Resource by ID
**GET** `/api/v1/resources/{resource_id}`

#### Create Resource
**POST** `/api/v1/resources`

Request (multipart/form-data for files):
```json
{
  "title": "Resource Title",
  "description": "Description",
  "type": "file",
  "link": "url-or-path",
  "sessionId": "optional-session-id",
  "addToSession": true
}
```

#### Update Resource
**PATCH** `/api/v1/resources/{resource_id}`

#### Delete Resource
**DELETE** `/api/v1/resources/{resource_id}`

---

### Polls (Sondages)

#### Get All Polls
**GET** `/api/v1/polls?status=all&page=1&limit=10`

#### Get Poll by ID
**GET** `/api/v1/polls/{poll_id}`

Includes: options, distribution, participants

#### Create Poll
**POST** `/api/v1/polls`

Request:
```json
{
  "title": "Poll Title",
  "question": "Question text",
  "description": "Optional description",
  "options": [
    {"label": "Option 1"},
    {"label": "Option 2"}
  ],
  "resultsVisibility": "realtime",
  "anonymous": true,
  "singleResponse": true,
  "endDate": "2024-12-20"
}
```

#### Update Poll
**PATCH** `/api/v1/polls/{poll_id}`

#### Vote on Poll
**POST** `/api/v1/polls/{poll_id}/vote`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "optionId": "option-uuid"
}
```

#### Delete Poll
**DELETE** `/api/v1/polls/{poll_id}`

---

### Feedbacks

#### Get All Feedbacks
**GET** `/api/v1/feedbacks?status=all&category=all&page=1&limit=10`

#### Get Feedback by ID
**GET** `/api/v1/feedbacks/{feedback_id}`

#### Create Feedback
**POST** `/api/v1/feedbacks`

Headers: `Authorization: Bearer <token>`

Request:
```json
{
  "category": "Session",
  "type": "Suggestion",
  "subject": "Subject",
  "message": "Message text",
  "anonymous": false,
  "rating": 4,
  "sessionId": "optional-session-id"
}
```

#### Update Feedback Status
**PATCH** `/api/v1/feedbacks/{feedback_id}`

Request:
```json
{
  "status": "read"
}
```

#### Delete Feedback
**DELETE** `/api/v1/feedbacks/{feedback_id}`

---

### Locations

#### Get All Locations
**GET** `/api/v1/locations?search=&page=1&limit=10`

Query Parameters:
- `search`: Search in address
- `page`: Page number
- `limit`: Items per page

#### Get Location by ID
**GET** `/api/v1/locations/{location_id}`

#### Create Location
**POST** `/api/v1/locations`

Headers: `Authorization: Bearer <token>` (Admin only)

Request:
```json
{
  "address": "26 Rue Henri IV, 75004 Paris, France",
  "instructions": "Métro ligne 1 - Arrêt \"Saint-Paul\"\nBus 69, 76 - Arrêt \"Rue de Rivoli\"",
  "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

Response:
```json
{
  "data": {
    "id": "uuid",
    "address": "26 Rue Henri IV, 75004 Paris, France",
    "instructions": "Métro ligne 1 - Arrêt \"Saint-Paul\"\nBus 69, 76 - Arrêt \"Rue de Rivoli\"",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "createdAt": "2024-12-15T10:00:00Z",
    "updatedAt": "2024-12-15T10:00:00Z"
  },
  "success": true,
  "message": "Lieu créé avec succès"
}
```

#### Update Location
**PATCH** `/api/v1/locations/{location_id}`

Headers: `Authorization: Bearer <token>` (Admin only)

Request:
```json
{
  "address": "Updated address",
  "instructions": "Updated instructions",
  "googlePlaceId": "Updated place ID"
}
```

#### Delete Location
**DELETE** `/api/v1/locations/{location_id}`

Headers: `Authorization: Bearer <token>` (Admin only)

**Note**: When deleting a location, ensure no active sessions are using it. Consider soft delete or prevent deletion if referenced.

---

### Dashboard

#### Get Admin Dashboard
**GET** `/api/v1/dashboard/admin`

Headers: `Authorization: Bearer <token>` (Admin only)

Response:
```json
{
  "data": {
    "stats": {
      "pendingThemes": 12,
      "pendingResources": 8,
      "recentFeedbacks": 23,
      "totalMembers": 247
    },
    "recentSessions": [...],
    "pendingThemes": [...],
    "activePolls": [...],
    "recentFeedbacks": [...]
  },
  "success": true
}
```

#### Get Member Dashboard
**GET** `/api/v1/dashboard/member`

Headers: `Authorization: Bearer <token>`

Response:
```json
{
  "data": {
    "upcomingSessions": [...],
    "themePropositions": [...],
    "activePolls": [...],
    "recentResources": [...],
    "themeWindowOpen": true,
    "themeWindowClosesIn": 5
  },
  "success": true
}
```

---

## Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Project setup and structure
2. ✅ Database models and migrations
3. ✅ Authentication endpoints (OTP)
4. ✅ JWT token management
5. ✅ Basic user CRUD

### Phase 2: Core Features (Week 2-3)
6. ✅ Themes API (CRUD + status management)
7. ✅ Locations API (CRUD + Google Places integration)
8. ✅ Sessions API (CRUD + registration)
9. ✅ Work Groups API
10. ✅ Resources API (with file upload)

### Phase 3: Interactive Features (Week 4)
11. ✅ Polls API (CRUD + voting)
12. ✅ Feedbacks API (CRUD + ratings)
13. ✅ Dashboard APIs (aggregated data)

### Phase 4: Polish (Week 5)
14. ✅ Advanced filtering and search
15. ✅ File upload handling
16. ✅ Email notifications
17. ✅ Performance optimization
18. ✅ Comprehensive testing

---

## Code Examples

### Example: FastAPI App Setup

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, users, sessions, themes, resources, polls, feedbacks, locations, dashboard
from app.core.config import settings

app = FastAPI(
    title="MANSSU API",
    description="Backend API for MANSSU platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["Sessions"])
app.include_router(themes.router, prefix="/api/v1/themes", tags=["Themes"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["Resources"])
app.include_router(polls.router, prefix="/api/v1/polls", tags=["Polls"])
app.include_router(feedbacks.router, prefix="/api/v1/feedbacks", tags=["Feedbacks"])
app.include_router(locations.router, prefix="/api/v1/locations", tags=["Locations"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])

@app.get("/")
async def root():
    return {"message": "MANSSU API", "version": "1.0.0"}
```

### Example: SQLAlchemy Model

```python
# app/models/session.py
from sqlalchemy import Column, String, Integer, Boolean, Date, Time, DECIMAL, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    theme = Column(String(255), nullable=True)
    type = Column(String(50), nullable=False)
    date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration = Column(String(20), nullable=True)
    location_address = Column(Text, nullable=True)
    location_instructions = Column(Text, nullable=True)
    is_online = Column(Boolean, default=False)
    max_participants = Column(Integer, nullable=False)
    registered = Column(Integer, default=0)
    status = Column(String(20), default="upcoming")
    attendance_rate = Column(DECIMAL(5, 2), nullable=True)
    average_grade = Column(DECIMAL(3, 2), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    objectives = relationship("SessionObjective", back_populates="session", cascade="all, delete-orphan")
    registrations = relationship("SessionRegistration", back_populates="session", cascade="all, delete-orphan")
    work_groups = relationship("WorkGroup", back_populates="session", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="session")
    polls = relationship("Poll", back_populates="session")
```

### Example: Pydantic Schema

```python
# app/schemas/session.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time
from app.schemas.common import Location

class SessionBase(BaseModel):
    title: str
    theme: Optional[str] = None
    type: str
    date: Optional[date] = None
    startTime: Optional[time] = None
    endTime: Optional[time] = None
    location: Optional[Location | str] = None
    isOnline: bool = False
    maxParticipants: int
    objectives: Optional[List[str]] = None

class CreateSessionRequest(SessionBase):
    pass

class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    theme: Optional[str] = None
    type: Optional[str] = None
    date: Optional[date] = None
    startTime: Optional[time] = None
    endTime: Optional[time] = None
    location: Optional[Location | str] = None
    isOnline: Optional[bool] = None
    maxParticipants: Optional[int] = None
    status: Optional[str] = None
    objectives: Optional[List[str]] = None

class SessionResponse(SessionBase):
    id: str
    registered: int
    status: str
    attendanceRate: Optional[float] = None
    averageGrade: Optional[float] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        from_attributes = True
```

### Example: API Route

```python
# app/api/v1/sessions.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.api.deps import get_db, get_current_user
from app.schemas.session import SessionResponse, CreateSessionRequest, UpdateSessionRequest
from app.schemas.common import PaginatedResponse
from app.services.session_service import SessionService

router = APIRouter()

@router.get("", response_model=PaginatedResponse[SessionResponse])
async def get_sessions(
    status: Optional[str] = Query(None),
    theme: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all sessions with filtering and pagination"""
    service = SessionService(db)
    result = service.get_sessions(
        status=status,
        theme=theme,
        search=search,
        page=page,
        limit=limit
    )
    return result

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get session by ID"""
    service = SessionService(db)
    session = service.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.post("", response_model=SessionResponse)
async def create_session(
    data: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new session (Admin only)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = SessionService(db)
    session = service.create_session(data, current_user.id)
    return session

@router.patch("/{session_id}", response_model=SessionResponse)
async def update_session(
    session_id: str,
    data: UpdateSessionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update session (Admin only)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = SessionService(db)
    session = service.update_session(session_id, data)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
```

### Example: Service Layer

```python
# app/services/session_service.py
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.models.session import Session as SessionModel
from app.schemas.session import CreateSessionRequest, UpdateSessionRequest
from app.schemas.common import PaginatedResponse

class SessionService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_sessions(
        self,
        status: Optional[str] = None,
        theme: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse:
        query = self.db.query(SessionModel)
        
        # Filters
        if status and status != "all":
            query = query.filter(SessionModel.status == status)
        
        if theme:
            query = query.filter(SessionModel.theme == theme)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    SessionModel.title.ilike(search_term),
                    SessionModel.theme.ilike(search_term)
                )
            )
        
        # Count total
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        sessions = query.offset(offset).limit(limit).all()
        
        return PaginatedResponse(
            data=[self._session_to_dict(s) for s in sessions],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
    
    def get_session_by_id(self, session_id: str) -> Optional[dict]:
        session = self.db.query(SessionModel).filter(
            SessionModel.id == session_id
        ).first()
        
        if not session:
            return None
        
        return self._session_to_dict(session, include_details=True)
    
    def create_session(self, data: CreateSessionRequest, created_by: str) -> dict:
        # Convert location to database format
        location_address = None
        location_instructions = None
        
        if data.location:
            if isinstance(data.location, str):
                location_address = data.location
            else:
                location_address = data.location.address
                location_instructions = data.location.instructions
        
        session = SessionModel(
            title=data.title,
            theme=data.theme,
            type=data.type,
            date=data.date,
            start_time=data.startTime,
            end_time=data.endTime,
            location_address=location_address,
            location_instructions=location_instructions,
            is_online=data.isOnline,
            max_participants=data.maxParticipants
        )
        
        # Add objectives
        if data.objectives:
            for idx, obj in enumerate(data.objectives):
                session.objectives.append(
                    SessionObjective(
                        objective=obj,
                        order_index=idx
                    )
                )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        
        return self._session_to_dict(session)
    
    def _session_to_dict(self, session: SessionModel, include_details: bool = False) -> dict:
        # Convert location
        location = None
        if session.location_address:
            if session.location_instructions:
                location = {
                    "address": session.location_address,
                    "instructions": session.location_instructions
                }
            else:
                location = session.location_address
        
        result = {
            "id": str(session.id),
            "title": session.title,
            "theme": session.theme,
            "type": session.type,
            "date": session.date.isoformat() if session.date else None,
            "startTime": session.start_time.strftime("%H:%M") if session.start_time else None,
            "endTime": session.end_time.strftime("%H:%M") if session.end_time else None,
            "duration": session.duration,
            "location": location,
            "isOnline": session.is_online,
            "maxParticipants": session.max_participants,
            "registered": session.registered,
            "status": session.status,
            "attendanceRate": float(session.attendance_rate) if session.attendance_rate else None,
            "averageGrade": float(session.average_grade) if session.average_grade else None,
            "objectives": [obj.objective for obj in session.objectives] if session.objectives else [],
            "createdAt": session.created_at.isoformat() if session.created_at else None,
            "updatedAt": session.updated_at.isoformat() if session.updated_at else None
        }
        
        if include_details:
            result["workGroups"] = [self._group_to_dict(g) for g in session.work_groups]
            result["polls"] = [self._poll_to_dict(p) for p in session.polls]
            result["resources"] = [self._resource_to_dict(r) for r in session.resources]
        
        return result
```

### Example: Location Model

```python
# app/models/location.py
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    google_place_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sessions = relationship("Session", back_populates="location")
```

### Example: Location Schema

```python
# app/schemas/location.py
from pydantic import BaseModel, Field
from typing import Optional

class LocationBase(BaseModel):
    address: str
    instructions: Optional[str] = None
    googlePlaceId: Optional[str] = Field(None, alias="google_place_id")

class CreateLocationRequest(LocationBase):
    pass

class UpdateLocationRequest(BaseModel):
    address: Optional[str] = None
    instructions: Optional[str] = None
    googlePlaceId: Optional[str] = Field(None, alias="google_place_id")

class LocationResponse(LocationBase):
    id: str
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True
```

### Example: Location API Route

```python
# app/api/v1/locations.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.api.deps import get_db, get_current_user
from app.schemas.location import LocationResponse, CreateLocationRequest, UpdateLocationRequest
from app.schemas.common import PaginatedResponse
from app.services.location_service import LocationService

router = APIRouter()

@router.get("", response_model=PaginatedResponse[LocationResponse])
async def get_locations(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all locations with filtering and pagination"""
    service = LocationService(db)
    result = service.get_locations(
        search=search,
        page=page,
        limit=limit
    )
    return result

@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: str,
    db: Session = Depends(get_db)
):
    """Get location by ID"""
    service = LocationService(db)
    location = service.get_location_by_id(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.post("", response_model=LocationResponse)
async def create_location(
    data: CreateLocationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new location (Admin only)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = LocationService(db)
    location = service.create_location(data)
    return location

@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    data: UpdateLocationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update location (Admin only)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = LocationService(db)
    location = service.update_location(location_id, data)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.delete("/{location_id}")
async def delete_location(
    location_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete location (Admin only)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service = LocationService(db)
    # Check if location is used by any sessions
    if service.is_location_in_use(location_id):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete location that is used by active sessions"
        )
    
    success = service.delete_location(location_id)
    if not success:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return {"success": True, "message": "Location deleted successfully"}
```

### Example: Location Service

```python
# app/services/location_service.py
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from app.models.location import Location as LocationModel
from app.schemas.location import CreateLocationRequest, UpdateLocationRequest
from app.schemas.common import PaginatedResponse

class LocationService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_locations(
        self,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10
    ) -> PaginatedResponse:
        query = self.db.query(LocationModel)
        
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                LocationModel.address.ilike(search_term)
            )
        
        total = query.count()
        offset = (page - 1) * limit
        locations = query.offset(offset).limit(limit).all()
        
        return PaginatedResponse(
            data=[self._location_to_dict(l) for l in locations],
            total=total,
            page=page,
            limit=limit,
            totalPages=(total + limit - 1) // limit
        )
    
    def get_location_by_id(self, location_id: str) -> Optional[dict]:
        location = self.db.query(LocationModel).filter(
            LocationModel.id == location_id
        ).first()
        
        if not location:
            return None
        
        return self._location_to_dict(location)
    
    def create_location(self, data: CreateLocationRequest) -> dict:
        location = LocationModel(
            address=data.address,
            instructions=data.instructions,
            google_place_id=data.googlePlaceId
        )
        
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        
        return self._location_to_dict(location)
    
    def update_location(self, location_id: str, data: UpdateLocationRequest) -> Optional[dict]:
        location = self.db.query(LocationModel).filter(
            LocationModel.id == location_id
        ).first()
        
        if not location:
            return None
        
        if data.address is not None:
            location.address = data.address
        if data.instructions is not None:
            location.instructions = data.instructions
        if data.googlePlaceId is not None:
            location.google_place_id = data.googlePlaceId
        
        self.db.commit()
        self.db.refresh(location)
        
        return self._location_to_dict(location)
    
    def delete_location(self, location_id: str) -> bool:
        location = self.db.query(LocationModel).filter(
            LocationModel.id == location_id
        ).first()
        
        if not location:
            return False
        
        self.db.delete(location)
        self.db.commit()
        return True
    
    def is_location_in_use(self, location_id: str) -> bool:
        from app.models.session import Session as SessionModel
        count = self.db.query(SessionModel).filter(
            SessionModel.location_id == location_id
        ).count()
        return count > 0
    
    def _location_to_dict(self, location: LocationModel) -> dict:
        return {
            "id": str(location.id),
            "address": location.address,
            "instructions": location.instructions,
            "googlePlaceId": location.google_place_id,
            "createdAt": location.created_at.isoformat() if location.created_at else None,
            "updatedAt": location.updated_at.isoformat() if location.updated_at else None,
        }
```

---

## Security Considerations

### 1. Authentication
- Use JWT tokens with appropriate expiration
- Implement refresh tokens
- Store OTPs securely (hashed or encrypted)
- Rate limit OTP requests

### 2. Authorization
- Role-based access control (RBAC)
- Check permissions on every protected endpoint
- Admin-only endpoints should verify admin role

### 3. Input Validation
- Validate all inputs using Pydantic
- Sanitize user inputs
- Validate file uploads (type, size)

### 4. SQL Injection Prevention
- Use SQLAlchemy ORM (parameterized queries)
- Never use raw SQL with user input

### 5. CORS
- Configure CORS properly
- Only allow trusted origins

### 6. Rate Limiting
- Implement rate limiting on auth endpoints
- Limit API requests per user/IP

---

## Testing Strategy

### Unit Tests
- Test service layer functions
- Test utility functions
- Mock database calls

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flow

### Test Structure
```python
# tests/test_sessions.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_session():
    response = client.post(
        "/api/v1/sessions",
        json={
            "title": "Test Session",
            "type": "workshop",
            "maxParticipants": 30
        },
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 201
    assert response.json()["success"] == True
```

---

## Deployment Considerations

### 1. Environment Variables
- Never commit `.env` file
- Use environment-specific configs
- Use secrets management in production

### 2. Database Migrations
- Run migrations on deployment
- Backup database before migrations
- Test migrations in staging first

### 3. File Storage
- Use cloud storage (S3, Cloud Storage) for production
- Don't store files in application directory

### 4. Logging
- Implement structured logging
- Log errors and important events
- Use log aggregation service

### 5. Monitoring
- Set up health check endpoint
- Monitor API performance
- Set up error tracking (Sentry)

### 6. API Documentation
- FastAPI auto-generates docs at `/docs`
- Keep API documentation updated
- Document all endpoints

---

## Next Steps

1. **Set up the project structure** following the guide above
2. **Create database models** using SQLAlchemy
3. **Set up Alembic** for migrations
4. **Implement authentication** endpoints first
5. **Test with frontend** by replacing mock APIs
6. **Iterate** on other endpoints based on priority

---

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

---

## Theme Proposition Workflow

### Overview
The theme proposition system allows members to propose session themes during specific time windows controlled by admins. This ensures organized collection of theme ideas for future sessions.

### Workflow Steps

#### 1. Admin Opens Theme Proposition Window
- Admin creates a new `theme_proposal_windows` record with `start_date` and `end_date`
- Only one window can be active at a time (`is_active = true`)
- When a new window is opened, previous windows are automatically set to `is_active = false`

#### 2. Member Submits Theme Proposal
- Member calls `POST /api/v1/themes` with title and description
- Backend checks:
  - Is there an active window? (`is_active = true` AND current time between `start_date` and `end_date`)
  - Has member reached proposal limit for this window? (e.g., max 2 proposals per window)
  - If checks pass, create theme with `status = 'pending'` and link to `window_id`

#### 3. Admin Reviews Proposals
- Admin views pending themes via `GET /api/v1/themes/pending`
- Admin can:
  - **Approve**: Set `status = 'approved'`, set `reviewedAt` and `reviewedBy`
  - **Reject**: Set `status = 'rejected'`, optionally add `reviewNotes`
- Approved themes can be used in polls or directly for sessions

#### 4. Admin Closes Window
- When creating a poll for theme selection, the window is automatically closed
- Admin can also manually close via `POST /api/v1/themes/window/{id}/close`
- Closing window prevents new proposals but doesn't affect pending reviews

#### 5. Window Extension
- Admin can extend active window via `PATCH /api/v1/themes/window/{id}/extend`
- Adds additional days to `end_date`

### Database Considerations

**Theme Proposal Windows:**
- Only one active window at a time
- Track which themes were submitted during which window
- Store window creator for audit trail

**Themes:**
- Link themes to windows via `window_id` for tracking
- Track submission count per user per window (query: `SELECT COUNT(*) FROM themes WHERE submitted_by = ? AND window_id = ?`)
- When window closes, themes in `pending` status remain reviewable

### API Endpoint Summary

**For Members:**
- `GET /api/v1/themes/window/status` - Check if window is open
- `POST /api/v1/themes` - Submit theme proposal (only when window open)
- `GET /api/v1/themes/current` - View current/active themes

**For Admins:**
- `POST /api/v1/themes/window/open` - Open new window
- `PATCH /api/v1/themes/window/{id}/extend` - Extend window
- `POST /api/v1/themes/window/{id}/close` - Close window
- `GET /api/v1/themes/pending` - View pending themes
- `PATCH /api/v1/themes/{id}` - Approve/reject theme
- `DELETE /api/v1/themes/{id}` - Delete theme

### Business Rules

1. **Window Management:**
   - Only one active window at a time
   - Window must have valid `start_date` and `end_date`
   - Closing window doesn't delete it, just sets `is_active = false`

2. **Member Proposals:**
   - Can only propose when window is active
   - Limit proposals per window (e.g., 2 per member per window)
   - Proposals are automatically set to `pending` status

3. **Admin Actions:**
   - Can approve/reject pending themes
   - Can create themes directly (bypasses window requirement)
   - Can manage window lifecycle (open/extend/close)

4. **Theme Status Flow:**
   - `pending` → `approved` or `rejected` (admin action)
   - `approved` → `current` (when used in active session)
   - Once `rejected`, theme cannot be changed back

---

## Notes

- All timestamps should be in UTC
- Use UUIDs for all primary keys
- Implement soft deletes where appropriate
- Add indexes for frequently queried fields
- Consider caching for dashboard and frequently accessed data
- Implement background tasks for email sending and notifications
- **Location Management**: 
  - Sessions can reference locations via `location_id` (preferred) or use legacy `location_address`/`location_instructions` fields
  - Google Places API integration allows storing `google_place_id` for future geocoding/validation
  - When deleting locations, check if they're referenced by active sessions
  - Frontend uses Google Places Autocomplete for address input (restricted to France)
- **Theme Proposition Window**:
  - Only one active window at a time
  - Members can only propose when window is open
  - Track proposal limits per member per window
  - Closing window doesn't affect pending theme reviews


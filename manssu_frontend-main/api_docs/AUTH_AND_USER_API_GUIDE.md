# Authentication & User API Guide

Complete documentation for authentication and user management endpoints in the MANSSU backend API.

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Profile Endpoints](#user-profile-endpoints)
3. [User Management Endpoints (Admin)](#user-management-endpoints-admin)
4. [Role-Based Permissions](#role-based-permissions)
5. [Request/Response Schemas](#requestresponse-schemas)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Authentication Endpoints

Base URL: `/api/v1/auth`

### 1. Send OTP

**POST** `/api/v1/auth/send-otp`

Send a one-time password (OTP) to a registered user's email address.

**Access**: Public (no authentication required)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "OTP envoyé avec succès",
    "expiresIn": 600
  },
  "message": "OTP envoyé avec succès"
}
```

**Error Responses**:

- **400 Bad Request** - Email not registered:
```json
{
  "success": false,
  "message": "Email non enregistré. Veuillez contacter un administrateur."
}
```

- **400 Bad Request** - Account suspended:
```json
{
  "success": false,
  "message": "Compte utilisateur suspendu. Veuillez contacter un administrateur."
}
```

**Business Logic**:
- Only registered emails can receive OTP
- User account must be active (not suspended)
- Invalidates any existing unused OTPs for the email
- Sends email via MailerSend
- OTP expires in 10 minutes (configurable via `OTP_EXPIRY_MINUTES`)

---

### 2. Verify OTP

**POST** `/api/v1/auth/verify-otp`

Verify the OTP code and receive JWT access token.

**Access**: Public (no authentication required)

**Request Body**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": null,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "message": "Connexion réussie"
}
```

**Error Responses**:

- **401 Unauthorized** - Invalid or expired OTP:
```json
{
  "success": false,
  "message": "Code OTP invalide ou expiré"
}
```

**Business Logic**:
- Validates OTP code and expiration
- Marks OTP as used
- Updates user's `last_login` timestamp
- Generates JWT token with user ID, email, and role
- Token expires in 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)

**JWT Token Structure**:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "member",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

### 3. Logout

**POST** `/api/v1/auth/logout`

Logout the current user.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Déconnexion réussie"
  },
  "message": "Déconnexion réussie"
}
```

**Note**: Currently returns success message. Can be extended for token blacklisting in the future.

---

### 4. Get Current User Info (Basic)

**GET** `/api/v1/auth/me`

Get basic information about the currently authenticated user.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

**Error Responses**:

- **401 Unauthorized** - Invalid or missing token:
```json
{
  "success": false,
  "message": "Invalid authentication credentials"
}
```

- **401 Unauthorized** - Account not active:
```json
{
  "success": false,
  "message": "User account is not active"
}
```

---

## User Profile Endpoints

Base URL: `/api/v1/users`

### 5. Get Current User Profile (Full)

**GET** `/api/v1/users/me`

Get complete profile information for the currently authenticated user.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33123456789",
    "address": "123 Main St, Paris",
    "avatar": "https://example.com/avatar.jpg",
    "role": "member",
    "status": "active",
    "memberSince": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-12-15T14:30:00Z"
  }
}
```

---

### 6. Update Current User Profile

**PATCH** `/api/v1/users/me`

Update the current user's own profile information.

**Access**: Authenticated users only

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body** (all fields optional):
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+33987654321",
  "address": "456 Oak Ave, Lyon",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Note**: Users cannot update `email`, `role`, or `status` through this endpoint. These require admin access.

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+33987654321",
    "address": "456 Oak Ave, Lyon",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "member",
    "status": "active",
    "memberSince": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-12-15T15:00:00Z",
    "lastLogin": "2024-12-15T14:30:00Z"
  },
  "message": "Profil mis à jour avec succès"
}
```

---

## User Management Endpoints (Admin)

Base URL: `/api/v1/users`

All endpoints in this section require **Admin or Super Admin** access.

### 7. Get All Users

**GET** `/api/v1/users?status=all&search=&page=1&limit=10`

Get a paginated list of all users with filtering options.

**Access**: Admin or Super Admin

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters**:
- `status` (optional): Filter by status - `all`, `active`, `suspended` (default: `all`)
- `search` (optional): Search term to filter by name or email
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Example Request**:
```
GET /api/v1/users?status=active&search=john&page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+33123456789",
        "address": "123 Main St",
        "avatar": "https://example.com/avatar.jpg",
        "role": "member",
        "status": "active",
        "memberSince": "2024-01-15T10:00:00Z",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z",
        "lastLogin": "2024-12-15T14:30:00Z"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### 8. Get User by ID

**GET** `/api/v1/users/{user_id}`

Get detailed information about a specific user.

**Access**: Admin or Super Admin

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `user_id` (UUID): The ID of the user to retrieve

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+33123456789",
    "address": "123 Main St",
    "avatar": "https://example.com/avatar.jpg",
    "role": "member",
    "status": "active",
    "memberSince": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-12-15T14:30:00Z"
  }
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 9. Create User

**POST** `/api/v1/users`

Create a new user account. The user will be able to log in via OTP.

**Access**: Admin or Super Admin

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+33987654321",
  "address": "456 Oak Ave",
  "avatar": "https://example.com/avatar.jpg",
  "role": "member"
}
```

**Field Descriptions**:
- `email` (required): Unique email address
- `firstName` (required): User's first name
- `lastName` (required): User's last name
- `phone` (optional): Phone number
- `address` (optional): Physical address
- `avatar` (optional): URL to avatar image
- `role` (optional): User role - `member`, `admin`, or `super_admin` (default: `member`)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+33987654321",
    "address": "456 Oak Ave",
    "avatar": "https://example.com/avatar.jpg",
    "role": "member",
    "status": "active",
    "memberSince": "2024-12-15T15:00:00Z",
    "createdAt": "2024-12-15T15:00:00Z",
    "updatedAt": "2024-12-15T15:00:00Z",
    "lastLogin": null
  },
  "message": "User créé avec succès"
}
```

**Error Responses**:

- **400 Bad Request** - Email already exists:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### 10. Update User

**PATCH** `/api/v1/users/{user_id}`

Update a user's information.

**Access**: Admin or Super Admin

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `user_id` (UUID): The ID of the user to update

**Request Body** (all fields optional):
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@example.com",
  "phone": "+33111111111",
  "address": "New Address",
  "avatar": "https://example.com/new-avatar.jpg",
  "role": "admin",
  "status": "active"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "updated@example.com",
    "firstName": "Updated",
    "lastName": "Name",
    "phone": "+33111111111",
    "address": "New Address",
    "avatar": "https://example.com/new-avatar.jpg",
    "role": "admin",
    "status": "active",
    "memberSince": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-12-15T16:00:00Z",
    "lastLogin": "2024-12-15T14:30:00Z"
  },
  "message": "User mis à jour avec succès"
}
```

**Error Responses**:

- **403 Forbidden** - Admin trying to update admin role/status:
```json
{
  "success": false,
  "message": "Seuls les super administrateurs peuvent modifier le rôle d'autres administrateurs"
}
```

or

```json
{
  "success": false,
  "message": "Seuls les super administrateurs peuvent modifier le statut d'autres administrateurs"
}
```

**Permission Rules**:
- **Admin** can update any user EXCEPT:
  - Cannot change `role` of admins or super_admins
  - Cannot change `status` of admins or super_admins
- **Super Admin** can update any user including admins

---

### 11. Suspend User

**POST** `/api/v1/users/{user_id}/suspend`

Suspend a user account. Suspended users cannot log in.

**Access**: Admin or Super Admin

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `user_id` (UUID): The ID of the user to suspend

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "status": "suspended",
    "updatedAt": "2024-12-15T16:00:00Z"
  },
  "message": "User suspendu avec succès"
}
```

**Error Responses**:

- **403 Forbidden** - Admin trying to suspend another admin:
```json
{
  "success": false,
  "message": "Seuls les super administrateurs peuvent suspendre d'autres administrateurs"
}
```

**Permission Rules**:
- **Admin** can suspend members only
- **Admin** CANNOT suspend other admins or super_admins
- **Super Admin** can suspend anyone (including other admins)

---

### 12. Delete User

**DELETE** `/api/v1/users/{user_id}`

Permanently delete a user account.

**Access**: Admin or Super Admin

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `user_id` (UUID): The ID of the user to delete

**Success Response** (200):
```json
{
  "success": true,
  "message": "User supprimé avec succès"
}
```

**Error Responses**:

- **403 Forbidden** - Admin trying to delete another admin:
```json
{
  "success": false,
  "message": "Seuls les super administrateurs peuvent supprimer d'autres administrateurs"
}
```

**Permission Rules**:
- **Admin** can delete members only
- **Admin** CANNOT delete other admins or super_admins
- **Super Admin** can delete anyone (including other admins)

**Warning**: This action is permanent and cannot be undone. All related data (registrations, feedbacks, etc.) will be cascade deleted.

---

## Role-Based Permissions

### User Roles

1. **member** (default)
   - Regular users
   - Can manage own profile
   - Cannot access admin endpoints

2. **admin**
   - Administrative access
   - Can manage members
   - Cannot manage other admins

3. **super_admin**
   - Full administrative access
   - Can manage all users including admins

### Permission Matrix

| Action | Member | Admin | Super Admin |
|--------|--------|-------|-------------|
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Create users | ❌ | ✅ | ✅ |
| Update members | ❌ | ✅ | ✅ |
| Update admins | ❌ | ❌ | ✅ |
| Suspend members | ❌ | ✅ | ✅ |
| Suspend admins | ❌ | ❌ | ✅ |
| Delete members | ❌ | ✅ | ✅ |
| Delete admins | ❌ | ❌ | ✅ |

---

## Request/Response Schemas

### Authentication Schemas

#### SendOTPRequest
```typescript
{
  email: string;  // Valid email address
}
```

#### VerifyOTPRequest
```typescript
{
  email: string;  // Valid email address
  otp: string;    // 4-10 character OTP code
}
```

#### UserInfo (Basic User Info)
```typescript
{
  id: string;           // UUID
  email: string;
  firstName: string;
  lastName: string;
  role: string;         // "member" | "admin" | "super_admin"
  avatar: string | null;
}
```

#### VerifyOTPResponse
```typescript
{
  accessToken: string;
  refreshToken: string | null;
  user: UserInfo;
}
```

### User Schemas

#### UserResponse (Full User Profile)
```typescript
{
  id: string;                    // UUID
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  role: string;                  // "member" | "admin" | "super_admin"
  status: string;                // "active" | "suspended"
  memberSince: string | null;    // ISO 8601 timestamp
  createdAt: string | null;      // ISO 8601 timestamp
  updatedAt: string | null;      // ISO 8601 timestamp
  lastLogin: string | null;      // ISO 8601 timestamp
}
```

#### UserCreate
```typescript
{
  email: string;          // Required, unique
  firstName: string;      // Required
  lastName: string;       // Required
  phone?: string;
  address?: string;
  avatar?: string;
  role?: string;          // Default: "member"
}
```

#### UserUpdate
```typescript
{
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role?: string;          // Requires super_admin for admins
  status?: string;        // Requires super_admin for admins
}
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

### HTTP Status Codes

- **200 OK** - Successful request
- **400 Bad Request** - Invalid input or business rule violation
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., duplicate email)
- **422 Unprocessable Entity** - Validation errors

### Common Error Scenarios

#### 1. Invalid Token
```json
{
  "success": false,
  "message": "Invalid authentication credentials"
}
```

#### 2. Expired Token
Token expiration is handled by JWT validation. The token expires after 30 minutes (configurable).

#### 3. Account Suspended
```json
{
  "success": false,
  "message": "Compte utilisateur suspendu. Veuillez contacter un administrateur."
}
```

#### 4. Permission Denied
```json
{
  "success": false,
  "message": "Not authorized"
}
```

#### 5. Validation Errors
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": ["Invalid email format"],
    "firstName": ["Field is required"]
  }
}
```

---

## Examples

### Complete Authentication Flow

#### Step 1: Request OTP
```bash
curl -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "OTP envoyé avec succès",
    "expiresIn": 600
  }
}
```

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "member",
      "avatar": null
    }
  }
}
```

#### Step 3: Use Token for Authenticated Requests
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### User Profile Management

#### Get Own Profile
```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

#### Update Own Profile
```bash
curl -X PATCH http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "phone": "+33987654321"
  }'
```

---

### Admin User Management

#### List All Users
```bash
curl -X GET "http://localhost:8000/api/v1/users?status=active&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"
```

#### Create New User
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "firstName": "New",
    "lastName": "User",
    "role": "member"
  }'
```

#### Suspend User (Admin)
```bash
curl -X POST http://localhost:8000/api/v1/users/{user_id}/suspend \
  -H "Authorization: Bearer <admin_token>"
```

**Note**: If trying to suspend an admin, only super_admin tokens will work.

#### Delete User (Super Admin Only for Admins)
```bash
curl -X DELETE http://localhost:8000/api/v1/users/{user_id} \
  -H "Authorization: Bearer <super_admin_token>"
```

---

## Security Considerations

### 1. OTP Security
- OTPs expire after 10 minutes
- Each OTP can only be used once
- Previous unused OTPs are invalidated when a new one is sent
- OTPs are stored in the database (not hashed, but expire quickly)

### 2. JWT Token Security
- Tokens include user ID, email, and role
- Tokens expire after 30 minutes
- Tokens are signed with `SECRET_KEY`
- Token validation checks user exists and is active

### 3. Role-Based Access Control
- All admin endpoints verify admin role
- Super admin operations require explicit super_admin role
- Users cannot modify their own role or status

### 4. Email Validation
- Only registered emails can receive OTP
- Email format is validated using Pydantic's EmailStr

### 5. Account Status
- Suspended users cannot log in even with valid OTP
- Active status is checked on every authenticated request

---

## Configuration

### Environment Variables

```env
# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# MailerSend Configuration
MAILERSEND_API_KEY=your-mailersend-api-key
MAILERSEND_FROM_EMAIL=contact@pumpyfamilylife.com
MAILERSEND_FROM_NAME=Manssuétudes
```

---

## Testing

### Using FastAPI Interactive Docs

1. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

2. Open Swagger UI: http://localhost:8000/docs

3. Test endpoints directly from the browser

### Using cURL

See examples section above for cURL commands.

### Using Postman/Insomnia

1. Import the OpenAPI schema from `/openapi.json`
2. Set up environment variables for base URL and tokens
3. Test authentication flow:
   - Send OTP → Copy token from response
   - Use token in Authorization header for subsequent requests

---

## Troubleshooting

### Common Issues

#### 1. "Email non enregistré" Error
**Cause**: User doesn't exist in database
**Solution**: Admin must create user first via `POST /api/v1/users`

#### 2. "Code OTP invalide ou expiré" Error
**Cause**: Wrong OTP code or expired OTP
**Solution**: Request a new OTP

#### 3. "Not authorized" Error
**Cause**: User doesn't have required role
**Solution**: Check user's role, ensure admin/super_admin for admin endpoints

#### 4. "Seuls les super administrateurs peuvent..." Error
**Cause**: Admin trying to manage another admin
**Solution**: Use super_admin account or have super_admin perform the action

#### 5. Token Expired
**Cause**: JWT token expired (30 minutes)
**Solution**: User must verify OTP again to get new token

---

## API Versioning

All endpoints are under `/api/v1/` prefix. Future versions will use `/api/v2/`, etc.

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
- OTP-based authentication
- User profile management
- Admin user management with role restrictions
- MailerSend email integration


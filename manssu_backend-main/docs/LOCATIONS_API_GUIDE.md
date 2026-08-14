# Locations API Guide

Complete documentation for location management endpoints in the MANSSU backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Location CRUD Operations](#location-crud-operations)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Business Logic & Workflow](#business-logic--workflow)
5. [Examples](#examples)
6. [Error Handling](#error-handling)

---

## Overview

The Locations API manages physical and virtual locations used for sessions. Locations can be linked to Google Places for enhanced mapping and directions functionality.

### Key Concepts

- **Location Model**: Centralized location storage referenced by sessions
- **Google Places Integration**: Optional integration with Google Places API
- **Location Protection**: Locations cannot be deleted if used by active sessions
- **Search Functionality**: Search locations by name or address

### Access Levels

- **Public**: View locations, get location details
- **Admin/Super Admin**: Create, update, delete locations

---

## Location CRUD Operations

Base URL: `/api/v1/locations`

### 1. Get All Locations

**GET** `/api/v1/locations?search=&page=1&limit=10`

Get a paginated list of all locations with search functionality.

**Access**: Public (no authentication required)

**Query Parameters**:
- `search` (optional): Search in name or address
- `page` (optional): Page number (default: 1, minimum: 1)
- `limit` (optional): Items per page (default: 10, minimum: 1, maximum: 100)

**Example Request**:
```
GET /api/v1/locations?search=Paris&page=1&limit=20
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Main Conference Room",
        "address": "123 Main Street, Paris, France",
        "instructions": "Enter through the main door, take elevator to 3rd floor",
        "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "createdAt": "2024-12-10T10:00:00Z",
        "updatedAt": "2024-12-10T10:00:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Training Center",
        "address": "456 Training Avenue, Paris, France",
        "instructions": null,
        "googlePlaceId": null,
        "createdAt": "2024-12-11T14:00:00Z",
        "updatedAt": "2024-12-11T14:00:00Z"
      }
    ],
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Search Behavior**:
- Searches in both `name` and `address` fields
- Case-insensitive partial matching
- Returns locations matching either field

---

### 2. Get Location by ID

**GET** `/api/v1/locations/{location_id}`

Get detailed information about a specific location.

**Access**: Public (no authentication required)

**Path Parameters**:
- `location_id` (UUID): The ID of the location to retrieve

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Conference Room",
    "address": "123 Main Street, Paris, France",
    "instructions": "Enter through the main door, take elevator to 3rd floor",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
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
  "message": "Location not found"
}
```

---

### 3. Create Location

**POST** `/api/v1/locations`

Create a new location. Only admins can create locations.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "name": "Main Conference Room",
  "address": "123 Main Street, Paris, France",
  "instructions": "Enter through the main door, take elevator to 3rd floor",
  "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
}
```

**Field Descriptions**:
- `name` (optional): Location name/identifier
- `address` (required): Physical address of the location
- `instructions` (optional): Additional instructions for finding the location
- `googlePlaceId` (optional): Google Places API place ID for integration

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Conference Room",
    "address": "123 Main Street, Paris, France",
    "instructions": "Enter through the main door, take elevator to 3rd floor",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T10:00:00Z"
  },
  "message": "Lieu créé avec succès"
}
```

**Google Places Integration**:
- `googlePlaceId` links location to Google Places
- Enables map integration, directions, and place details
- Can be obtained from Google Places API search

---

### 4. Update Location

**PATCH** `/api/v1/locations/{location_id}`

Update an existing location. Only admins can update locations.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `location_id` (UUID): The ID of the location to update

**Request Body**: All fields optional
```json
{
  "name": "Updated Conference Room",
  "address": "456 New Street, Paris, France",
  "instructions": "Updated instructions",
  "googlePlaceId": "ChIJNewPlaceId123"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Conference Room",
    "address": "456 New Street, Paris, France",
    "instructions": "Updated instructions",
    "googlePlaceId": "ChIJNewPlaceId123",
    "createdAt": "2024-12-10T10:00:00Z",
    "updatedAt": "2024-12-10T15:30:00Z"
  },
  "message": "Lieu mis à jour avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Location not found"
}
```

---

### 5. Delete Location

**DELETE** `/api/v1/locations/{location_id}`

Permanently delete a location. Only admins can delete locations. Locations cannot be deleted if they are used by any sessions.

**Access**: Admin or Super Admin only

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Path Parameters**:
- `location_id` (UUID): The ID of the location to delete

**Success Response** (200):
```json
{
  "success": true,
  "message": "Lieu supprimé avec succès"
}
```

**Error Responses**:

- **404 Not Found**:
```json
{
  "success": false,
  "message": "Location not found"
}
```

- **400 Bad Request** - Location in use:
```json
{
  "success": false,
  "message": "Cannot delete location that is used by active sessions"
}
```

**Business Logic**:
- Checks if location is referenced by any sessions
- Prevents deletion if location is in use
- Protects data integrity by preventing orphaned session references

---

## Request/Response Schemas

### Location Schemas

#### CreateLocationRequest
```typescript
{
  name?: string;                   // Optional
  address: string;                 // Required
  instructions?: string;           // Optional
  googlePlaceId?: string;          // Optional
}
```

#### UpdateLocationRequest
```typescript
{
  name?: string;
  address?: string;
  instructions?: string;
  googlePlaceId?: string;
}
```

#### LocationResponse
```typescript
{
  id: string;
  name: string | null;
  address: string;
  instructions: string | null;
  googlePlaceId: string | null;
  createdAt: string | null;      // ISO 8601 timestamp
  updatedAt: string | null;       // ISO 8601 timestamp
}
```

---

## Business Logic & Workflow

### Location Lifecycle

1. **Creation** (Admin)
   - Admin creates location with address
   - Optional: Add name, instructions, Google Place ID
   - Location is immediately available for use

2. **Usage in Sessions**
   - Sessions reference location via `location_id`
   - Location details included in session responses
   - Multiple sessions can use same location

3. **Updates** (Admin)
   - Admin can update any location field
   - Changes reflect in all sessions using the location
   - `updatedAt` timestamp is automatically maintained

4. **Deletion Protection**
   - System checks if location is used by sessions
   - Prevents deletion if location is in use
   - Ensures data integrity

### Google Places Integration

**Benefits**:
- Map display and directions
- Place details and photos
- Reviews and ratings
- Consistent place identification

**How to Get Google Place ID**:
1. Use Google Places API to search for location
2. Extract `place_id` from search results
3. Store in `googlePlaceId` field

**Example**:
```javascript
// Frontend: Search for place
const response = await fetch(
  `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=123 Main Street&inputtype=textquery&fields=place_id&key=YOUR_API_KEY`
);
const placeId = response.candidates[0].place_id;

// Store in location
await createLocation({
  name: "Main Conference Room",
  address: "123 Main Street, Paris, France",
  googlePlaceId: placeId
});
```

### Search Functionality

**Search Fields**:
- `name`: Location name/identifier
- `address`: Physical address

**Search Behavior**:
- Case-insensitive
- Partial matching (LIKE query)
- Searches both fields with OR logic
- Returns locations matching either field

**Example Searches**:
- `search=Paris` → Finds locations with "Paris" in name or address
- `search=Conference` → Finds locations with "Conference" in name or address
- `search=123 Main` → Finds locations with "123 Main" in address

---

## Examples

### Complete Location Workflow

#### Step 1: Create Location (Admin)
```bash
curl -X POST http://localhost:8000/api/v1/locations \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Conference Room",
    "address": "123 Main Street, Paris, France",
    "instructions": "Enter through the main door, take elevator to 3rd floor",
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
  }'
```

#### Step 2: Search Locations
```bash
curl -X GET "http://localhost:8000/api/v1/locations?search=Conference&page=1&limit=10"
```

#### Step 3: Get Location Details
```bash
curl -X GET http://localhost:8000/api/v1/locations/{location_id}
```

#### Step 4: Update Location (Admin)
```bash
curl -X PATCH http://localhost:8000/api/v1/locations/{location_id} \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Conference Room",
    "instructions": "Updated instructions"
  }'
```

#### Step 5: Use in Session
```bash
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Workshop",
    "type": "workshop",
    "locationId": "location-uuid",
    "isOnline": false,
    "maxParticipants": 30
  }'
```

### Querying Locations

#### Get All Locations (Paginated)
```bash
curl -X GET "http://localhost:8000/api/v1/locations?page=1&limit=20"
```

#### Search by Name
```bash
curl -X GET "http://localhost:8000/api/v1/locations?search=Conference"
```

#### Search by Address
```bash
curl -X GET "http://localhost:8000/api/v1/locations?search=123 Main"
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

#### 1. Location Not Found
```json
{
  "success": false,
  "message": "Location not found"
}
```

**Cause**: Invalid location ID or location was deleted

**Solution**: Verify location ID exists

#### 2. Cannot Delete Location in Use
```json
{
  "success": false,
  "message": "Cannot delete location that is used by active sessions"
}
```

**Cause**: Location is referenced by one or more sessions

**Solution**: 
- Remove location from all sessions first
- Or update sessions to use different location
- Then delete the location

#### 3. Unauthorized Access
```json
{
  "success": false,
  "message": "Not authorized"
}
```

**Cause**: User doesn't have admin role for admin-only endpoints

**Solution**: Use admin or super_admin account

#### 4. Missing Required Field
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "address": ["Field required"]
  }
}
```

**Cause**: Required field `address` is missing

**Solution**: Provide all required fields

---

## Security Considerations

### 1. Authentication
- Create/update/delete endpoints require authentication
- Admin endpoints require admin/super_admin role
- Public endpoints (GET) don't require authentication

### 2. Authorization
- Location management: Admin/Super Admin only
- Viewing locations: Public access

### 3. Data Protection
- Locations cannot be deleted if used by sessions
- Prevents orphaned references
- Maintains referential integrity

### 4. Google Places Integration
- `googlePlaceId` is optional
- No validation of place ID format
- Frontend should validate place ID if using Google Maps

---

## Best Practices

### For Admins

1. **Location Creation**
   - Use descriptive names for easy identification
   - Provide complete addresses
   - Add helpful instructions for finding the location
   - Link to Google Places when available

2. **Location Management**
   - Reuse locations for multiple sessions
   - Update locations when details change
   - Don't delete locations used by sessions

3. **Google Places Integration**
   - Obtain place IDs from Google Places API
   - Store place IDs for map integration
   - Verify place IDs are correct

### For Developers

1. **Location References**
   - Always use `locationId` in sessions (not inline location data)
   - Load location relationship when needed
   - Handle null locations gracefully

2. **Search Implementation**
   - Use search parameter for location filtering
   - Implement autocomplete using search
   - Cache frequently used locations

---

## API Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/locations` | GET | Public | List locations (paginated, searchable) |
| `/locations/{id}` | GET | Public | Get location by ID |
| `/locations` | POST | Admin | Create location |
| `/locations/{id}` | PATCH | Admin | Update location |
| `/locations/{id}` | DELETE | Admin | Delete location (if not in use) |

---

## Troubleshooting

### Common Issues

#### 1. "Cannot delete location that is used by active sessions"
**Solution**: 
1. Find sessions using the location
2. Update sessions to use different location or set `locationId` to null
3. Then delete the location

#### 2. Location Not Appearing in Session Response
**Possible Causes**:
- `locationId` is null
- Location was deleted
- Location relationship not loaded

**Solution**: Verify location exists and `locationId` is correct

#### 3. Search Not Finding Location
**Possible Causes**:
- Search term doesn't match name or address
- Case sensitivity (should be case-insensitive)
- Special characters in search term

**Solution**: Try different search terms, check location name/address

---

## Support

For issues or questions:
- Check the main [Backend Guide](./BACKEND_GUIDE.md)
- Review error messages for specific guidance
- Check FastAPI auto-generated docs at `/docs`
- See [Sessions API Guide](./SESSIONS_API_GUIDE.md) for location usage in sessions

---

## Changelog

### Version 1.0.0
- Initial implementation
- Location CRUD operations
- Search functionality (name and address)
- Google Places integration support
- Deletion protection for locations in use
- Name field added for better identification


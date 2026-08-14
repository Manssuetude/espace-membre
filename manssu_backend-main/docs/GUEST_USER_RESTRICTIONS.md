# Guest User Restrictions

Complete guide to the restrictions and limitations for guest users in the MANSSU platform.

---

## Overview

Guest users have **limited access** compared to regular members. They can only access content and features related to the specific sessions they've been invited to.

---

## Guest User Capabilities

### ✅ What Guests CAN Do

1. **View Invited Sessions**
   - Can view session details for sessions they're registered for
   - Can see session information, objectives, and basic details
   - Access is restricted to only their registered sessions

2. **View Session Resources**
   - Can view approved resources **only** from sessions they're registered for
   - Cannot see resources from other sessions
   - Cannot see pending or rejected resources

3. **View Session Polls**
   - Can view polls associated with their registered sessions
   - Can vote on polls (if poll allows guest participation)
   - Cannot see polls from other sessions

4. **View Own Profile**
   - Can view their own profile information
   - Can update their own profile (name, etc.)

---

## Guest User Restrictions

### ❌ What Guests CANNOT Do

1. **Cannot View All Sessions**
   - Cannot browse all sessions
   - Cannot see sessions they're not registered for
   - Session list is filtered to only show their registered sessions

2. **Cannot Access All Resources**
   - Cannot view resources from sessions they're not registered for
   - Cannot view general resources not linked to their sessions
   - Resource access is limited to approved resources from their registered sessions only

3. **Cannot Submit Feedback**
   - **Cannot create feedback** of any kind
   - Cannot submit session feedback
   - Cannot submit general feedback
   - Feedback submission endpoints should return 403 Forbidden for guests

4. **Cannot Propose Themes**
   - **Cannot create theme proposals**
   - Cannot submit themes even when proposal window is open
   - Theme creation endpoints should return 403 Forbidden for guests

5. **Can Create Resources**
   - Can create resources for sessions they're registered for
   - Resources are created with status="pending" and require admin approval
   - Can share files or links related to their registered sessions

6. **Cannot Vote on All Polls**
   - Voting may be restricted depending on poll configuration
   - Cannot see polls from sessions they're not registered for

7. **Cannot Access Dashboard**
   - May have limited or no dashboard access
   - Cannot see general platform statistics

---

## API Endpoint Restrictions

### Sessions API

**GET `/api/v1/sessions`**
- **Guest Access**: ✅ Limited
- **Behavior**: Only returns sessions the guest is registered for
- **Implementation**: Service filters sessions by `SessionRegistration` for guests

**GET `/api/v1/sessions/{session_id}`**
- **Guest Access**: ✅ Limited
- **Behavior**: Only accessible if guest is registered for that session
- **Returns**: 404 Not Found if guest tries to access unregistered session

---

### Resources API

**GET `/api/v1/resources`**
- **Guest Access**: ✅ Limited
- **Behavior**: Should only return resources from sessions guest is registered for
- **Note**: Currently may need filtering implementation

**GET `/api/v1/resources/{resource_id}`**
- **Guest Access**: ✅ Limited
- **Behavior**: Should only be accessible if resource belongs to a session guest is registered for
- **Returns**: 404 Not Found if resource is from unregistered session

**POST `/api/v1/resources`**
- **Guest Access**: ✅ **ALLOWED**
- **Behavior**: Guests can create resources for sessions they're registered for
- **Status**: Resources created by guests have status="pending" and require admin approval

---

### Feedback API

**POST `/api/v1/feedbacks`**
- **Guest Access**: ❌ **FORBIDDEN**
- **Behavior**: Should return 403 Forbidden
- **Error Response**:
  ```json
  {
    "detail": "Les invités ne peuvent pas soumettre de feedback"
  }
  ```

**GET `/api/v1/feedbacks/me`**
- **Guest Access**: ❌ **FORBIDDEN** (or returns empty list)
- **Behavior**: Guests cannot have feedbacks since they cannot create them

---

### Themes API

**POST `/api/v1/themes`**
- **Guest Access**: ❌ **FORBIDDEN**
- **Behavior**: Should return 403 Forbidden
- **Error Response**:
  ```json
  {
    "detail": "Les invités ne peuvent pas proposer de thèmes"
  }
  ```

**GET `/api/v1/themes/window/status`**
- **Guest Access**: ✅ Limited
- **Behavior**: Can view window status but cannot submit themes

**GET `/api/v1/themes`**
- **Guest Access**: ✅ Limited
- **Behavior**: Can view themes but cannot create them

---

### Polls API

**GET `/api/v1/polls`**
- **Guest Access**: ✅ Limited
- **Behavior**: Should only return polls from sessions guest is registered for

**POST `/api/v1/polls/{poll_id}/vote`**
- **Guest Access**: ✅ Limited (depends on poll configuration)
- **Behavior**: Can vote on polls from their registered sessions only

---

## Implementation Notes

### Current Status

Based on codebase review:

1. **Session Restrictions**: ✅ **IMPLEMENTED**
   - `SessionService` filters sessions for guests
   - Guests can only see registered sessions

2. **Poll Restrictions**: ✅ **IMPLEMENTED**
   - `PollService` filters polls for guests
   - Guests can only see polls from registered sessions

3. **Resource Restrictions**: ⚠️ **PARTIALLY IMPLEMENTED**
   - Resource service doesn't currently filter by guest's registered sessions
   - **Needs implementation**: Filter resources by guest's session registrations

4. **Feedback Restrictions**: ❌ **NOT IMPLEMENTED**
   - `POST /api/v1/feedbacks` currently allows any authenticated user
   - **Needs implementation**: Check user role and reject guests

5. **Theme Restrictions**: ❌ **NOT IMPLEMENTED**
   - `POST /api/v1/themes` currently allows any authenticated user
   - **Needs implementation**: Check user role and reject guests

---

## Recommended Implementation

### 1. Resource Filtering for Guests

**In `ResourceService.get_resources()`:**
```python
# Check if user is a guest
if user_id:
    user = self.db.query(User).filter(User.id == user_id).first()
    if user and user.role == "guest":
        # Get guest's registered session IDs
        registered_sessions = self.db.query(SessionRegistration.session_id).filter(
            SessionRegistration.user_id == user_id
        ).all()
        session_ids = [reg.session_id for reg in registered_sessions]
        
        # Filter resources to only those from registered sessions
        query = query.filter(Resource.session_id.in_(session_ids))
```

### 2. Feedback Restriction

**In `app/api/v1/feedbacks.py`:**
```python
@router.post("", response_model=APIResponse)
async def create_feedback(
    data: CreateFeedbackRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if user is a guest
    if current_user.role == "guest":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les invités ne peuvent pas soumettre de feedback"
        )
    # ... rest of implementation
```

### 3. Theme Restriction

**In `app/api/v1/themes.py`:**
```python
@router.post("", response_model=APIResponse)
async def create_theme(
    data: CreateThemeRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if user is a guest
    if current_user.role == "guest":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Les invités ne peuvent pas proposer de thèmes"
        )
    # ... rest of implementation
```

### 4. Resource Creation (Allowed for Guests)

Guests can create resources for sessions they're registered for. Resources are created with status="pending" and require admin approval, just like regular members.

---

## Summary Table

| Feature | Guest Access | Notes |
|---------|-------------|-------|
| View Own Sessions | ✅ Yes | Only registered sessions |
| View Session Resources | ✅ Yes | Only from registered sessions |
| Create Resources | ✅ Yes | For registered sessions only, status=pending |
| Submit Feedback | ❌ No | Should return 403 |
| Propose Themes | ❌ No | Should return 403 |
| Vote on Polls | ✅ Limited | Only from registered sessions |
| View All Sessions | ❌ No | Filtered to registered only |
| View All Resources | ❌ No | Filtered to registered sessions only |
| View Dashboard | ❌ No | Limited or no access |
| Update Own Profile | ✅ Yes | Can update name, etc. |

---

## Error Messages

When guests attempt restricted actions, they should receive:

**French Error Messages:**
- Feedback: `"Les invités ne peuvent pas soumettre de feedback"`
- Themes: `"Les invités ne peuvent pas proposer de thèmes"`

**HTTP Status Code:** `403 Forbidden`

---

## Testing Checklist

- [ ] Guest can create resources (for registered sessions only)
- [ ] Guest cannot submit feedback
- [ ] Guest cannot propose themes
- [ ] Guest can only see sessions they're registered for
- [ ] Guest can only see resources from registered sessions
- [ ] Guest can only see polls from registered sessions
- [ ] Guest can view their own profile
- [ ] Guest can update their own profile (name, etc.)
- [ ] Guest receives appropriate 403 errors for restricted actions

---

## Notes

- Guest restrictions are enforced at the API endpoint level
- Service layer may also need updates for resource filtering
- Guest role is assigned during invitation registration
- Guests can be upgraded to members by admins using `POST /api/v1/users/{user_id}/upgrade`


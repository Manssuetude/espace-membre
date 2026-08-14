from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Any
from app.database import get_db
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException, ForbiddenException

# HTTP Bearer token scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Dependency to get the current authenticated user from JWT token.
    
    Raises:
        UnauthorizedException: If token is invalid or missing
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise UnauthorizedException("Invalid authentication credentials")
    
    user_id: Optional[str] = payload.get("sub")
    email: Optional[str] = payload.get("email")
    
    if user_id is None or email is None:
        raise UnauthorizedException("Invalid token payload")
    
    # Import here to avoid circular imports
    from app.models.user import User
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise UnauthorizedException("User not found")
    
    if user.status != "active":
        raise UnauthorizedException("User account is not active")
    
    return user


def get_current_admin(
    current_user = Depends(get_current_user)
):
    """
    Dependency to ensure the current user is an admin.
    
    Raises:
        ForbiddenException: If user is not an admin
    """
    if current_user.role not in ["admin", "super_admin"]:
        raise ForbiddenException("Admin access required")
    
    return current_user


def get_current_super_admin(
    current_user = Depends(get_current_user)
):
    """
    Dependency to ensure the current user is a super admin.
    
    Raises:
        ForbiddenException: If user is not a super admin
    """
    if current_user.role != "super_admin":
        raise ForbiddenException("Super admin access required")
    
    return current_user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[Any]:
    """
    Optional dependency to get the current authenticated user from JWT token.
    Returns None if no token is provided or token is invalid.
    
    Returns:
        User object if authenticated, None otherwise
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        if payload is None:
            return None
        
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        
        if user_id is None or email is None:
            return None
        
        # Import here to avoid circular imports
        from app.models.user import User
        
        user = db.query(User).filter(User.id == user_id).first()
        
        if user is None or user.status != "active":
            return None
        
        return user
    except Exception:
        return None


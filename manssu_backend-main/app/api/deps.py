from fastapi import Depends
from sqlalchemy.orm import Session
from app.database import get_db

# Re-export dependencies for convenience
__all__ = ["get_db"]


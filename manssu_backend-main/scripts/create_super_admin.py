#!/usr/bin/env python3
"""
Script to create a super admin user in the database.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from datetime import datetime, timezone
import uuid

def create_super_admin():
    """Create a super admin user"""
    db: Session = SessionLocal()
    
    try:
        email = "malik.nassourou@yahoo.fr"
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            print(f"   ID: {existing_user.id}")
            print(f"   Role: {existing_user.role}")
            print(f"   Status: {existing_user.status}")
            return False
        
        # Create new super admin user
        user = User(
            id=uuid.uuid4(),
            email=email,
            first_name="Malik",
            last_name="Nassourou",
            role="super_admin",
            status="active",
            password_hash=None,  # OTP-only authentication
            member_since=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        print(f"✅ Super admin user created successfully!")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Role: {user.role}")
        print(f"   Status: {user.status}")
        print(f"\n📧 You can now log in using OTP authentication with email: {email}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating super admin: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    create_super_admin()


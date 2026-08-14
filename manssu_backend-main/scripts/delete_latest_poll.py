#!/usr/bin/env python3
"""Script to delete the latest poll"""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models.poll import Poll
from app.services.poll_service import PollService

def delete_latest_poll():
    """Find and delete the latest poll"""
    db = SessionLocal()
    try:
        # Find the latest poll by created_at
        latest_poll = db.query(Poll).order_by(Poll.created_at.desc()).first()
        
        if not latest_poll:
            print("No polls found in the database.")
            return
        
        print(f"Found latest poll:")
        print(f"  ID: {latest_poll.id}")
        print(f"  Title: {latest_poll.title}")
        print(f"  Created at: {latest_poll.created_at}")
        print(f"  Status: {latest_poll.status}")
        
        # Delete using the service
        service = PollService(db)
        success = service.delete_poll(str(latest_poll.id))
        
        if success:
            print(f"\n✓ Successfully deleted poll: {latest_poll.title}")
        else:
            print(f"\n✗ Failed to delete poll")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_latest_poll()


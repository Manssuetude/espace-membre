#!/usr/bin/env python3
"""Script to get the last poll results with all details"""

import sys
import json
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models.poll import Poll
from app.services.poll_service import PollService

def get_last_poll_results():
    """Get the last poll results with all details"""
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
        print(f"  Total Responses: {latest_poll.total_responses}")
        print(f"  Participation: {latest_poll.participation}%")
        print("\n" + "="*80 + "\n")
        
        # Get detailed poll results using the service
        service = PollService(db)
        poll_data = service.get_poll_by_id(str(latest_poll.id), user_id=None)
        
        if not poll_data:
            print("Could not retrieve poll details.")
            return
        
        # Convert to dict and pretty print
        poll_dict = poll_data.model_dump()
        
        # Print formatted results
        print("POLL RESULTS")
        print("="*80)
        print(f"Title: {poll_dict['title']}")
        print(f"Description: {poll_dict.get('description', 'N/A')}")
        print(f"Status: {poll_dict['status']}")
        print(f"Total Responses: {poll_dict['totalResponses']}")
        print(f"Total Members: {poll_dict['totalMembers']}")
        print(f"Participation: {poll_dict.get('participation', 0):.2f}%")
        print(f"Results Visibility: {poll_dict['resultsVisibility']}")
        print(f"Anonymous: {poll_dict['anonymous']}")
        print(f"Start Date: {poll_dict.get('startDate', 'N/A')}")
        print(f"End Date: {poll_dict.get('endDate', 'N/A')}")
        print(f"Days Left: {poll_dict.get('daysLeft', 'N/A')}")
        print("\n" + "-"*80 + "\n")
        
        # Print questions and options
        if poll_dict.get('questions'):
            print("QUESTIONS AND RESULTS:")
            print("="*80)
            for idx, question in enumerate(poll_dict['questions'], 1):
                print(f"\nQuestion {idx}: {question['question']}")
                if question.get('description'):
                    print(f"Description: {question['description']}")
                print(f"Single Response: {question['singleResponse']}")
                print(f"Order Index: {question['orderIndex']}")
                print("\nOptions:")
                for opt_idx, option in enumerate(question['options'], 1):
                    print(f"  {opt_idx}. {option['label']}")
                    print(f"     Votes: {option['votes']}")
                    print(f"     Percentage: {option['percentage']:.2f}%")
                    print(f"     Color: {option['color']}")
                print("-"*80)
        
        # Print voters if available
        if poll_dict.get('voters'):
            print("\n" + "="*80)
            print("VOTERS:")
            print("="*80)
            for voter in poll_dict['voters']:
                print(f"\n{voter['name']} ({voter['firstName']} {voter['lastName']})")
                if voter.get('avatar'):
                    print(f"Avatar: {voter['avatar']}")
                if voter.get('questions'):
                    print("Votes:")
                    for q_data in voter['questions']:
                        print(f"  Question: {q_data.get('question', 'N/A')}")
                        for opt in q_data.get('options', []):
                            print(f"    - {opt['optionLabel']} (voted at: {opt.get('votedAt', 'N/A')})")
                print("-"*80)
        
        # Save to JSON file
        output_file = Path(__file__).parent.parent / "last_poll_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(poll_dict, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\n\nFull results saved to: {output_file}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    get_last_poll_results()


















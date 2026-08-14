#!/usr/bin/env python3
"""Script to create 3v3 debate groups based on poll results"""

import sys
import json
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

def load_poll_results():
    """Load poll results from JSON file"""
    json_file = Path(__file__).parent.parent / "last_poll_results.json"
    with open(json_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_debate_groups():
    """Create 2v2 debate groups based on subject preferences and answers"""
    
    # Load poll results
    poll_data = load_poll_results()
    
    # Excluded users
    excluded_names = ["OKALA", "Nkouben", "Livia", "Coralie"]
    excluded_full_names = [
        "Florent OKALA",
        "Arthur Nkouben",
        "Estelle Agnès Livia NGONN AMBASSA",
        "Coralie Nyebele"
    ]
    
    # Map question indices to subject numbers
    # Question 0 = Subject 1, Question 1 = Subject 2, etc.
    question_to_subject = {
        0: 1,  # La dot
        1: 2,  # Mariage inter communitaire
        2: 3,  # Identité africaine
        3: 4,  # Capitalisme
        4: 5,  # Intégration vs affirmation
        5: 6,  # Réseaux sociaux
    }
    
    # Question 6 (index 6) is the subject preference question
    preference_question_index = 6
    
    # Get all voters
    voters = poll_data.get('voters', [])
    
    # Filter out excluded users
    filtered_voters = []
    for voter in voters:
        name = voter.get('name', '')
        first_name = voter.get('firstName', '')
        last_name = voter.get('lastName', '')
        full_name = f"{first_name} {last_name}"
        
        # Check if excluded
        is_excluded = False
        for excluded in excluded_names:
            if excluded.upper() in name.upper() or excluded.upper() in full_name.upper():
                is_excluded = True
                break
        for excluded_full in excluded_full_names:
            if excluded_full.upper() in full_name.upper():
                is_excluded = True
                break
        
        if not is_excluded:
            filtered_voters.append(voter)
    
    print(f"Total voters: {len(voters)}")
    print(f"After exclusions: {len(filtered_voters)}")
    print(f"Excluded: {len(voters) - len(filtered_voters)} users\n")
    
    # Get questions data
    questions = poll_data.get('questions', [])
    if len(questions) < 7:
        print("Error: Not enough questions in poll data")
        return
    
    # Build a map: subject -> {option -> [voters]}
    # For each subject (1-6), we need to find:
    # - People who selected that subject in Question 7
    # - Group them by their answer to the corresponding question (0-5)
    
    # Create a mapping of question IDs to subject numbers
    question_id_to_subject = {}
    for idx, q in enumerate(questions[:6]):  # First 6 questions
        question_id_to_subject[q.get('id', '')] = idx + 1  # Subject 1-6
    
    # Get the preference question ID (Question 7, index 6)
    preference_question_id = questions[6].get('id', '') if len(questions) > 6 else ''
    
    subject_groups = defaultdict(lambda: defaultdict(list))
    
    # Process each voter
    for voter in filtered_voters:
        voter_name = voter.get('name', '')
        voter_questions = voter.get('questions', [])
        
        # Find their subject preferences (Question 7) by question ID
        preference_question = None
        for q_data in voter_questions:
            q_id = q_data.get('questionId', '')
            if q_id == preference_question_id:
                preference_question = q_data
                break
        
        if not preference_question:
            continue
        
        # Get which subjects they selected
        selected_subjects = set()
        for option in preference_question.get('options', []):
            option_label = option.get('optionLabel', '')
            # Extract subject number from "Sujet X"
            if 'Sujet' in option_label:
                try:
                    subject_num = int(option_label.split()[-1])
                    selected_subjects.add(subject_num)
                except:
                    pass
        
        # For each selected subject, find their answer to the corresponding question
        for subject_num in selected_subjects:
            # Find the question ID for this subject
            question_index = subject_num - 1  # Subject 1 -> Question 0, etc.
            
            if question_index < 0 or question_index >= 6:
                continue
            
            target_question_id = questions[question_index].get('id', '')
            voter_answer = None
            
            # Find their answer to this question by question ID
            for q_data in voter_questions:
                q_id = q_data.get('questionId', '')
                if q_id == target_question_id:
                    # Get their selected option(s)
                    options = q_data.get('options', [])
                    if options:
                        # For single response, take the first option
                        option_label = options[0].get('optionLabel', '')
                        voter_answer = option_label
                    break
            
            if voter_answer:
                subject_groups[subject_num][voter_answer].append({
                    'name': voter_name,
                    'firstName': voter.get('firstName', ''),
                    'lastName': voter.get('lastName', ''),
                    'id': voter.get('id', '')
                })
    
    # Now create 2v2 groups for each subject
    print("="*80)
    print("DEBATE GROUPS (2v2)")
    print("="*80)
    print()
    
    all_groups = []
    
    for subject_num in sorted(subject_groups.keys()):
        subject_data = subject_groups[subject_num]
        
        # Get question info
        question_index = subject_num - 1
        question = questions[question_index]
        question_text = question.get('question', '')
        options = question.get('options', [])
        
        print(f"SUBJECT {subject_num}: {question_text}")
        print("-"*80)
        
        # Get the two sides (options)
        if len(options) < 2:
            print(f"  ⚠️  Not enough options for this subject")
            print()
            continue
        
        option1_label = options[0].get('label', '')
        option2_label = options[1].get('label', '')
        
        side1_voters = subject_data.get(option1_label, [])
        side2_voters = subject_data.get(option2_label, [])
        
        print(f"  {option1_label}: {len(side1_voters)} voters")
        print(f"  {option2_label}: {len(side2_voters)} voters")
        
        # Create groups of 2v2
        side1_list = side1_voters[:]
        side2_list = side2_voters[:]
        
        group_num = 1
        while len(side1_list) >= 2 and len(side2_list) >= 2:
            # Take 2 from each side
            team1 = side1_list[:2]
            team2 = side2_list[:2]
            
            side1_list = side1_list[2:]
            side2_list = side2_list[2:]
            
            print(f"\n  Group {group_num}:")
            print(f"    Team 1 ({option1_label}):")
            for member in team1:
                print(f"      - {member['name']}")
            print(f"    Team 2 ({option2_label}):")
            for member in team2:
                print(f"      - {member['name']}")
            
            all_groups.append({
                'subject': subject_num,
                'question': question_text,
                'option1': option1_label,
                'option2': option2_label,
                'team1': team1,
                'team2': team2,
                'group_num': group_num
            })
            
            group_num += 1
        
        # Show remaining voters who couldn't form a complete group
        if side1_list or side2_list:
            print(f"\n  ⚠️  Remaining voters (cannot form complete 2v2 group):")
            if side1_list:
                print(f"    {option1_label}: {len(side1_list)} - {', '.join([v['name'] for v in side1_list])}")
            if side2_list:
                print(f"    {option2_label}: {len(side2_list)} - {', '.join([v['name'] for v in side2_list])}")
        
        print()
        print("="*80)
        print()
    
    # Save to JSON
    output_file = Path(__file__).parent.parent / "debate_groups.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_groups, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"\n✓ Debate groups saved to: {output_file}")
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"Total groups created: {len(all_groups)}")
    print(f"Total participants in groups: {sum(len(g['team1']) + len(g['team2']) for g in all_groups)}")
    
    return all_groups

if __name__ == "__main__":
    create_debate_groups()


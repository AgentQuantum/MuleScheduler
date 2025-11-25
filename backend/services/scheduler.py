from database import db
from models import (
    Assignment, UserAvailability, ShiftRequirement, 
    GlobalSettings, TimeSlot, User
)
from datetime import timedelta

def calculate_hours(time_slot):
    """Calculate hours for a time slot"""
    start = time_slot.start_time
    end = time_slot.end_time
    
    # Convert to minutes for calculation
    start_minutes = start.hour * 60 + start.minute
    end_minutes = end.hour * 60 + end.minute
    
    if end_minutes < start_minutes:  # Overnight shift
        hours = (24 * 60 - start_minutes + end_minutes) / 60
    else:
        hours = (end_minutes - start_minutes) / 60
    
    return hours

def get_user_total_hours(user_id, week_start_date):
    """Calculate total assigned hours for a user in a week"""
    assignments = Assignment.query.filter_by(
        user_id=user_id,
        week_start_date=week_start_date
    ).all()
    
    total = 0
    for assignment in assignments:
        hours = calculate_hours(assignment.time_slot)
        total += hours
    
    return total

def has_overlapping_assignment(user_id, time_slot_id, week_start_date):
    """Check if user already has an assignment for the same time slot"""
    existing = Assignment.query.filter_by(
        user_id=user_id,
        time_slot_id=time_slot_id,
        week_start_date=week_start_date
    ).first()
    return existing is not None

def run_auto_scheduler(week_start_date):
    """
    Auto-schedule workers for a given week based on:
    - Shift requirements
    - User availability
    - Global settings (max workers per shift, max hours per user)
    """
    # Get global settings
    settings = GlobalSettings.query.first()
    if not settings:
        settings = GlobalSettings(max_workers_per_shift=3, max_hours_per_user_per_week=None)
        db.session.add(settings)
        db.session.commit()
    
    # Get all shift requirements for this week
    requirements = ShiftRequirement.query.filter_by(week_start_date=week_start_date).all()
    
    if not requirements:
        return {
            'message': 'No shift requirements found for this week',
            'scheduled': 0,
            'assignments': []
        }
    
    # Clear existing assignments for this week (optional - comment out if you want to preserve)
    # Assignment.query.filter_by(week_start_date=week_start_date).delete()
    # db.session.commit()
    
    scheduled_count = 0
    assignment_details = []
    
    for requirement in requirements:
        # Get available users for this location/time slot
        availabilities = UserAvailability.query.filter_by(
            location_id=requirement.location_id,
            time_slot_id=requirement.time_slot_id,
            week_start_date=week_start_date
        ).all()
        
        if not availabilities:
            continue
        
        # Filter candidates
        candidates = []
        for avail in availabilities:
            user_id = avail.user_id
            
            # Skip if already assigned to this exact shift
            if has_overlapping_assignment(user_id, requirement.time_slot_id, week_start_date):
                continue
            
            # Check max hours constraint
            if settings.max_hours_per_user_per_week:
                current_hours = get_user_total_hours(user_id, week_start_date)
                time_slot = TimeSlot.query.get(requirement.time_slot_id)
                additional_hours = calculate_hours(time_slot)
                if current_hours + additional_hours > settings.max_hours_per_user_per_week:
                    continue
            
            # Calculate priority score (lower is better)
            current_hours = get_user_total_hours(user_id, week_start_date)
            # Priority: fewer hours first, then higher preference
            priority = current_hours * 100 - avail.preference_level
            
            candidates.append({
                'user_id': user_id,
                'availability': avail,
                'current_hours': current_hours,
                'priority': priority
            })
        
        # Sort by priority (lower priority score = assigned first)
        candidates.sort(key=lambda x: x['priority'])
        
        # Determine how many to assign
        required = requirement.required_workers
        max_workers = settings.max_workers_per_shift
        to_assign = min(required, max_workers, len(candidates))
        
        # Create assignments
        for i in range(to_assign):
            candidate = candidates[i]
            user_id = candidate['user_id']
            
            # Double-check no overlap (race condition protection)
            if has_overlapping_assignment(user_id, requirement.time_slot_id, week_start_date):
                continue
            
            assignment = Assignment(
                user_id=user_id,
                location_id=requirement.location_id,
                time_slot_id=requirement.time_slot_id,
                week_start_date=week_start_date,
                assigned_by=None  # System assignment
            )
            db.session.add(assignment)
            scheduled_count += 1
            
            assignment_details.append({
                'user_id': user_id,
                'location_id': requirement.location_id,
                'time_slot_id': requirement.time_slot_id
            })
    
    db.session.commit()
    
    return {
        'message': f'Scheduled {scheduled_count} assignments',
        'scheduled': scheduled_count,
        'assignments': assignment_details
    }


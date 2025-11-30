from database import db
from models import (
    Assignment,
    GlobalSettings,
    Location,
    ShiftRequirement,
    TimeSlot,
    User,
    UserAvailability,
)


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
    assignments = Assignment.query.filter_by(user_id=user_id, week_start_date=week_start_date).all()

    total = 0
    for assignment in assignments:
        # Skip assignments with orphaned time slots (time slot was deleted)
        if assignment.time_slot is None:
            continue
        hours = calculate_hours(assignment.time_slot)
        total += hours

    return total


def has_overlapping_assignment(user_id, time_slot_id, location_id, week_start_date):
    """Check if user already has an assignment for the same time slot at this location"""
    existing = Assignment.query.filter_by(
        user_id=user_id,
        time_slot_id=time_slot_id,
        location_id=location_id,
        week_start_date=week_start_date,
    ).first()
    return existing is not None


def get_current_assignment_count(time_slot_id, location_id, week_start_date):
    """Get current number of workers assigned to a specific slot"""
    return Assignment.query.filter_by(
        time_slot_id=time_slot_id, location_id=location_id, week_start_date=week_start_date
    ).count()


def cleanup_orphaned_records():
    """Clean up UserAvailability and Assignment records that reference deleted time slots"""
    # Get all valid time slot IDs
    valid_slot_ids = [ts.id for ts in TimeSlot.query.all()]

    if not valid_slot_ids:
        # No time slots exist, delete all availabilities and assignments
        UserAvailability.query.delete()
        Assignment.query.delete()
        db.session.commit()
        return

    # Delete orphaned availabilities
    orphaned_avails = UserAvailability.query.filter(
        ~UserAvailability.time_slot_id.in_(valid_slot_ids)
    ).all()
    for av in orphaned_avails:
        db.session.delete(av)

    # Delete orphaned assignments
    orphaned_assigns = Assignment.query.filter(~Assignment.time_slot_id.in_(valid_slot_ids)).all()
    for a in orphaned_assigns:
        db.session.delete(a)

    if orphaned_avails or orphaned_assigns:
        db.session.commit()
        print(
            f"Cleaned up {len(orphaned_avails)} orphaned availabilities and {len(orphaned_assigns)} orphaned assignments"
        )


def run_auto_scheduler(week_start_date):
    """
    Capacity-based auto-scheduler:
    - Uses max_workers_per_shift as the default capacity for ALL slots
    - Fills slots based on who's actually available (up to capacity)
    - ShiftRequirement entries are optional overrides (for exceptions only)

    Example:
    - Global max = 3 workers per slot
    - 8am slot: only 1 person available → assign 1
    - 10am slot: 5 people available → assign 3 (capped at max)
    - 3pm slot: 0 people available → assign 0
    """
    # NOTE: We intentionally do NOT auto-delete availabilities/assignments here.
    # That cleanup utility is only for one-off maintenance, not regular runs.
    # Get global settings
    settings = GlobalSettings.query.first()
    if not settings:
        settings = GlobalSettings(max_workers_per_shift=3, max_hours_per_user_per_week=None)
        db.session.add(settings)
        db.session.commit()

    default_max = settings.max_workers_per_shift

    # Get all time slots and active locations
    time_slots = TimeSlot.query.all()
    locations = Location.query.filter_by(is_active=True).all()

    if not time_slots:
        return {"message": "No time slots configured", "scheduled": 0, "assignments": []}

    if not locations:
        return {"message": "No active locations configured", "scheduled": 0, "assignments": []}

    # Build a map of explicit capacity overrides (optional)
    requirements = ShiftRequirement.query.filter_by(week_start_date=week_start_date).all()
    override_map = {}  # key: (location_id, time_slot_id) -> max_workers
    for req in requirements:
        override_map[(req.location_id, req.time_slot_id)] = req.required_workers

    scheduled_count = 0
    assignment_details = []
    skipped_slots = 0

    for location in locations:
        for time_slot in time_slots:
            # Get max capacity: use override if exists, otherwise global default
            max_capacity = override_map.get((location.id, time_slot.id), default_max)

            if max_capacity == 0:
                skipped_slots += 1
                continue  # Explicitly blocked slot

            # Check how many are already assigned to this slot
            current_count = get_current_assignment_count(time_slot.id, location.id, week_start_date)

            # Calculate remaining capacity
            remaining_capacity = max_capacity - current_count
            if remaining_capacity <= 0:
                continue  # Slot already at capacity

            # Get available users for this location/time slot
            availabilities = UserAvailability.query.filter_by(
                location_id=location.id, time_slot_id=time_slot.id, week_start_date=week_start_date
            ).all()

            if not availabilities:
                continue

            # Filter and score candidates
            candidates = []
            for avail in availabilities:
                user_id = avail.user_id

                # Skip if already assigned to this exact shift
                if has_overlapping_assignment(user_id, time_slot.id, location.id, week_start_date):
                    continue

                # Check max hours constraint
                if settings.max_hours_per_user_per_week:
                    current_hours = get_user_total_hours(user_id, week_start_date)
                    additional_hours = calculate_hours(time_slot)
                    if current_hours + additional_hours > settings.max_hours_per_user_per_week:
                        continue

                # Calculate priority score (lower is better)
                current_hours = get_user_total_hours(user_id, week_start_date)

                # Priority formula:
                # - Prefer workers with fewer hours (load balancing)
                # - Prefer "preferred" slots (preference_level = 2) over "available" (= 1)
                # Lower score = higher priority
                priority = (current_hours * 100) - (avail.preference_level * 10)

                candidates.append(
                    {
                        "user_id": user_id,
                        "availability": avail,
                        "current_hours": current_hours,
                        "preference": avail.preference_level,
                        "priority": priority,
                    }
                )

            # Sort by priority (lower priority score = assigned first)
            candidates.sort(key=lambda x: x["priority"])

            # Assign up to remaining capacity
            to_assign = min(remaining_capacity, len(candidates))

            for i in range(to_assign):
                candidate = candidates[i]
                user_id = candidate["user_id"]

                # Double-check no overlap (race condition protection)
                if has_overlapping_assignment(user_id, time_slot.id, location.id, week_start_date):
                    continue

                assignment = Assignment(
                    user_id=user_id,
                    location_id=location.id,
                    time_slot_id=time_slot.id,
                    week_start_date=week_start_date,
                    assigned_by=None,  # System assignment
                )
                db.session.add(assignment)
                scheduled_count += 1

                # Get user name for details
                user = User.query.get(user_id)
                assignment_details.append(
                    {
                        "user_id": user_id,
                        "user_name": user.name if user else "Unknown",
                        "location_id": location.id,
                        "location_name": location.name,
                        "time_slot_id": time_slot.id,
                        "day": time_slot.get_day_name(),
                        "time": f"{time_slot.start_time.strftime('%H:%M')} - {time_slot.end_time.strftime('%H:%M')}",
                    }
                )

    db.session.commit()

    return {
        "message": f"Scheduled {scheduled_count} assignments based on availability",
        "scheduled": scheduled_count,
        "skipped_slots": skipped_slots,
        "assignments": assignment_details,
    }

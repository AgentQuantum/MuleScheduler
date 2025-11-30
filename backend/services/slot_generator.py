"""
Service for auto-generating time slots from day schedules.
Converts admin-defined day boundaries (e.g., 9am-5pm) into 30-minute interval slots.
"""

from datetime import datetime, timedelta

from database import db
from models import DaySchedule, TimeSlot


def generate_slots_for_day(day_schedule) -> list:
    """
    Generate TimeSlot records from a DaySchedule or WeeklyScheduleOverride.
    Both have: day_of_week, start_time, end_time, slot_duration_minutes

    Example: DaySchedule(Monday, 9:00, 17:00, 30min) generates:
    - 9:00-9:30, 9:30-10:00, 10:00-10:30, ..., 16:30-17:00

    Returns list of created TimeSlot objects.
    """
    created_slots = []

    # Convert times to datetime for easier manipulation
    base_date = datetime.today().date()
    start = datetime.combine(base_date, day_schedule.start_time)
    end = datetime.combine(base_date, day_schedule.end_time)
    duration = timedelta(minutes=day_schedule.slot_duration_minutes)

    current = start
    while current + duration <= end:
        slot_end = current + duration

        # Check if slot already exists for this day/time combination
        existing = TimeSlot.query.filter_by(
            day_of_week=day_schedule.day_of_week,
            start_time=current.time(),
            end_time=slot_end.time(),
        ).first()

        if not existing:
            new_slot = TimeSlot(
                day_of_week=day_schedule.day_of_week,
                start_time=current.time(),
                end_time=slot_end.time(),
            )
            db.session.add(new_slot)
            created_slots.append(new_slot)

        current = slot_end

    db.session.commit()
    return created_slots


def delete_slots_for_day(day_of_week: int) -> int:
    """
    Delete all TimeSlot records for a specific day.
    Returns count of deleted slots.
    """
    count = TimeSlot.query.filter_by(day_of_week=day_of_week).delete()
    db.session.commit()
    return count


def regenerate_slots_for_day(day_schedule) -> list:
    """
    Delete existing slots for a day and regenerate from the DaySchedule or WeeklyScheduleOverride.
    Both have: day_of_week, start_time, end_time, slot_duration_minutes.
    Returns list of newly created TimeSlot objects.
    """
    # First delete existing slots for this day
    delete_slots_for_day(day_schedule.day_of_week)

    # Then generate new slots
    return generate_slots_for_day(day_schedule)


def regenerate_all_slots() -> dict:
    """
    Clear all existing time slots and regenerate from all active DaySchedules.
    Returns summary of operations.
    """
    # Delete all existing time slots
    deleted_count = TimeSlot.query.delete()
    db.session.commit()

    # Generate new slots from each active day schedule
    schedules = DaySchedule.query.filter_by(is_active=True).all()
    total_created = 0
    slots_by_day = {}

    for schedule in schedules:
        slots = generate_slots_for_day(schedule)
        day_name = schedule.get_day_name()
        slots_by_day[day_name] = len(slots)
        total_created += len(slots)

    return {"deleted": deleted_count, "created": total_created, "by_day": slots_by_day}


def count_slots_for_day(day_of_week: int) -> int:
    """Count how many time slots exist for a given day."""
    return TimeSlot.query.filter_by(day_of_week=day_of_week).count()


def preview_slots(start_time_str: str, end_time_str: str, duration_minutes: int = 30) -> list:
    """
    Preview what slots would be generated without actually creating them.
    Useful for showing admin what slots will be created before confirming.

    Args:
        start_time_str: Start time in 'HH:MM' format
        end_time_str: End time in 'HH:MM' format
        duration_minutes: Slot duration in minutes (default 30)

    Returns list of dicts with start_time and end_time strings.
    """
    slots = []

    start = datetime.strptime(start_time_str, "%H:%M")
    end = datetime.strptime(end_time_str, "%H:%M")
    duration = timedelta(minutes=duration_minutes)

    current = start
    while current + duration <= end:
        slot_end = current + duration
        slots.append(
            {"start_time": current.strftime("%H:%M"), "end_time": slot_end.strftime("%H:%M")}
        )
        current = slot_end

    return slots

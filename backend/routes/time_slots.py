from datetime import datetime, time

from flask import Blueprint, jsonify, request

from database import db
from models import DaySchedule, TimeSlot
from routes.auth import get_current_user
from services.slot_generator import count_slots_for_day, generate_slots_for_day, preview_slots

bp = Blueprint("time_slots", __name__, url_prefix="/api/time-slots")


@bp.route("", methods=["GET"])
def get_time_slots():
    slots = TimeSlot.query.all()
    return jsonify([slot.to_dict() for slot in slots])


@bp.route("", methods=["POST"])
def create_time_slot():
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")

    # Parse time strings (format: "HH:MM" or "HH:MM:SS")
    start_time = (
        time.fromisoformat(start_time_str)
        if ":" in start_time_str
        else time.fromisoformat(start_time_str + ":00")
    )
    end_time = (
        time.fromisoformat(end_time_str)
        if ":" in end_time_str
        else time.fromisoformat(end_time_str + ":00")
    )

    time_slot = TimeSlot(
        day_of_week=data.get("day_of_week"), start_time=start_time, end_time=end_time
    )
    db.session.add(time_slot)
    db.session.commit()
    return jsonify(time_slot.to_dict()), 201


@bp.route("/<int:slot_id>", methods=["PUT"])
def update_time_slot(slot_id):
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    time_slot = TimeSlot.query.get_or_404(slot_id)
    data = request.get_json()

    if "day_of_week" in data:
        time_slot.day_of_week = data["day_of_week"]
    if "start_time" in data:
        start_time_str = data["start_time"]
        time_slot.start_time = (
            time.fromisoformat(start_time_str)
            if ":" in start_time_str
            else time.fromisoformat(start_time_str + ":00")
        )
    if "end_time" in data:
        end_time_str = data["end_time"]
        time_slot.end_time = (
            time.fromisoformat(end_time_str)
            if ":" in end_time_str
            else time.fromisoformat(end_time_str + ":00")
        )

    db.session.commit()
    return jsonify(time_slot.to_dict())


@bp.route("/<int:slot_id>", methods=["DELETE"])
def delete_time_slot(slot_id):
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    time_slot = TimeSlot.query.get_or_404(slot_id)
    db.session.delete(time_slot)
    db.session.commit()
    return jsonify({"message": "Time slot deleted"})


# ============================================================================
# DAY SCHEDULE ENDPOINTS - Auto-generate time slots from day boundaries
# ============================================================================


@bp.route("/day-schedules", methods=["GET"])
def get_day_schedules():
    """Get all day schedules with slot counts."""
    schedules = DaySchedule.query.order_by(DaySchedule.day_of_week).all()
    result = []
    for schedule in schedules:
        data = schedule.to_dict()
        data["slot_count"] = count_slots_for_day(schedule.day_of_week)
        data["day_name"] = schedule.get_day_name()
        result.append(data)
    return jsonify(result)


@bp.route("/day-schedules", methods=["POST"])
def create_day_schedule():
    """Create or update a day schedule and auto-generate time slots."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    day_of_week = data.get("day_of_week")
    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")
    slot_duration = data.get("slot_duration_minutes", 30)

    if day_of_week is None or not start_time_str or not end_time_str:
        return jsonify({"error": "day_of_week, start_time, and end_time are required"}), 400

    # Parse times
    try:
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Invalid time format. Use HH:MM"}), 400

    # Validate times
    if start_time >= end_time:
        return jsonify({"error": "End time must be after start time"}), 400

    # Check if schedule for this day already exists (global template)
    existing = DaySchedule.query.filter_by(day_of_week=day_of_week).first()

    if existing:
        # Update existing schedule
        existing.start_time = start_time
        existing.end_time = end_time
        existing.slot_duration_minutes = slot_duration
        existing.is_active = True
        db.session.commit()

        # IMPORTANT: Do NOT delete existing TimeSlot rows.
        # We only ensure that all needed slots exist for this day.
        generate_slots_for_day(existing)
        slot_count = count_slots_for_day(existing.day_of_week)

        response_data = existing.to_dict()
        response_data["slot_count"] = slot_count
        response_data["day_name"] = existing.get_day_name()
        response_data["message"] = f"Updated schedule; {slot_count} slots available for this day"
        return jsonify(response_data)

    # Create new global schedule
    schedule = DaySchedule(
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        slot_duration_minutes=slot_duration,
        is_active=True,
    )
    db.session.add(schedule)
    db.session.commit()

    # Generate time slots for this day (only adds missing ones)
    generate_slots_for_day(schedule)
    slot_count = count_slots_for_day(schedule.day_of_week)

    response_data = schedule.to_dict()
    response_data["slot_count"] = slot_count
    response_data["day_name"] = schedule.get_day_name()
    response_data["message"] = f"Created schedule with {slot_count} slots"
    return jsonify(response_data), 201


@bp.route("/day-schedules/<int:schedule_id>", methods=["PUT"])
def update_day_schedule(schedule_id):
    """Update a day schedule and regenerate its time slots."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    schedule = DaySchedule.query.get_or_404(schedule_id)
    data = request.get_json()

    # Update fields
    if "start_time" in data:
        schedule.start_time = datetime.strptime(data["start_time"], "%H:%M").time()
    if "end_time" in data:
        schedule.end_time = datetime.strptime(data["end_time"], "%H:%M").time()
    if "slot_duration_minutes" in data:
        schedule.slot_duration_minutes = data["slot_duration_minutes"]
    if "is_active" in data:
        schedule.is_active = data["is_active"]

    db.session.commit()

    # For active schedules, make sure all slots exist without deleting old ones.
    if schedule.is_active:
        generate_slots_for_day(schedule)
        slot_count = count_slots_for_day(schedule.day_of_week)
    else:
        # When deactivated, we leave existing slots in place so past weeks stay intact.
        slot_count = count_slots_for_day(schedule.day_of_week)

    response_data = schedule.to_dict()
    response_data["slot_count"] = slot_count
    response_data["day_name"] = schedule.get_day_name()
    return jsonify(response_data)


@bp.route("/day-schedules/<int:schedule_id>", methods=["DELETE"])
def delete_day_schedule(schedule_id):
    """Delete a day schedule without touching existing time slots.

    We keep TimeSlot rows so that past weeks' schedules and availabilities
    remain stable even if the admin removes the global template.
    """
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    schedule = DaySchedule.query.get_or_404(schedule_id)
    day_name = schedule.get_day_name()

    # Only delete the schedule; keep time slots for data integrity.
    db.session.delete(schedule)
    db.session.commit()

    return jsonify({"message": f"Deleted {day_name} schedule; existing time slots preserved"})


@bp.route("/day-schedules/preview", methods=["POST"])
def preview_day_slots():
    """Preview what slots would be generated without creating them."""
    data = request.get_json()
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    duration = data.get("slot_duration_minutes", 30)

    if not start_time or not end_time:
        return jsonify({"error": "start_time and end_time are required"}), 400

    try:
        slots = preview_slots(start_time, end_time, duration)
        return jsonify({"slot_count": len(slots), "slots": slots})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@bp.route("/day-schedules/regenerate-all", methods=["POST"])
def regenerate_all_time_slots():
    """
    Regenerate all time slots from day schedules.
    This cleans up stale/manually-created slots and ensures only
    auto-generated slots from DaySchedules exist.
    """
    from services.slot_generator import regenerate_all_slots

    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    result = regenerate_all_slots()
    return jsonify(
        {
            "message": f'Cleaned up {result["deleted"]} old slots and created {result["created"]} new slots',
            **result,
        }
    )

from datetime import datetime, time

from flask import Blueprint, jsonify, request

from database import db
from models import DaySchedule, WeeklyScheduleOverride
from routes.auth import get_current_user

bp = Blueprint("weekly_overrides", __name__, url_prefix="/api/weekly-overrides")


@bp.route("", methods=["GET"])
def get_weekly_overrides():
    """Get weekly overrides for a specific week."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    week_start = request.args.get("week_start")
    if not week_start:
        return jsonify({"error": "week_start parameter required"}), 400

    week_start_date = datetime.fromisoformat(week_start).date()
    overrides = (
        WeeklyScheduleOverride.query.filter_by(week_start_date=week_start_date)
        .order_by(WeeklyScheduleOverride.day_of_week)
        .all()
    )

    result = []
    for override in overrides:
        data = override.to_dict()
        data["day_name"] = override.get_day_name()
        result.append(data)

    return jsonify(result)


@bp.route("", methods=["POST"])
def create_weekly_override():
    """Create or update a weekly override for a specific day."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    week_start_date = datetime.fromisoformat(data.get("week_start_date")).date()
    day_of_week = data.get("day_of_week")

    # Check if override already exists
    existing = WeeklyScheduleOverride.query.filter_by(
        week_start_date=week_start_date, day_of_week=day_of_week
    ).first()

    start_time_str = data.get("start_time")
    end_time_str = data.get("end_time")
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

    if existing:
        existing.start_time = start_time
        existing.end_time = end_time
        existing.slot_duration_minutes = data.get("slot_duration_minutes", 30)
        existing.is_active = data.get("is_active", True)
        db.session.commit()

        # NOTE: We no longer regenerate TimeSlot records here.
        # Time slots are global (same grid every week). Weekly overrides now only
        # control which days are considered "configured" for a specific week.
        result = existing.to_dict()
        result["day_name"] = existing.get_day_name()
        return jsonify(result)

    override = WeeklyScheduleOverride(
        week_start_date=week_start_date,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        slot_duration_minutes=data.get("slot_duration_minutes", 30),
        is_active=data.get("is_active", True),
    )
    db.session.add(override)
    db.session.commit()

    # See note above – we keep global TimeSlot rows untouched.
    result = override.to_dict()
    result["day_name"] = override.get_day_name()
    return jsonify(result), 201


@bp.route("/<int:override_id>", methods=["PUT"])
def update_weekly_override(override_id):
    """Update a weekly override."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    override = WeeklyScheduleOverride.query.get_or_404(override_id)
    data = request.get_json()

    if "start_time" in data:
        start_time_str = data["start_time"]
        override.start_time = (
            time.fromisoformat(start_time_str)
            if ":" in start_time_str
            else time.fromisoformat(start_time_str + ":00")
        )
    if "end_time" in data:
        end_time_str = data["end_time"]
        override.end_time = (
            time.fromisoformat(end_time_str)
            if ":" in end_time_str
            else time.fromisoformat(end_time_str + ":00")
        )
    if "slot_duration_minutes" in data:
        override.slot_duration_minutes = data["slot_duration_minutes"]
    if "is_active" in data:
        override.is_active = data["is_active"]

    db.session.commit()

    result = override.to_dict()
    result["day_name"] = override.get_day_name()
    return jsonify(result)


@bp.route("/<int:override_id>", methods=["DELETE"])
def delete_weekly_override(override_id):
    """Delete a weekly override (revert to standard week)."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    override = WeeklyScheduleOverride.query.get_or_404(override_id)
    db.session.delete(override)
    db.session.commit()

    # TimeSlot records are left untouched – only weekly config changes.
    return jsonify({"message": "Override deleted, reverted to standard week"})


@bp.route("/create-from-standard", methods=["POST"])
def create_override_from_standard():
    """Create overrides for all days in a week from the standard week template."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    week_start_date = datetime.fromisoformat(data.get("week_start_date")).date()

    # Get all standard day schedules
    standard_schedules = (
        DaySchedule.query.filter_by(is_active=True).order_by(DaySchedule.day_of_week).all()
    )

    created_overrides = []
    for schedule in standard_schedules:
        # Check if override already exists
        existing = WeeklyScheduleOverride.query.filter_by(
            week_start_date=week_start_date, day_of_week=schedule.day_of_week
        ).first()

        if existing:
            # Update existing
            existing.start_time = schedule.start_time
            existing.end_time = schedule.end_time
            existing.slot_duration_minutes = schedule.slot_duration_minutes
            existing.is_active = schedule.is_active
            created_overrides.append(existing)
        else:
            # Create new override
            override = WeeklyScheduleOverride(
                week_start_date=week_start_date,
                day_of_week=schedule.day_of_week,
                start_time=schedule.start_time,
                end_time=schedule.end_time,
                slot_duration_minutes=schedule.slot_duration_minutes,
                is_active=schedule.is_active,
            )
            db.session.add(override)
            created_overrides.append(override)

    db.session.commit()

    result = []
    for override in created_overrides:
        data = override.to_dict()
        data["day_name"] = override.get_day_name()
        result.append(data)

    return jsonify(result), 201


@bp.route("/delete-week", methods=["DELETE"])
def delete_week_overrides():
    """Delete all overrides for a specific week (revert entire week to standard)."""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    week_start = request.args.get("week_start")
    if not week_start:
        return jsonify({"error": "week_start parameter required"}), 400

    week_start_date = datetime.fromisoformat(week_start).date()
    overrides = WeeklyScheduleOverride.query.filter_by(week_start_date=week_start_date).all()

    for override in overrides:
        db.session.delete(override)

    db.session.commit()

    # TimeSlot grid stays global; only per-week overrides are cleared.
    return jsonify({"message": f"Deleted {len(overrides)} overrides, reverted to standard week"})

from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from database import db
from models import Assignment, GlobalSettings, Location, TimeSlot, User, UserAvailability
from routes.auth import get_current_user
from services.scheduler import run_auto_scheduler

bp = Blueprint("assignments", __name__, url_prefix="/api/assignments")


@bp.route("", methods=["GET"])
def get_assignments():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    week_start = request.args.get("week_start")
    if not week_start:
        return jsonify({"error": "week_start parameter is required"}), 400

    week_start_date = datetime.fromisoformat(week_start).date()

    query = Assignment.query.filter_by(week_start_date=week_start_date)

    # If user is not admin, only show their assignments
    if user.role != "admin":
        query = query.filter_by(user_id=user.id)
    else:
        # Admin can filter by user_id or location_id
        user_id = request.args.get("user_id")
        location_id = request.args.get("location_id")
        if user_id:
            query = query.filter_by(user_id=user_id)
        if location_id:
            query = query.filter_by(location_id=location_id)

    assignments = query.all()
    return jsonify([a.to_dict() for a in assignments])


@bp.route("", methods=["POST"])
def create_assignment():
    """Create a new shift assignment"""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ["user_id", "location_id", "time_slot_id", "week_start_date"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400

    week_start_date = datetime.fromisoformat(data.get("week_start_date")).date()

    # Validate max workers per shift
    settings = GlobalSettings.query.first()
    max_workers = settings.max_workers_per_shift if settings else 3

    current_count = Assignment.query.filter(
        Assignment.location_id == data["location_id"],
        Assignment.time_slot_id == data["time_slot_id"],
        Assignment.week_start_date == week_start_date,
    ).count()

    if current_count >= max_workers:
        return (
            jsonify(
                {
                    "error": "OVER_MAX_WORKERS",
                    "message": f"Maximum {max_workers} workers already scheduled in that slot",
                }
            ),
            400,
        )

    # Check for overlapping shifts for the user
    overlapping = Assignment.query.filter(
        Assignment.user_id == data["user_id"],
        Assignment.week_start_date == week_start_date,
        Assignment.time_slot_id == data["time_slot_id"],
    ).first()

    if overlapping:
        return (
            jsonify(
                {
                    "error": "OVERLAP_FOR_USER",
                    "message": "This worker is already scheduled at that time",
                }
            ),
            400,
        )

    # Create assignment
    assignment = Assignment(
        user_id=data["user_id"],
        location_id=data["location_id"],
        time_slot_id=data["time_slot_id"],
        week_start_date=week_start_date,
        assigned_by=user.id,
    )

    db.session.add(assignment)
    db.session.commit()

    return jsonify(assignment.to_dict()), 201


@bp.route("/run-scheduler", methods=["POST"])
def run_scheduler():
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    if not data or not data.get("week_start_date"):
        return jsonify({"error": "week_start_date is required"}), 400

    try:
        week_start_date = datetime.fromisoformat(data.get("week_start_date")).date()
    except (ValueError, TypeError) as e:  # pragma: no cover
        return jsonify({"error": f"Invalid week_start_date format: {str(e)}"}), 400

    try:
        result = run_auto_scheduler(week_start_date)
        return jsonify(result)
    except Exception as e:  # pragma: no cover
        import traceback

        traceback.print_exc()
        return jsonify({"error": f"Scheduler failed: {str(e)}"}), 500


@bp.route("/<int:assignment_id>", methods=["PUT"])
def update_assignment(assignment_id):
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    assignment = Assignment.query.get_or_404(assignment_id)
    data = request.get_json()

    # Update assigned user
    if "user_id" in data:
        assignment.user_id = data["user_id"]
        assignment.assigned_by = user.id

    # Update location and/or time slot for this assignment (without moving weeks)
    if "location_id" in data or "time_slot_id" in data:
        new_location_id = data.get("location_id", assignment.location_id)
        new_time_slot_id = data.get("time_slot_id", assignment.time_slot_id)

        # Validate location and time slot exist
        new_location = Location.query.get(new_location_id)
        new_time_slot = TimeSlot.query.get(new_time_slot_id)
        if not new_location or not new_time_slot:
            return jsonify({"error": "Location or time slot not found"}), 404

        # Validate overlapping shift for the same user (exclude current assignment)
        overlapping = Assignment.query.filter(
            Assignment.user_id == assignment.user_id,
            Assignment.id != assignment.id,
            Assignment.week_start_date == assignment.week_start_date,
            Assignment.time_slot_id == new_time_slot_id,
        ).first()
        if overlapping:
            return (
                jsonify(
                    {
                        "error": "OVERLAP_FOR_USER",
                        "message": "This worker is already scheduled at that time",
                    }
                ),
                400,
            )

        # Validate max workers per shift (exclude current assignment)
        settings = GlobalSettings.query.first()
        max_workers = settings.max_workers_per_shift if settings else 3
        current_count = Assignment.query.filter(
            Assignment.location_id == new_location_id,
            Assignment.time_slot_id == new_time_slot_id,
            Assignment.week_start_date == assignment.week_start_date,
            Assignment.id != assignment.id,
        ).count()

        if current_count >= max_workers:
            return (
                jsonify(
                    {
                        "error": "OVER_MAX_WORKERS",
                        "message": f"Maximum {max_workers} workers already scheduled in that slot",
                    }
                ),
                400,
            )

        assignment.location_id = new_location_id
        assignment.location = new_location  # keep relationship in sync
        assignment.time_slot_id = new_time_slot_id
        assignment.time_slot = new_time_slot  # keep relationship in sync
        assignment.assigned_by = user.id

    db.session.commit()
    return jsonify(assignment.to_dict())


@bp.route("/<int:assignment_id>/move", methods=["PUT"])
def move_assignment(assignment_id):
    """
    Move an assignment to a new time slot/location with validation.
    Validates max workers per shift and no overlapping shifts for the user.
    """
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    assignment = Assignment.query.get_or_404(assignment_id)
    data = request.get_json()

    new_start_str = data.get("new_start")
    new_end_str = data.get("new_end")
    new_time_slot_id = data.get("new_time_slot_id")
    new_location_id = data.get(
        "new_location_id", assignment.location_id
    )  # Default to current location

    if not all([new_start_str, new_end_str]):
        return jsonify({"error": "new_start and new_end are required"}), 400

    try:
        new_start = datetime.fromisoformat(new_start_str.replace("Z", "+00:00"))
        new_end = datetime.fromisoformat(new_end_str.replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"error": "Invalid datetime format"}), 400

    # Find the time slot that matches the new datetime
    if new_time_slot_id:
        new_time_slot = TimeSlot.query.get(new_time_slot_id)
        if not new_time_slot:
            return jsonify({"error": "Time slot not found"}), 404
    else:
        # Try to find matching time slot from datetime
        day_of_week = new_start.weekday()  # 0 = Monday
        new_time_slot = TimeSlot.query.filter_by(
            day_of_week=day_of_week, start_time=new_start.time(), end_time=new_end.time()
        ).first()

        if not new_time_slot:  # pragma: no branch
            # Find closest matching time slot by day and time range
            new_time_slot = TimeSlot.query.filter_by(day_of_week=day_of_week).first()
            if not new_time_slot:  # pragma: no cover
                return jsonify({"error": "No matching time slot found"}), 404
            new_time_slot_id = new_time_slot.id

    # Validate the new location exists
    new_location = Location.query.get(new_location_id)
    if not new_location:
        return jsonify({"error": "Location not found"}), 404

    # Calculate new week_start_date (Monday of the week containing new_start)
    new_week_start = new_start.date() - timedelta(days=new_start.weekday())

    # Validate: Check for overlapping shifts for this user (excluding current assignment)
    overlapping = Assignment.query.filter(
        Assignment.user_id == assignment.user_id,
        Assignment.id != assignment.id,
        Assignment.week_start_date == new_week_start,
        Assignment.time_slot_id == new_time_slot_id,
    ).first()

    if overlapping:
        return (
            jsonify(
                {
                    "error": "OVERLAP_FOR_USER",
                    "message": "This worker is already scheduled at that time",
                }
            ),
            400,
        )

    # Validate: Check max workers per shift
    settings = GlobalSettings.query.first()
    max_workers = settings.max_workers_per_shift if settings else 3

    current_count = Assignment.query.filter(
        Assignment.location_id == new_location_id,
        Assignment.time_slot_id == new_time_slot_id,
        Assignment.week_start_date == new_week_start,
        Assignment.id != assignment.id,  # Exclude current assignment
    ).count()

    if current_count >= max_workers:
        return (
            jsonify(
                {
                    "error": "OVER_MAX_WORKERS",
                    "message": f"Maximum {max_workers} workers already scheduled in that slot",
                }
            ),
            400,
        )

    # Update assignment
    assignment.time_slot_id = new_time_slot_id
    assignment.time_slot = new_time_slot  # keep relationship in sync
    assignment.location_id = new_location_id
    assignment.location = new_location  # keep relationship in sync
    assignment.week_start_date = new_week_start
    assignment.assigned_by = user.id

    db.session.commit()
    return jsonify(assignment.to_dict())


@bp.route("/<int:assignment_id>", methods=["DELETE"])
def delete_assignment(assignment_id):
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    assignment = Assignment.query.get_or_404(assignment_id)
    db.session.delete(assignment)
    db.session.commit()
    return jsonify({"message": "Assignment deleted"})


@bp.route("/available-workers", methods=["GET"])
def get_available_workers():
    """Get workers available for a specific location, time slot, and week"""
    user = get_current_user(request)
    if not user or user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    location_id = request.args.get("location_id")
    time_slot_id = request.args.get("time_slot_id")
    week_start = request.args.get("week_start")

    if not all([location_id, time_slot_id, week_start]):
        return jsonify({"error": "location_id, time_slot_id, and week_start are required"}), 400

    week_start_date = datetime.fromisoformat(week_start).date()

    # Get users who marked themselves as available
    availabilities = UserAvailability.query.filter_by(
        location_id=location_id, time_slot_id=time_slot_id, week_start_date=week_start_date
    ).all()

    # Get the time slot to check for overlaps
    time_slot = TimeSlot.query.get(time_slot_id)
    if not time_slot:
        return jsonify({"error": "Time slot not found"}), 404

    # Filter out users who already have overlapping assignments
    available_user_ids = [av.user_id for av in availabilities]
    overlapping_assignments = Assignment.query.filter(
        Assignment.week_start_date == week_start_date,
        Assignment.user_id.in_(available_user_ids),
        Assignment.time_slot_id == time_slot_id,  # Same time slot = overlap
    ).all()

    assigned_user_ids = {a.user_id for a in overlapping_assignments}
    available_user_ids = [uid for uid in available_user_ids if uid not in assigned_user_ids]

    available_users = User.query.filter(User.id.in_(available_user_ids)).all()
    return jsonify([u.to_dict() for u in available_users])

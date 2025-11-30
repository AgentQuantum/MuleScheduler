from datetime import datetime

from flask import Blueprint, jsonify, request

from database import db
from models import UserAvailability
from routes.auth import get_current_user

bp = Blueprint("availability", __name__, url_prefix="/api/availability")


@bp.route("", methods=["GET"])
def get_availability():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    week_start = request.args.get("week_start")
    query = UserAvailability.query.filter_by(user_id=user.id)

    if week_start:
        week_start_date = datetime.fromisoformat(week_start).date()
        query = query.filter_by(week_start_date=week_start_date)

    availabilities = query.all()
    return jsonify([av.to_dict() for av in availabilities])


@bp.route("", methods=["POST"])
def create_availability():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    week_start_date = datetime.fromisoformat(data.get("week_start_date")).date()

    # Check if availability already exists
    existing = UserAvailability.query.filter_by(
        user_id=user.id,
        location_id=data.get("location_id"),
        time_slot_id=data.get("time_slot_id"),
        week_start_date=week_start_date,
    ).first()

    if existing:
        existing.preference_level = data.get("preference_level", 1)
        db.session.commit()
        return jsonify(existing.to_dict())

    availability = UserAvailability(
        user_id=user.id,
        location_id=data.get("location_id"),
        time_slot_id=data.get("time_slot_id"),
        week_start_date=week_start_date,
        preference_level=data.get("preference_level", 1),
    )
    db.session.add(availability)
    db.session.commit()
    return jsonify(availability.to_dict()), 201


@bp.route("/batch", methods=["POST"])
def create_availability_batch():
    """Create/update multiple availability entries at once"""
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    week_start_date = datetime.fromisoformat(data.get("week_start_date")).date()
    entries = data.get("entries", [])

    results = []
    for entry in entries:
        existing = UserAvailability.query.filter_by(
            user_id=user.id,
            location_id=entry.get("location_id"),
            time_slot_id=entry.get("time_slot_id"),
            week_start_date=week_start_date,
        ).first()

        if existing:
            existing.preference_level = entry.get("preference_level", 1)
            results.append(existing.to_dict())
        else:
            availability = UserAvailability(
                user_id=user.id,
                location_id=entry.get("location_id"),
                time_slot_id=entry.get("time_slot_id"),
                week_start_date=week_start_date,
                preference_level=entry.get("preference_level", 1),
            )
            db.session.add(availability)
            results.append(availability.to_dict())

    db.session.commit()
    return jsonify(results), 201

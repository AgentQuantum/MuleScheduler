import os
import uuid
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request
from werkzeug.utils import secure_filename

from database import db
from models import User
from routes.auth import get_current_user

bp = Blueprint("users", __name__, url_prefix="/api/users")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route("/me", methods=["GET"])
def get_me():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    return jsonify(user.to_dict())


@bp.route("/me", methods=["PUT"])
def update_me():
    """Update current user's profile"""
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    # Handle file upload if present
    if "profile_picture" in request.files:
        file = request.files["profile_picture"]
        # Check if file was actually selected (not empty)
        if file and file.filename and file.filename.strip() and allowed_file(file.filename):
            # Delete old profile picture if exists
            if user.profile_picture_url:
                old_filename = user.profile_picture_url.split("/")[-1]
                old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], old_filename)
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass  # Ignore errors deleting old file

            # Generate unique filename
            ext = file.filename.rsplit(".", 1)[1].lower()
            filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
            filename = secure_filename(filename)
            filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            user.profile_picture_url = f"/uploads/profile_pictures/{filename}"

    # Handle profile picture removal (if "remove_picture" is sent)
    if request.is_json and request.get_json().get("remove_picture") is True:
        if user.profile_picture_url:
            old_filename = user.profile_picture_url.split("/")[-1]
            old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], old_filename)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass
            user.profile_picture_url = None
    elif request.form and request.form.get("remove_picture") == "true":
        if user.profile_picture_url:
            old_filename = user.profile_picture_url.split("/")[-1]
            old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], old_filename)
            if os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except Exception:
                    pass
            user.profile_picture_url = None

    # Handle JSON data for other fields
    if request.is_json:
        data = request.get_json()
        if "bio" in data:
            user.bio = data["bio"]
        if "class_year" in data:
            # Only allow class_year for students
            if user.role == "user":
                user.class_year = data["class_year"]
            else:
                # Admins can't have class year
                user.class_year = None
    elif request.form:
        # Handle form data
        if "bio" in request.form:
            user.bio = request.form["bio"]
        if "class_year" in request.form:
            if user.role == "user":
                try:
                    user.class_year = (
                        int(request.form["class_year"]) if request.form["class_year"] else None
                    )
                except (ValueError, TypeError):
                    user.class_year = None
            else:
                user.class_year = None

    db.session.commit()
    return jsonify(user.to_dict())


@bp.route("", methods=["GET"])
def get_users():
    user = get_current_user(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    if user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

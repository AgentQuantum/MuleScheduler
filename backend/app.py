import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS

# Load environment variables from .env file
load_dotenv()

from database import db

app = Flask(__name__)
# Database configuration - use PostgreSQL on Heroku, SQLite locally
database_url = os.environ.get("DATABASE_URL", "sqlite:///scheduler.db")
# Heroku provides postgres:// but SQLAlchemy needs postgresql://
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads", "profile_pictures")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5MB max file size

# Create uploads directory if it doesn't exist
Path(app.config["UPLOAD_FOLDER"]).mkdir(parents=True, exist_ok=True)

# CORS configuration - allow frontend origin from env or default
frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
allowed_origins = [frontend_origin, "http://localhost:5173", "http://localhost:3000"]
db.init_app(app)
CORS(app, origins=allowed_origins)

# Import models (must be after db is created)
from models import (
    Assignment,
    DaySchedule,
    GlobalSettings,
    Location,
    ShiftRequirement,
    TimeSlot,
    User,
    UserAvailability,
    WeeklyScheduleOverride,
)

# Import routes
from routes import (
    assignments,
    auth,
    availability,
    locations,
    settings,
    shift_requirements,
    time_slots,
    users,
    weekly_overrides,
)

# Register blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(users.bp)
app.register_blueprint(locations.bp)
app.register_blueprint(time_slots.bp)
app.register_blueprint(settings.bp)
app.register_blueprint(shift_requirements.bp)
app.register_blueprint(availability.bp)
app.register_blueprint(assignments.bp)
app.register_blueprint(weekly_overrides.bp)


@app.route("/uploads/profile_pictures/<filename>")
def serve_profile_picture(filename):
    """Serve uploaded profile pictures"""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


def init_db():
    """Initialize database tables and default data"""
    db.create_all()
    # Initialize global settings if not exists
    if GlobalSettings.query.first() is None:
        default_settings = GlobalSettings(max_workers_per_shift=3, max_hours_per_user_per_week=None)
        db.session.add(default_settings)
        db.session.commit()

    # Seed demo accounts (for development and demo purposes)
    demo_accounts = [
        {"email": "admin@colby.edu", "name": "Demo Admin", "role": "admin"},
        {"email": "student.one@colby.edu", "name": "Student One", "role": "user"},
        {"email": "student.two@colby.edu", "name": "Student Two", "role": "user"},
        {"email": "student.three@colby.edu", "name": "Student Three", "role": "user"},
    ]

    for account in demo_accounts:
        existing = User.query.filter_by(email=account["email"]).first()
        if not existing:
            user = User(
                name=account["name"],
                email=account["email"],
                role=account["role"],
            )
            db.session.add(user)

    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000)

# CI/CD: Tests and coverage enforced via GitHub Actions

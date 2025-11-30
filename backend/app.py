import os

from flask import Flask
from flask_cors import CORS

from database import db

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///scheduler.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

db.init_app(app)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

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


def init_db():
    """Initialize database tables and default data"""
    db.create_all()
    # Initialize global settings if not exists
    if GlobalSettings.query.first() is None:
        default_settings = GlobalSettings(max_workers_per_shift=3, max_hours_per_user_per_week=None)
        db.session.add(default_settings)
        db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000)

# CI/CD: Tests and coverage enforced via GitHub Actions

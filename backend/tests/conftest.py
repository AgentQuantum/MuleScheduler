"""
Pytest configuration and fixtures for MuleScheduler tests.

This file adds the backend directory to sys.path so that imports work
correctly in CI environments.
"""

import os
import sys

import pytest

# Resolve the absolute path to the backend directory and add it to sys.path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from datetime import time

# Now we can import from backend modules normally
from app import app, db
from models import GlobalSettings, Location, TimeSlot, User


@pytest.fixture
def test_app():
    """Create a test Flask application."""
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "test-secret-key"

    with app.app_context():
        db.create_all()
        if GlobalSettings.query.first() is None:
            default_settings = GlobalSettings(
                max_workers_per_shift=3, max_hours_per_user_per_week=None
            )
            db.session.add(default_settings)
            db.session.commit()
        yield app
        db.drop_all()


@pytest.fixture
def client(test_app):
    """Create a test client for making requests."""
    return test_app.test_client()


@pytest.fixture
def test_user(test_app):
    """Create a test user and return user data dict."""
    with test_app.app_context():
        user = User(name="Test User", email="test@colby.edu", role="user")
        db.session.add(user)
        db.session.commit()
        # Return a dict to avoid DetachedInstanceError
        return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


@pytest.fixture
def test_admin(test_app):
    """Create a test admin user and return admin data dict."""
    with test_app.app_context():
        # Check if admin already exists (e.g., from demo seeding)
        existing = User.query.filter_by(email="admin@colby.edu").first()
        if existing:
            return {
                "id": existing.id,
                "name": existing.name,
                "email": existing.email,
                "role": existing.role,
            }
        admin = User(name="Test Admin", email="admin@colby.edu", role="admin")
        db.session.add(admin)
        db.session.commit()
        return {"id": admin.id, "name": admin.name, "email": admin.email, "role": admin.role}


@pytest.fixture
def test_location(test_app):
    """Create a test location and return location data dict."""
    with test_app.app_context():
        location = Location(name="Test Location", description="A test location", is_active=True)
        db.session.add(location)
        db.session.commit()
        return {
            "id": location.id,
            "name": location.name,
            "description": location.description,
            "is_active": location.is_active,
        }


@pytest.fixture
def test_time_slot(test_app):
    """Create a test time slot (Monday, 9am-5pm) and return data dict."""
    with test_app.app_context():
        time_slot = TimeSlot(day_of_week=0, start_time=time(9, 0), end_time=time(17, 0))
        db.session.add(time_slot)
        db.session.commit()
        return {
            "id": time_slot.id,
            "day_of_week": time_slot.day_of_week,
            "start_time": time_slot.start_time.strftime("%H:%M:%S"),
            "end_time": time_slot.end_time.strftime("%H:%M:%S"),
        }


@pytest.fixture
def auth_token(client, test_user):
    """Get a test auth token for a test user via /api/auth/test-token."""
    response = client.post(
        "/api/auth/test-token", json={"email": test_user["email"], "name": test_user["name"]}
    )
    data = response.get_json()
    return data["token"]


@pytest.fixture
def admin_token(client, test_admin):
    """Get a test auth token for a test admin via /api/auth/test-token."""
    response = client.post(
        "/api/auth/test-token", json={"email": test_admin["email"], "name": test_admin["name"]}
    )
    data = response.get_json()
    return data["token"]

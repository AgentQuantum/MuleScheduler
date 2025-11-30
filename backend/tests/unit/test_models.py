"""
Unit tests for database models.
"""

from datetime import datetime, time

import pytest

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


class TestUser:
    """Test User model."""

    def test_user_creation(self, test_app):
        """Test creating a user."""
        with test_app.app_context():
            user = User(name="John Doe", email="john@colby.edu", role="user")
            assert user.name == "John Doe"
            assert user.email == "john@colby.edu"
            assert user.role == "user"

    def test_user_to_dict(self, test_app):
        """Test user serialization."""
        with test_app.app_context():
            user = User(name="Jane Doe", email="jane@colby.edu", role="admin")
            db.session.add(user)
            db.session.commit()

            user_dict = user.to_dict()
            assert user_dict["name"] == "Jane Doe"
            assert user_dict["email"] == "jane@colby.edu"
            assert user_dict["role"] == "admin"
            assert "id" in user_dict
            assert "created_at" in user_dict

    def test_user_email_unique(self, test_app):
        """Test that user emails must be unique."""
        with test_app.app_context():
            user1 = User(name="User 1", email="test@colby.edu", role="user")
            user2 = User(name="User 2", email="test@colby.edu", role="user")

            db.session.add(user1)
            db.session.commit()

            db.session.add(user2)
            with pytest.raises(Exception):  # Should raise IntegrityError
                db.session.commit()


class TestLocation:
    """Test Location model."""

    def test_location_creation(self, test_app):
        """Test creating a location."""
        with test_app.app_context():
            location = Location(name="Library", description="Main library", is_active=True)
            assert location.name == "Library"
            assert location.description == "Main library"
            assert location.is_active is True

    def test_location_to_dict(self, test_app):
        """Test location serialization."""
        with test_app.app_context():
            location = Location(name="Cafeteria", description="Dining hall")
            db.session.add(location)
            db.session.commit()

            loc_dict = location.to_dict()
            assert loc_dict["name"] == "Cafeteria"
            assert loc_dict["description"] == "Dining hall"
            assert loc_dict["is_active"] is True


class TestTimeSlot:
    """Test TimeSlot model."""

    def test_time_slot_creation(self, test_app):
        """Test creating a time slot."""
        with test_app.app_context():
            slot = TimeSlot(day_of_week=0, start_time=time(9, 0), end_time=time(17, 0))  # Monday
            assert slot.day_of_week == 0
            assert slot.start_time == time(9, 0)
            assert slot.end_time == time(17, 0)

    def test_time_slot_to_dict(self, test_app):
        """Test time slot serialization."""
        with test_app.app_context():
            slot = TimeSlot(day_of_week=1, start_time=time(10, 0), end_time=time(14, 0))
            db.session.add(slot)
            db.session.commit()

            slot_dict = slot.to_dict()
            assert slot_dict["day_of_week"] == 1
            assert slot_dict["start_time"] == "10:00:00"
            assert slot_dict["end_time"] == "14:00:00"

    def test_get_day_name(self, test_app):
        """Test day name helper."""
        with test_app.app_context():
            slot = TimeSlot(day_of_week=0, start_time=time(9, 0), end_time=time(17, 0))
            assert slot.get_day_name() == "Monday"

            slot.day_of_week = 4
            assert slot.get_day_name() == "Friday"


class TestGlobalSettings:
    """Test GlobalSettings model."""

    def test_global_settings_creation(self, test_app):
        """Test creating global settings."""
        with test_app.app_context():
            settings = GlobalSettings(max_workers_per_shift=5, max_hours_per_user_per_week=20)
            assert settings.max_workers_per_shift == 5
            assert settings.max_hours_per_user_per_week == 20

    def test_global_settings_to_dict(self, test_app):
        """Test global settings serialization."""
        with test_app.app_context():
            settings = GlobalSettings(max_workers_per_shift=3)
            db.session.add(settings)
            db.session.commit()

            settings_dict = settings.to_dict()
            assert settings_dict["max_workers_per_shift"] == 3
            assert "max_hours_per_user_per_week" in settings_dict

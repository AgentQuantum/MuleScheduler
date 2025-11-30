"""
Comprehensive tests for weekly overrides routes.
Tests CRUD operations for /api/weekly-overrides endpoints.
"""

from datetime import date, time

import pytest

from app import app, db
from models import DaySchedule, WeeklyScheduleOverride


class TestGetWeeklyOverrides:
    """Tests for GET /api/weekly-overrides endpoint."""

    def test_get_weekly_overrides_as_admin(self, client, admin_token):
        """Admin can get weekly overrides."""
        response = client.get(
            "/api/weekly-overrides?week_start=2024-01-01",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_weekly_overrides_as_user_forbidden(self, client, auth_token):
        """Regular user cannot get weekly overrides."""
        response = client.get(
            "/api/weekly-overrides?week_start=2024-01-01",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_get_weekly_overrides_missing_week_start(self, client, admin_token):
        """Missing week_start returns 400."""
        response = client.get(
            "/api/weekly-overrides", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400


class TestCreateWeeklyOverride:
    """Tests for POST /api/weekly-overrides endpoint."""

    def test_create_weekly_override_as_admin(self, client, admin_token):
        """Admin can create weekly override."""
        response = client.post(
            "/api/weekly-overrides",
            json={
                "week_start_date": "2024-02-01",
                "day_of_week": 1,
                "start_time": "09:00",
                "end_time": "17:00",
                "slot_duration_minutes": 30,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["day_of_week"] == 1
        assert "day_name" in data

    def test_create_weekly_override_as_user_forbidden(self, client, auth_token):
        """Regular user cannot create weekly override."""
        response = client.post(
            "/api/weekly-overrides",
            json={
                "week_start_date": "2024-02-01",
                "day_of_week": 1,
                "start_time": "09:00",
                "end_time": "17:00",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_create_weekly_override_updates_existing(self, client, admin_token):
        """Creating override for existing day/week updates it."""
        # Create first
        response1 = client.post(
            "/api/weekly-overrides",
            json={
                "week_start_date": "2024-03-01",
                "day_of_week": 2,
                "start_time": "09:00",
                "end_time": "17:00",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response1.status_code == 201

        # Create again - should update
        response2 = client.post(
            "/api/weekly-overrides",
            json={
                "week_start_date": "2024-03-01",
                "day_of_week": 2,
                "start_time": "10:00",
                "end_time": "18:00",
                "is_active": False,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response2.status_code == 200

    def test_create_weekly_override_with_seconds(self, client, admin_token):
        """Override can be created with seconds in time format."""
        response = client.post(
            "/api/weekly-overrides",
            json={
                "week_start_date": "2024-04-01",
                "day_of_week": 3,
                "start_time": "09:00:00",
                "end_time": "17:00:00",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201


class TestUpdateWeeklyOverride:
    """Tests for PUT /api/weekly-overrides/<id> endpoint."""

    def test_update_weekly_override_as_admin(self, test_app, admin_token):
        """Admin can update weekly override."""
        with test_app.app_context():
            override = WeeklyScheduleOverride(
                week_start_date=date(2024, 5, 1),
                day_of_week=4,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        client = test_app.test_client()
        response = client.put(
            f"/api/weekly-overrides/{override_id}",
            json={"start_time": "10:00", "is_active": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["is_active"] is False

    def test_update_weekly_override_all_fields(self, test_app, admin_token):
        """Admin can update all fields."""
        with test_app.app_context():
            override = WeeklyScheduleOverride(
                week_start_date=date(2024, 5, 8),
                day_of_week=5,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        client = test_app.test_client()
        response = client.put(
            f"/api/weekly-overrides/{override_id}",
            json={
                "start_time": "08:00",
                "end_time": "18:00",
                "slot_duration_minutes": 60,
                "is_active": True,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

    def test_update_weekly_override_as_user_forbidden(self, test_app, auth_token):
        """Regular user cannot update weekly override."""
        with test_app.app_context():
            override = WeeklyScheduleOverride(
                week_start_date=date(2024, 5, 15),
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        client = test_app.test_client()
        response = client.put(
            f"/api/weekly-overrides/{override_id}",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_update_nonexistent_override(self, client, admin_token):
        """Updating nonexistent override returns 404."""
        response = client.put(
            "/api/weekly-overrides/99999",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestDeleteWeeklyOverride:
    """Tests for DELETE /api/weekly-overrides/<id> endpoint."""

    def test_delete_weekly_override_as_admin(self, test_app, admin_token):
        """Admin can delete weekly override."""
        with test_app.app_context():
            override = WeeklyScheduleOverride(
                week_start_date=date(2024, 6, 1),
                day_of_week=1,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        client = test_app.test_client()
        response = client.delete(
            f"/api/weekly-overrides/{override_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

    def test_delete_weekly_override_as_user_forbidden(self, test_app, auth_token):
        """Regular user cannot delete weekly override."""
        with test_app.app_context():
            override = WeeklyScheduleOverride(
                week_start_date=date(2024, 6, 8),
                day_of_week=2,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        client = test_app.test_client()
        response = client.delete(
            f"/api/weekly-overrides/{override_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_delete_nonexistent_override(self, client, admin_token):
        """Deleting nonexistent override returns 404."""
        response = client.delete(
            "/api/weekly-overrides/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestCreateFromStandard:
    """Tests for POST /api/weekly-overrides/create-from-standard endpoint."""

    def test_create_from_standard_as_admin(self, test_app, admin_token):
        """Admin can create overrides from standard schedules."""
        with test_app.app_context():
            # Create a standard day schedule
            schedule = DaySchedule(
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(schedule)
            db.session.commit()

        client = test_app.test_client()
        response = client.post(
            "/api/weekly-overrides/create-from-standard",
            json={"week_start_date": "2024-07-01"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.get_json()
        assert isinstance(data, list)

    def test_create_from_standard_as_user_forbidden(self, client, auth_token):
        """Regular user cannot create from standard."""
        response = client.post(
            "/api/weekly-overrides/create-from-standard",
            json={"week_start_date": "2024-07-01"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_create_from_standard_updates_existing(self, test_app, admin_token):
        """Creating from standard updates existing overrides."""
        with test_app.app_context():
            # Create standard schedule
            schedule = DaySchedule(
                day_of_week=1,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(schedule)

            # Create existing override
            override = WeeklyScheduleOverride(
                week_start_date=date(2024, 7, 8),
                day_of_week=1,
                start_time=time(10, 0),
                end_time=time(16, 0),
                slot_duration_minutes=60,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()

        client = test_app.test_client()
        response = client.post(
            "/api/weekly-overrides/create-from-standard",
            json={"week_start_date": "2024-07-08"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201


class TestDeleteWeekOverrides:
    """Tests for DELETE /api/weekly-overrides/delete-week endpoint."""

    def test_delete_week_overrides_as_admin(self, test_app, admin_token):
        """Admin can delete all overrides for a week."""
        with test_app.app_context():
            # Create overrides for a week
            for day in range(5):
                override = WeeklyScheduleOverride(
                    week_start_date=date(2024, 8, 1),
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    slot_duration_minutes=30,
                    is_active=True,
                )
                db.session.add(override)
            db.session.commit()

        client = test_app.test_client()
        response = client.delete(
            "/api/weekly-overrides/delete-week?week_start=2024-08-01",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "Deleted" in data["message"]

    def test_delete_week_overrides_as_user_forbidden(self, client, auth_token):
        """Regular user cannot delete week overrides."""
        response = client.delete(
            "/api/weekly-overrides/delete-week?week_start=2024-08-01",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_delete_week_overrides_missing_week_start(self, client, admin_token):
        """Missing week_start returns 400."""
        response = client.delete(
            "/api/weekly-overrides/delete-week", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400


class TestUpdateOverrideBranches:
    """Additional tests for update override edge cases."""

    def test_update_only_slot_duration(self, client, admin_token):
        """Test updating only slot_duration_minutes field."""
        with client.application.app_context():
            from datetime import date, time, timedelta

            from database import db
            from models import WeeklyScheduleOverride

            week_start = date.today() - timedelta(days=date.today().weekday())
            override = WeeklyScheduleOverride(
                week_start_date=week_start,
                day_of_week=3,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        response = client.put(
            f"/api/weekly-overrides/{override_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"slot_duration_minutes": 60},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["slot_duration_minutes"] == 60

    def test_update_only_is_active(self, client, admin_token):
        """Test updating only is_active field."""
        with client.application.app_context():
            from datetime import date, time, timedelta

            from database import db
            from models import WeeklyScheduleOverride

            week_start = date.today() - timedelta(days=date.today().weekday())
            override = WeeklyScheduleOverride(
                week_start_date=week_start,
                day_of_week=4,
                start_time=time(10, 0),
                end_time=time(18, 0),
                slot_duration_minutes=30,
                is_active=True,
            )
            db.session.add(override)
            db.session.commit()
            override_id = override.id

        response = client.put(
            f"/api/weekly-overrides/{override_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_active": False},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["is_active"] is False


class TestGetOverridesBranches:
    """Additional tests for get overrides edge cases."""

    def test_get_overrides_empty_week(self, client, admin_token):
        """Test getting overrides for a week with no overrides."""
        response = client.get(
            "/api/weekly-overrides?week_start=2099-01-04",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data == []

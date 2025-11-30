"""
Comprehensive tests for shift requirements routes.
Tests CRUD operations for /api/shift-requirements endpoints.
"""

from datetime import date, time

import pytest

from app import app, db
from models import Location, ShiftRequirement, TimeSlot


class TestGetShiftRequirements:
    """Tests for GET /api/shift-requirements endpoint."""

    def test_get_all_shift_requirements(self, client):
        """Anyone can get all shift requirements."""
        response = client.get("/api/shift-requirements")
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_shift_requirements_with_week_filter(self, client):
        """Can filter shift requirements by week_start."""
        response = client.get("/api/shift-requirements?week_start=2024-01-01")
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_shift_requirements_returns_filtered_data(
        self, test_app, test_location, test_time_slot, admin_token
    ):
        """Week filter returns only matching requirements."""
        with test_app.app_context():
            # Create requirement for week 1
            req1 = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 1, 1),
                required_workers=2,
                created_by=1,
            )
            # Create requirement for week 2
            req2 = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 1, 8),
                required_workers=3,
                created_by=1,
            )
            db.session.add_all([req1, req2])
            db.session.commit()

        client = test_app.test_client()
        response = client.get("/api/shift-requirements?week_start=2024-01-01")
        data = response.get_json()
        # All returned should be for week 2024-01-01
        for req in data:
            assert req["week_start_date"] == "2024-01-01"


class TestCreateShiftRequirement:
    """Tests for POST /api/shift-requirements endpoint."""

    def test_create_shift_requirement_as_admin(
        self, client, admin_token, test_location, test_time_slot
    ):
        """Admin can create shift requirement."""
        response = client.post(
            "/api/shift-requirements",
            json={
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": "2024-02-01",
                "required_workers": 2,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["required_workers"] == 2

    def test_create_shift_requirement_as_user_forbidden(
        self, client, auth_token, test_location, test_time_slot
    ):
        """Regular user cannot create shift requirement."""
        response = client.post(
            "/api/shift-requirements",
            json={
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": "2024-02-01",
                "required_workers": 2,
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_create_shift_requirement_unauthorized(self, client, test_location, test_time_slot):
        """Unauthenticated request returns 403."""
        response = client.post(
            "/api/shift-requirements",
            json={
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": "2024-02-01",
                "required_workers": 2,
            },
        )
        assert response.status_code == 403

    def test_create_shift_requirement_updates_existing(
        self, client, admin_token, test_location, test_time_slot
    ):
        """Creating requirement for existing slot updates it."""
        # Create first
        response1 = client.post(
            "/api/shift-requirements",
            json={
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": "2024-03-01",
                "required_workers": 2,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response1.status_code == 201

        # Create again - should update
        response2 = client.post(
            "/api/shift-requirements",
            json={
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": "2024-03-01",
                "required_workers": 5,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response2.status_code == 200
        data = response2.get_json()
        assert data["required_workers"] == 5


class TestUpdateShiftRequirement:
    """Tests for PUT /api/shift-requirements/<id> endpoint."""

    def test_update_shift_requirement_as_admin(
        self, test_app, admin_token, test_location, test_time_slot
    ):
        """Admin can update shift requirement."""
        with test_app.app_context():
            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 4, 1),
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        client = test_app.test_client()
        response = client.put(
            f"/api/shift-requirements/{req_id}",
            json={"required_workers": 4},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["required_workers"] == 4

    def test_update_shift_requirement_all_fields(
        self, test_app, admin_token, test_location, test_time_slot
    ):
        """Admin can update all fields."""
        with test_app.app_context():
            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 4, 8),
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        client = test_app.test_client()
        response = client.put(
            f"/api/shift-requirements/{req_id}",
            json={"required_workers": 3, "week_start_date": "2024-05-01"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

    def test_update_shift_requirement_as_user_forbidden(
        self, test_app, auth_token, test_location, test_time_slot
    ):
        """Regular user cannot update shift requirement."""
        with test_app.app_context():
            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 4, 15),
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        client = test_app.test_client()
        response = client.put(
            f"/api/shift-requirements/{req_id}",
            json={"required_workers": 10},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_update_nonexistent_requirement(self, client, admin_token):
        """Updating nonexistent requirement returns 404."""
        response = client.put(
            "/api/shift-requirements/99999",
            json={"required_workers": 5},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestDeleteShiftRequirement:
    """Tests for DELETE /api/shift-requirements/<id> endpoint."""

    def test_delete_shift_requirement_as_admin(
        self, test_app, admin_token, test_location, test_time_slot
    ):
        """Admin can delete shift requirement."""
        with test_app.app_context():
            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 5, 1),
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        client = test_app.test_client()
        response = client.delete(
            f"/api/shift-requirements/{req_id}", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "deleted" in response.get_json()["message"].lower()

    def test_delete_shift_requirement_as_user_forbidden(
        self, test_app, auth_token, test_location, test_time_slot
    ):
        """Regular user cannot delete shift requirement."""
        with test_app.app_context():
            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=date(2024, 5, 8),
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        client = test_app.test_client()
        response = client.delete(
            f"/api/shift-requirements/{req_id}", headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403

    def test_delete_nonexistent_requirement(self, client, admin_token):
        """Deleting nonexistent requirement returns 404."""
        response = client.delete(
            "/api/shift-requirements/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestUpdateShiftRequirementBranches:
    """Additional tests for update shift requirement edge cases."""

    def test_update_only_required_workers(self, client, admin_token, test_location, test_time_slot):
        """Test updating only required_workers field."""
        with client.application.app_context():
            from datetime import date, timedelta

            from database import db
            from models import ShiftRequirement

            week_start = date.today() - timedelta(days=date.today().weekday())
            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        response = client.put(
            f"/api/shift-requirements/{req_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"required_workers": 5},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["required_workers"] == 5

    def test_update_location_id_only(self, client, admin_token, test_location, test_time_slot):
        """Test updating only location_id field."""
        with client.application.app_context():
            from datetime import timedelta

            week_start = date.today() - timedelta(days=date.today().weekday())

            loc2 = Location(name="New Loc", description="Test")
            db.session.add(loc2)
            db.session.commit()
            new_loc_id = loc2.id

            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        response = client.put(
            f"/api/shift-requirements/{req_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"location_id": new_loc_id},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["location_id"] == new_loc_id

    def test_update_time_slot_id_only(self, client, admin_token, test_location, test_time_slot):
        """Test updating only time_slot_id field."""
        with client.application.app_context():
            from datetime import timedelta

            week_start = date.today() - timedelta(days=date.today().weekday())

            slot2 = TimeSlot(day_of_week=2, start_time=time(14, 0), end_time=time(15, 0))
            db.session.add(slot2)
            db.session.commit()
            new_slot_id = slot2.id

            req = ShiftRequirement(
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                required_workers=2,
                created_by=1,
            )
            db.session.add(req)
            db.session.commit()
            req_id = req.id

        response = client.put(
            f"/api/shift-requirements/{req_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"time_slot_id": new_slot_id},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["time_slot_id"] == new_slot_id

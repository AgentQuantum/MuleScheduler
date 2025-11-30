"""
Functional tests for API routes/views.
"""

from datetime import date, timedelta

import pytest


class TestUsersEndpoints:
    """Test /api/users endpoints."""

    def test_get_me(self, client, auth_token):
        """Test GET /api/users/me returns current user."""
        response = client.get("/api/users/me", headers={"Authorization": f"Bearer {auth_token}"})

        assert response.status_code == 200
        data = response.get_json()
        assert "id" in data
        assert "email" in data

    def test_get_users_as_admin(self, client, admin_token, test_user):
        """Test GET /api/users returns all users for admin."""
        response = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_users_as_user_forbidden(self, client, auth_token):
        """Test GET /api/users returns 403 for non-admin."""
        response = client.get("/api/users", headers={"Authorization": f"Bearer {auth_token}"})

        assert response.status_code == 403


class TestLocationsEndpoints:
    """Test /api/locations endpoints."""

    def test_get_locations(self, client, test_location):
        """Test GET /api/locations returns all locations."""
        response = client.get("/api/locations")

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(loc["name"] == test_location["name"] for loc in data)

    def test_create_location_as_admin(self, client, admin_token):
        """Test POST /api/locations creates a new location."""
        response = client.post(
            "/api/locations",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "New Location", "description": "A new test location"},
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "New Location"
        assert data["description"] == "A new test location"

    def test_create_location_as_user_forbidden(self, client, auth_token):
        """Test POST /api/locations returns 403 for non-admin."""
        response = client.post(
            "/api/locations",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"name": "Test Location"},
        )

        assert response.status_code == 403

    def test_update_location_as_admin(self, client, admin_token, test_location):
        """Test PUT /api/locations/:id updates location."""
        response = client.put(
            f'/api/locations/{test_location["id"]}',
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"name": "Updated Location"},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "Updated Location"

    def test_delete_location_as_admin(self, client, admin_token, test_location):
        """Test DELETE /api/locations/:id soft-deletes location."""
        response = client.delete(
            f'/api/locations/{test_location["id"]}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )

        assert response.status_code == 200

        # Verify location is soft-deleted (is_active = False)
        get_response = client.get("/api/locations")
        locations = get_response.get_json()
        assert not any(loc["id"] == test_location["id"] and loc["is_active"] for loc in locations)


class TestAssignmentsEndpoints:
    """Test /api/assignments endpoints."""

    def test_get_assignments_for_user(
        self, client, auth_token, test_user, test_location, test_time_slot
    ):
        """Test GET /api/assignments returns only user's assignments."""
        with client.application.app_context():
            from database import db
            from models import Assignment

            # Create an assignment for the test user
            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()

        week_start_str = week_start.isoformat()
        response = client.get(
            f"/api/assignments?week_start={week_start_str}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        # Should only return assignments for the authenticated user
        for assignment in data:
            assert assignment["user_id"] == test_user["id"]

    def test_get_assignments_missing_week_start(self, client, auth_token):
        """Test GET /api/assignments without week_start returns 400."""
        response = client.get("/api/assignments", headers={"Authorization": f"Bearer {auth_token}"})

        assert response.status_code == 400

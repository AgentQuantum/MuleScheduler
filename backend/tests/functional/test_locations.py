"""
Comprehensive tests for locations routes.
Tests CRUD operations for /api/locations endpoints.
"""

import pytest

from app import app, db
from models import Location


class TestGetLocations:
    """Tests for GET /api/locations endpoint."""

    def test_get_locations(self, client):
        """Anyone can get locations."""
        response = client.get("/api/locations")
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)


class TestCreateLocation:
    """Tests for POST /api/locations endpoint."""

    def test_create_location_as_admin(self, client, admin_token):
        """Admin can create location."""
        response = client.post(
            "/api/locations",
            json={"name": "New Location", "description": "A new location"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["name"] == "New Location"

    def test_create_location_as_user_forbidden(self, client, auth_token):
        """Regular user cannot create location."""
        response = client.post(
            "/api/locations",
            json={"name": "New Location"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_create_location_unauthorized(self, client):
        """Unauthenticated request returns 403."""
        response = client.post("/api/locations", json={"name": "New Location"})
        assert response.status_code == 403


class TestUpdateLocation:
    """Tests for PUT /api/locations/<id> endpoint."""

    def test_update_location_name(self, client, admin_token, test_location):
        """Admin can update location name."""
        response = client.put(
            f'/api/locations/{test_location["id"]}',
            json={"name": "Updated Name"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["name"] == "Updated Name"

    def test_update_location_description(self, client, admin_token, test_location):
        """Admin can update location description."""
        response = client.put(
            f'/api/locations/{test_location["id"]}',
            json={"description": "Updated description"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["description"] == "Updated description"

    def test_update_location_is_active(self, client, admin_token, test_location):
        """Admin can update location is_active status."""
        response = client.put(
            f'/api/locations/{test_location["id"]}',
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["is_active"] is False

    def test_update_location_as_user_forbidden(self, client, auth_token, test_location):
        """Regular user cannot update location."""
        response = client.put(
            f'/api/locations/{test_location["id"]}',
            json={"name": "Hacked Name"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_update_nonexistent_location(self, client, admin_token):
        """Updating nonexistent location returns 404."""
        response = client.put(
            "/api/locations/99999",
            json={"name": "New Name"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404


class TestDeleteLocation:
    """Tests for DELETE /api/locations/<id> endpoint."""

    def test_delete_location_as_admin(self, test_app, admin_token):
        """Admin can delete location (soft delete)."""
        with test_app.app_context():
            location = Location(name="To Delete", description="Will be deleted", is_active=True)
            db.session.add(location)
            db.session.commit()
            location_id = location.id

        client = test_app.test_client()
        response = client.delete(
            f"/api/locations/{location_id}", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "deleted" in response.get_json()["message"].lower()

    def test_delete_location_as_user_forbidden(self, client, auth_token, test_location):
        """Regular user cannot delete location."""
        response = client.delete(
            f'/api/locations/{test_location["id"]}',
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_delete_nonexistent_location(self, client, admin_token):
        """Deleting nonexistent location returns 404."""
        response = client.delete(
            "/api/locations/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

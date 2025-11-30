"""
Comprehensive tests for users routes.
Tests /api/users endpoints.
"""

import pytest

from app import app, db
from models import User


class TestGetMe:
    """Tests for GET /api/users/me endpoint."""

    def test_get_me_authenticated(self, client, auth_token):
        """Authenticated user can get their own info."""
        response = client.get("/api/users/me", headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.get_json()
        assert "email" in data
        assert "name" in data

    def test_get_me_unauthorized(self, client):
        """Unauthenticated request returns 401."""
        response = client.get("/api/users/me")
        assert response.status_code == 401


class TestGetUsers:
    """Tests for GET /api/users endpoint."""

    def test_get_users_as_admin(self, client, admin_token):
        """Admin can get all users."""
        response = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_users_as_user_forbidden(self, client, auth_token):
        """Regular user cannot get all users."""
        response = client.get("/api/users", headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 403

    def test_get_users_unauthorized(self, client):
        """Unauthenticated request returns 401."""
        response = client.get("/api/users")
        assert response.status_code == 401

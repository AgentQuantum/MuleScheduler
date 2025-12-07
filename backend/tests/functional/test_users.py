"""
Comprehensive tests for users routes.
Tests /api/users endpoints.
"""

import io
import os
import tempfile

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


class TestUpdateMe:
    """Tests for PUT /api/users/me endpoint."""

    def test_update_me_unauthorized(self, client):
        """Unauthenticated request returns 401."""
        response = client.put("/api/users/me", json={"bio": "Test bio"})
        assert response.status_code == 401

    def test_update_bio_via_json(self, client, auth_token):
        """User can update their bio via JSON."""
        response = client.put(
            "/api/users/me",
            json={"bio": "I am a test student"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["bio"] == "I am a test student"

    def test_update_class_year_for_student(self, client, auth_token):
        """Student can update their class year."""
        response = client.put(
            "/api/users/me",
            json={"class_year": 2025},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["class_year"] == 2025

    def test_admin_cannot_set_class_year(self, client, admin_token):
        """Admin cannot set class year (gets set to None)."""
        response = client.put(
            "/api/users/me",
            json={"class_year": 2025, "bio": "Admin bio"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["class_year"] is None
        assert data["bio"] == "Admin bio"

    def test_update_via_form_data(self, client, auth_token):
        """User can update profile via form data."""
        response = client.put(
            "/api/users/me",
            data={"bio": "Form bio", "class_year": "2026"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["bio"] == "Form bio"
        assert data["class_year"] == 2026

    def test_update_via_form_data_empty_class_year(self, client, auth_token):
        """Empty class_year in form data sets to None."""
        response = client.put(
            "/api/users/me",
            data={"class_year": ""},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["class_year"] is None

    def test_update_via_form_data_invalid_class_year(self, client, auth_token):
        """Invalid class_year in form data sets to None."""
        response = client.put(
            "/api/users/me",
            data={"class_year": "not_a_number"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["class_year"] is None

    def test_admin_form_data_class_year_ignored(self, client, admin_token):
        """Admin class_year via form data is ignored."""
        response = client.put(
            "/api/users/me",
            data={"class_year": "2025"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["class_year"] is None

    def test_upload_profile_picture(self, client, auth_token):
        """User can upload a profile picture."""
        # Create a fake image file
        data = {
            "profile_picture": (io.BytesIO(b"fake image data"), "test.jpg"),
        }
        response = client.put(
            "/api/users/me",
            data=data,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["profile_picture_url"] is not None
        assert "/uploads/profile_pictures/" in result["profile_picture_url"]

    def test_upload_invalid_file_type(self, client, auth_token):
        """Invalid file type is ignored."""
        data = {
            "profile_picture": (io.BytesIO(b"fake text"), "test.txt"),
        }
        response = client.put(
            "/api/users/me",
            data=data,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        # File should be ignored, profile_picture_url stays unchanged

    def test_remove_picture_via_json(self, client, auth_token):
        """User can remove profile picture via JSON."""
        # First upload a picture
        data = {
            "profile_picture": (io.BytesIO(b"fake image data"), "test.png"),
        }
        client.put(
            "/api/users/me",
            data=data,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # Now remove it
        response = client.put(
            "/api/users/me",
            json={"remove_picture": True},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["profile_picture_url"] is None

    def test_remove_picture_via_form_data(self, client, auth_token):
        """User can remove profile picture via form data."""
        # First upload a picture
        data = {
            "profile_picture": (io.BytesIO(b"fake image data"), "test.gif"),
        }
        client.put(
            "/api/users/me",
            data=data,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # Now remove it via form data
        response = client.put(
            "/api/users/me",
            data={"remove_picture": "true"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        result = response.get_json()
        assert result["profile_picture_url"] is None

    def test_upload_replaces_old_picture(self, client, auth_token):
        """Uploading a new picture replaces the old one."""
        # Upload first picture
        data1 = {
            "profile_picture": (io.BytesIO(b"first image"), "first.jpg"),
        }
        resp1 = client.put(
            "/api/users/me",
            data=data1,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        first_url = resp1.get_json()["profile_picture_url"]

        # Upload second picture
        data2 = {
            "profile_picture": (io.BytesIO(b"second image"), "second.webp"),
        }
        resp2 = client.put(
            "/api/users/me",
            data=data2,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        second_url = resp2.get_json()["profile_picture_url"]

        assert first_url != second_url
        assert "/uploads/profile_pictures/" in second_url


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


class TestAllowedFile:
    """Tests for allowed_file helper function."""

    def test_allowed_extensions(self):
        """Test that allowed file types are recognized."""
        from routes.users import allowed_file

        assert allowed_file("test.png") is True
        assert allowed_file("test.jpg") is True
        assert allowed_file("test.jpeg") is True
        assert allowed_file("test.gif") is True
        assert allowed_file("test.webp") is True
        assert allowed_file("test.PNG") is True  # Case insensitive

    def test_disallowed_extensions(self):
        """Test that disallowed file types are rejected."""
        from routes.users import allowed_file

        assert allowed_file("test.txt") is False
        assert allowed_file("test.pdf") is False
        assert allowed_file("test.exe") is False
        assert allowed_file("test") is False  # No extension

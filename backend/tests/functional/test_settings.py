"""
Comprehensive tests for settings routes.
Tests GET and PUT /api/settings endpoints.
"""
import pytest
from app import app, db
from models import GlobalSettings, User


class TestGetSettings:
    """Tests for GET /api/settings endpoint."""

    def test_get_settings_as_admin(self, client, admin_token):
        """Admin can get settings."""
        response = client.get(
            '/api/settings',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'max_workers_per_shift' in data

    def test_get_settings_as_user_forbidden(self, client, auth_token):
        """Regular user cannot get settings."""
        response = client.get(
            '/api/settings',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403
        assert response.get_json()['error'] == 'Forbidden'

    def test_get_settings_unauthorized(self, client):
        """Unauthenticated request returns 403."""
        response = client.get('/api/settings')
        assert response.status_code == 403

    def test_get_settings_creates_default_if_none(self, test_app, admin_token):
        """Settings are created with defaults if none exist."""
        with test_app.app_context():
            # Delete all settings
            GlobalSettings.query.delete()
            db.session.commit()
            
        client = test_app.test_client()
        response = client.get(
            '/api/settings',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['max_workers_per_shift'] == 3


class TestUpdateSettings:
    """Tests for PUT /api/settings endpoint."""

    def test_update_max_workers_per_shift(self, client, admin_token):
        """Admin can update max_workers_per_shift."""
        response = client.put(
            '/api/settings',
            json={'max_workers_per_shift': 5},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['max_workers_per_shift'] == 5

    def test_update_max_hours_per_user(self, client, admin_token):
        """Admin can update max_hours_per_user_per_week."""
        response = client.put(
            '/api/settings',
            json={'max_hours_per_user_per_week': 20},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['max_hours_per_user_per_week'] == 20

    def test_update_both_settings(self, client, admin_token):
        """Admin can update both settings at once."""
        response = client.put(
            '/api/settings',
            json={
                'max_workers_per_shift': 4,
                'max_hours_per_user_per_week': 15
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['max_workers_per_shift'] == 4
        assert data['max_hours_per_user_per_week'] == 15

    def test_update_settings_as_user_forbidden(self, client, auth_token):
        """Regular user cannot update settings."""
        response = client.put(
            '/api/settings',
            json={'max_workers_per_shift': 10},
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403

    def test_update_settings_unauthorized(self, client):
        """Unauthenticated request returns 403."""
        response = client.put(
            '/api/settings',
            json={'max_workers_per_shift': 10}
        )
        assert response.status_code == 403

    def test_update_settings_creates_if_none_exist(self, test_app, admin_token):
        """Settings are created if none exist during update."""
        with test_app.app_context():
            GlobalSettings.query.delete()
            db.session.commit()
        
        client = test_app.test_client()
        response = client.put(
            '/api/settings',
            json={'max_workers_per_shift': 7},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['max_workers_per_shift'] == 7

    def test_update_settings_null_max_hours(self, client, admin_token):
        """Admin can set max_hours_per_user_per_week to null."""
        response = client.put(
            '/api/settings',
            json={'max_hours_per_user_per_week': None},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['max_hours_per_user_per_week'] is None


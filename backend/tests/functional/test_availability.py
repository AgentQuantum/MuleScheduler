"""
Comprehensive tests for availability routes.
Tests GET, POST /api/availability and POST /api/availability/batch endpoints.
"""
import pytest
from app import app, db
from models import UserAvailability, Location, TimeSlot, User
from datetime import time, date


@pytest.fixture
def test_availability_setup(test_app, test_user, test_location, test_time_slot):
    """Set up availability test data."""
    return {
        'user': test_user,
        'location': test_location,
        'time_slot': test_time_slot
    }


class TestGetAvailability:
    """Tests for GET /api/availability endpoint."""

    def test_get_availability_authenticated(self, client, auth_token):
        """Authenticated user can get their availability."""
        response = client.get(
            '/api/availability',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_availability_unauthorized(self, client):
        """Unauthenticated request returns 401."""
        response = client.get('/api/availability')
        assert response.status_code == 401

    def test_get_availability_with_week_filter(self, client, auth_token):
        """Can filter availability by week_start."""
        response = client.get(
            '/api/availability?week_start=2024-01-01',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200

    def test_get_availability_returns_user_entries_only(self, test_app, test_availability_setup, auth_token):
        """User only sees their own availability entries."""
        with test_app.app_context():
            # Create availability for test user
            av = UserAvailability(
                user_id=test_availability_setup['user']['id'],
                location_id=test_availability_setup['location']['id'],
                time_slot_id=test_availability_setup['time_slot']['id'],
                week_start_date=date(2024, 1, 1),
                preference_level=1
            )
            db.session.add(av)
            db.session.commit()
        
        client = test_app.test_client()
        response = client.get(
            '/api/availability?week_start=2024-01-01',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) >= 1


class TestCreateAvailability:
    """Tests for POST /api/availability endpoint."""

    def test_create_availability_success(self, client, auth_token, test_availability_setup):
        """User can create availability entry."""
        response = client.post(
            '/api/availability',
            json={
                'location_id': test_availability_setup['location']['id'],
                'time_slot_id': test_availability_setup['time_slot']['id'],
                'week_start_date': '2024-02-01',
                'preference_level': 2
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['preference_level'] == 2

    def test_create_availability_unauthorized(self, client, test_availability_setup):
        """Unauthenticated request returns 401."""
        response = client.post(
            '/api/availability',
            json={
                'location_id': test_availability_setup['location']['id'],
                'time_slot_id': test_availability_setup['time_slot']['id'],
                'week_start_date': '2024-02-01',
                'preference_level': 1
            }
        )
        assert response.status_code == 401

    def test_create_availability_updates_existing(self, client, auth_token, test_availability_setup):
        """Creating availability for existing slot updates it."""
        # Create first entry
        response1 = client.post(
            '/api/availability',
            json={
                'location_id': test_availability_setup['location']['id'],
                'time_slot_id': test_availability_setup['time_slot']['id'],
                'week_start_date': '2024-03-01',
                'preference_level': 1
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response1.status_code == 201
        
        # Create same entry with different preference
        response2 = client.post(
            '/api/availability',
            json={
                'location_id': test_availability_setup['location']['id'],
                'time_slot_id': test_availability_setup['time_slot']['id'],
                'week_start_date': '2024-03-01',
                'preference_level': 3
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response2.status_code == 200
        data = response2.get_json()
        assert data['preference_level'] == 3

    def test_create_availability_default_preference(self, client, auth_token, test_availability_setup):
        """Preference defaults to 1 if not provided."""
        response = client.post(
            '/api/availability',
            json={
                'location_id': test_availability_setup['location']['id'],
                'time_slot_id': test_availability_setup['time_slot']['id'],
                'week_start_date': '2024-04-01'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['preference_level'] == 1


class TestCreateAvailabilityBatch:
    """Tests for POST /api/availability/batch endpoint."""

    def test_batch_create_availability(self, client, auth_token, test_availability_setup):
        """User can create multiple availability entries at once."""
        response = client.post(
            '/api/availability/batch',
            json={
                'week_start_date': '2024-05-01',
                'entries': [
                    {
                        'location_id': test_availability_setup['location']['id'],
                        'time_slot_id': test_availability_setup['time_slot']['id'],
                        'preference_level': 1
                    }
                ]
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert len(data) == 1

    def test_batch_create_unauthorized(self, client, test_availability_setup):
        """Unauthenticated batch request returns 401."""
        response = client.post(
            '/api/availability/batch',
            json={
                'week_start_date': '2024-05-01',
                'entries': []
            }
        )
        assert response.status_code == 401

    def test_batch_updates_existing_entries(self, client, auth_token, test_availability_setup):
        """Batch create updates existing entries."""
        # First batch
        response1 = client.post(
            '/api/availability/batch',
            json={
                'week_start_date': '2024-06-01',
                'entries': [
                    {
                        'location_id': test_availability_setup['location']['id'],
                        'time_slot_id': test_availability_setup['time_slot']['id'],
                        'preference_level': 1
                    }
                ]
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response1.status_code == 201
        
        # Second batch with update
        response2 = client.post(
            '/api/availability/batch',
            json={
                'week_start_date': '2024-06-01',
                'entries': [
                    {
                        'location_id': test_availability_setup['location']['id'],
                        'time_slot_id': test_availability_setup['time_slot']['id'],
                        'preference_level': 3
                    }
                ]
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response2.status_code == 201
        data = response2.get_json()
        assert data[0]['preference_level'] == 3

    def test_batch_empty_entries(self, client, auth_token):
        """Empty entries list returns empty result."""
        response = client.post(
            '/api/availability/batch',
            json={
                'week_start_date': '2024-07-01',
                'entries': []
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 201
        assert response.get_json() == []


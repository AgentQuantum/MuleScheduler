"""
Comprehensive tests for time slots routes.
Tests CRUD operations and day schedule management.
"""
import pytest
from app import app, db
from models import TimeSlot, DaySchedule
from datetime import time


class TestGetTimeSlots:
    """Tests for GET /api/time-slots endpoint."""

    def test_get_time_slots(self, client):
        """Anyone can get time slots."""
        response = client.get('/api/time-slots')
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)


class TestCreateTimeSlot:
    """Tests for POST /api/time-slots endpoint."""

    def test_create_time_slot_as_admin(self, client, admin_token):
        """Admin can create time slot."""
        response = client.post(
            '/api/time-slots',
            json={
                'day_of_week': 1,
                'start_time': '10:00',
                'end_time': '11:00'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['day_of_week'] == 1

    def test_create_time_slot_as_user_forbidden(self, client, auth_token):
        """Regular user cannot create time slot."""
        response = client.post(
            '/api/time-slots',
            json={
                'day_of_week': 1,
                'start_time': '10:00',
                'end_time': '11:00'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403

    def test_create_time_slot_unauthorized(self, client):
        """Unauthenticated request returns 403."""
        response = client.post(
            '/api/time-slots',
            json={
                'day_of_week': 1,
                'start_time': '10:00',
                'end_time': '11:00'
            }
        )
        assert response.status_code == 403

    def test_create_time_slot_with_seconds(self, client, admin_token):
        """Time slot can be created with seconds in time format."""
        response = client.post(
            '/api/time-slots',
            json={
                'day_of_week': 2,
                'start_time': '14:00:00',
                'end_time': '15:00:00'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 201


class TestUpdateTimeSlot:
    """Tests for PUT /api/time-slots/<id> endpoint."""

    def test_update_time_slot_as_admin(self, client, admin_token, test_time_slot):
        """Admin can update time slot."""
        response = client.put(
            f'/api/time-slots/{test_time_slot["id"]}',
            json={'day_of_week': 2},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['day_of_week'] == 2

    def test_update_time_slot_start_time(self, client, admin_token, test_time_slot):
        """Admin can update start time."""
        response = client.put(
            f'/api/time-slots/{test_time_slot["id"]}',
            json={'start_time': '08:00'},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200

    def test_update_time_slot_end_time(self, client, admin_token, test_time_slot):
        """Admin can update end time."""
        response = client.put(
            f'/api/time-slots/{test_time_slot["id"]}',
            json={'end_time': '18:00'},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200

    def test_update_time_slot_as_user_forbidden(self, client, auth_token, test_time_slot):
        """Regular user cannot update time slot."""
        response = client.put(
            f'/api/time-slots/{test_time_slot["id"]}',
            json={'day_of_week': 3},
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403

    def test_update_nonexistent_time_slot(self, client, admin_token):
        """Updating nonexistent slot returns 404."""
        response = client.put(
            '/api/time-slots/99999',
            json={'day_of_week': 3},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 404


class TestDeleteTimeSlot:
    """Tests for DELETE /api/time-slots/<id> endpoint."""

    def test_delete_time_slot_as_admin(self, test_app, admin_token):
        """Admin can delete time slot."""
        with test_app.app_context():
            slot = TimeSlot(day_of_week=3, start_time=time(11, 0), end_time=time(12, 0))
            db.session.add(slot)
            db.session.commit()
            slot_id = slot.id
        
        client = test_app.test_client()
        response = client.delete(
            f'/api/time-slots/{slot_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        assert 'deleted' in response.get_json()['message'].lower()

    def test_delete_time_slot_as_user_forbidden(self, client, auth_token, test_time_slot):
        """Regular user cannot delete time slot."""
        response = client.delete(
            f'/api/time-slots/{test_time_slot["id"]}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403

    def test_delete_nonexistent_time_slot(self, client, admin_token):
        """Deleting nonexistent slot returns 404."""
        response = client.delete(
            '/api/time-slots/99999',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 404


class TestDaySchedules:
    """Tests for day schedule endpoints."""

    def test_get_day_schedules(self, client):
        """Anyone can get day schedules."""
        response = client.get('/api/time-slots/day-schedules')
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_create_day_schedule_as_admin(self, client, admin_token):
        """Admin can create day schedule."""
        response = client.post(
            '/api/time-slots/day-schedules',
            json={
                'day_of_week': 3,
                'start_time': '09:00',
                'end_time': '17:00',
                'slot_duration_minutes': 30
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['day_of_week'] == 3
        assert 'slot_count' in data

    def test_create_day_schedule_as_user_forbidden(self, client, auth_token):
        """Regular user cannot create day schedule."""
        response = client.post(
            '/api/time-slots/day-schedules',
            json={
                'day_of_week': 3,
                'start_time': '09:00',
                'end_time': '17:00'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403

    def test_create_day_schedule_missing_fields(self, client, admin_token):
        """Missing required fields returns 400."""
        response = client.post(
            '/api/time-slots/day-schedules',
            json={'day_of_week': 3},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400

    def test_create_day_schedule_invalid_time_format(self, client, admin_token):
        """Invalid time format returns 400."""
        response = client.post(
            '/api/time-slots/day-schedules',
            json={
                'day_of_week': 3,
                'start_time': 'invalid',
                'end_time': '17:00'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400

    def test_create_day_schedule_end_before_start(self, client, admin_token):
        """End time before start time returns 400."""
        response = client.post(
            '/api/time-slots/day-schedules',
            json={
                'day_of_week': 3,
                'start_time': '17:00',
                'end_time': '09:00'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 400

    def test_update_existing_day_schedule(self, test_app, admin_token):
        """Updating existing day schedule works."""
        with test_app.app_context():
            schedule = DaySchedule(
                day_of_week=4,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
        
        client = test_app.test_client()
        # Create for same day should update
        response = client.post(
            '/api/time-slots/day-schedules',
            json={
                'day_of_week': 4,
                'start_time': '08:00',
                'end_time': '18:00'
            },
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'Updated' in data.get('message', '')


class TestDayScheduleUpdate:
    """Tests for PUT /api/time-slots/day-schedules/<id> endpoint."""

    def test_update_day_schedule(self, test_app, admin_token):
        """Admin can update day schedule."""
        with test_app.app_context():
            schedule = DaySchedule(
                day_of_week=5,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id
        
        client = test_app.test_client()
        response = client.put(
            f'/api/time-slots/day-schedules/{schedule_id}',
            json={'start_time': '10:00', 'is_active': False},
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200

    def test_update_day_schedule_as_user_forbidden(self, test_app, auth_token):
        """Regular user cannot update day schedule."""
        with test_app.app_context():
            schedule = DaySchedule(
                day_of_week=6,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id
        
        client = test_app.test_client()
        response = client.put(
            f'/api/time-slots/day-schedules/{schedule_id}',
            json={'is_active': False},
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403


class TestDayScheduleDelete:
    """Tests for DELETE /api/time-slots/day-schedules/<id> endpoint."""

    def test_delete_day_schedule(self, test_app, admin_token):
        """Admin can delete day schedule."""
        with test_app.app_context():
            schedule = DaySchedule(
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id
        
        client = test_app.test_client()
        response = client.delete(
            f'/api/time-slots/day-schedules/{schedule_id}',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200

    def test_delete_day_schedule_as_user_forbidden(self, test_app, auth_token):
        """Regular user cannot delete day schedule."""
        with test_app.app_context():
            schedule = DaySchedule(
                day_of_week=1,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id
        
        client = test_app.test_client()
        response = client.delete(
            f'/api/time-slots/day-schedules/{schedule_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403


class TestPreviewSlots:
    """Tests for POST /api/time-slots/day-schedules/preview endpoint."""

    def test_preview_slots(self, client):
        """Preview slots returns slot list."""
        response = client.post(
            '/api/time-slots/day-schedules/preview',
            json={
                'start_time': '09:00',
                'end_time': '12:00',
                'slot_duration_minutes': 30
            }
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'slot_count' in data
        assert data['slot_count'] == 6  # 3 hours / 30 min = 6 slots

    def test_preview_slots_missing_times(self, client):
        """Preview without times returns 400."""
        response = client.post(
            '/api/time-slots/day-schedules/preview',
            json={'slot_duration_minutes': 30}
        )
        assert response.status_code == 400


class TestRegenerateAllSlots:
    """Tests for POST /api/time-slots/day-schedules/regenerate-all endpoint."""

    def test_regenerate_all_slots_as_admin(self, client, admin_token):
        """Admin can regenerate all slots."""
        response = client.post(
            '/api/time-slots/day-schedules/regenerate-all',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'deleted' in data
        assert 'created' in data

    def test_regenerate_all_slots_as_user_forbidden(self, client, auth_token):
        """Regular user cannot regenerate slots."""
        response = client.post(
            '/api/time-slots/day-schedules/regenerate-all',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 403


class TestDayScheduleUpdateBranches:
    """Additional tests for day schedule update edge cases."""

    def test_update_day_schedule_deactivate(self, client, admin_token):
        """Test deactivating a day schedule."""
        with client.application.app_context():
            from database import db
            from models import DaySchedule
            from datetime import time
            schedule = DaySchedule(
                day_of_week=5,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=60,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id

        response = client.put(
            f'/api/time-slots/day-schedules/{schedule_id}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'is_active': False}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['is_active'] is False

    def test_update_day_schedule_slot_duration(self, client, admin_token):
        """Test updating slot_duration_minutes."""
        with client.application.app_context():
            from database import db
            from models import DaySchedule
            from datetime import time
            schedule = DaySchedule(
                day_of_week=6,
                start_time=time(10, 0),
                end_time=time(14, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id

        response = client.put(
            f'/api/time-slots/day-schedules/{schedule_id}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'slot_duration_minutes': 60}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['slot_duration_minutes'] == 60

    def test_update_day_schedule_end_time(self, client, admin_token):
        """Test updating just end_time."""
        with client.application.app_context():
            from database import db
            from models import DaySchedule
            from datetime import time
            schedule = DaySchedule(
                day_of_week=4,
                start_time=time(8, 0),
                end_time=time(12, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            schedule_id = schedule.id

        response = client.put(
            f'/api/time-slots/day-schedules/{schedule_id}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'end_time': '16:00'}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert '16:00' in data['end_time']


class TestPreviewSlotsBranches:
    """Additional tests for preview slots edge cases."""

    def test_preview_slots_invalid_time_format(self, client):
        """Preview with invalid time format returns 400."""
        response = client.post(
            '/api/time-slots/day-schedules/preview',
            json={
                'start_time': 'invalid',
                'end_time': 'also-invalid',
                'slot_duration_minutes': 30
            }
        )
        assert response.status_code == 400


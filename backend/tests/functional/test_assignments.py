"""
Functional tests for assignments API endpoints.
"""
import pytest
from datetime import date, time, timedelta
from models import User, Location, TimeSlot, UserAvailability, Assignment, GlobalSettings


class TestRunSchedulerEndpoint:
    """Test POST /api/assignments/run-scheduler endpoint."""
    
    def test_run_scheduler_as_admin(self, client, admin_token, test_location, test_time_slot):
        """Test running scheduler as admin."""
        with client.application.app_context():
            from database import db
            
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create user and availability
            user = User(name='Test Worker', email='worker@colby.edu', role='user')
            db.session.add(user)
            db.session.commit()
            
            availability = UserAvailability(
                user_id=user.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start,
                preference_level=1
            )
            db.session.add(availability)
            db.session.commit()
        
        week_start_str = week_start.isoformat()
        response = client.post('/api/assignments/run-scheduler',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'week_start_date': week_start_str}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'scheduled' in data
        assert 'assignments' in data
        assert data['scheduled'] >= 0
    
    def test_run_scheduler_as_user_forbidden(self, client, auth_token):
        """Test running scheduler as non-admin returns 403."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        week_start_str = week_start.isoformat()
        
        response = client.post('/api/assignments/run-scheduler',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={'week_start_date': week_start_str}
        )
        
        assert response.status_code == 403
    
    def test_run_scheduler_missing_week_start(self, client, admin_token):
        """Test running scheduler without week_start_date returns 400."""
        response = client.post('/api/assignments/run-scheduler',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={}
        )
        
        assert response.status_code == 400
    
    def test_run_scheduler_creates_assignments(self, client, admin_token, test_location, test_time_slot):
        """Test that scheduler actually creates assignments."""
        with client.application.app_context():
            from database import db
            
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create two users with availability
            user1 = User(name='Worker 1', email='worker1@colby.edu', role='user')
            user2 = User(name='Worker 2', email='worker2@colby.edu', role='user')
            db.session.add_all([user1, user2])
            db.session.commit()
            
            availability1 = UserAvailability(
                user_id=user1.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start,
                preference_level=1
            )
            availability2 = UserAvailability(
                user_id=user2.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start,
                preference_level=1
            )
            db.session.add_all([availability1, availability2])
            db.session.commit()
            
            # Verify no assignments exist
            initial_count = Assignment.query.filter_by(week_start_date=week_start).count()
            assert initial_count == 0
        
        week_start_str = week_start.isoformat()
        response = client.post('/api/assignments/run-scheduler',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={'week_start_date': week_start_str}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['scheduled'] > 0
        
        # Verify assignments were created
        with client.application.app_context():
            from database import db
            final_count = Assignment.query.filter_by(week_start_date=week_start).count()
            assert final_count == data['scheduled']


class TestCreateAssignmentEndpoint:
    """Test POST /api/assignments endpoint."""
    
    def test_create_assignment_as_admin(self, client, admin_token, test_user, test_location, test_time_slot):
        """Test creating assignment as admin."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        week_start_str = week_start.isoformat()
        
        response = client.post('/api/assignments',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'user_id': test_user['id'],
                'location_id': test_location['id'],
                'time_slot_id': test_time_slot['id'],
                'week_start_date': week_start_str
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert data['user_id'] == test_user['id']
        assert data['location_id'] == test_location['id']
        assert data['time_slot_id'] == test_time_slot['id']
    
    def test_create_assignment_respects_max_workers(self, client, admin_token, test_location, test_time_slot):
        """Test that creating assignment respects max_workers_per_shift."""
        with client.application.app_context():
            from database import db
            
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Set max workers to 2
            settings = GlobalSettings.query.first()
            settings.max_workers_per_shift = 2
            db.session.commit()
            
            # Create 2 users and assign them
            user1 = User(name='Worker 1', email='worker1@colby.edu', role='user')
            user2 = User(name='Worker 2', email='worker2@colby.edu', role='user')
            db.session.add_all([user1, user2])
            db.session.commit()
            
            assignment1 = Assignment(
                user_id=user1.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            assignment2 = Assignment(
                user_id=user2.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            db.session.add_all([assignment1, assignment2])
            db.session.commit()
            
            # Try to create third assignment
            user3 = User(name='Worker 3', email='worker3@colby.edu', role='user')
            db.session.add(user3)
            db.session.commit()
            user3_id = user3.id  # Store ID before leaving context
        
        week_start_str = week_start.isoformat()
        response = client.post('/api/assignments',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'user_id': user3_id,
                'location_id': test_location['id'],
                'time_slot_id': test_time_slot['id'],
                'week_start_date': week_start_str
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'OVER_MAX_WORKERS'
    
    def test_create_assignment_prevents_overlap(self, client, admin_token, test_user, test_location, test_time_slot):
        """Test that creating assignment prevents overlapping shifts."""
        with client.application.app_context():
            from database import db
            
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create existing assignment
            assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            db.session.add(assignment)
            db.session.commit()
        
        week_start_str = week_start.isoformat()
        response = client.post('/api/assignments',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'user_id': test_user['id'],
                'location_id': test_location['id'],
                'time_slot_id': test_time_slot['id'],
                'week_start_date': week_start_str
            }
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert data['error'] == 'OVERLAP_FOR_USER'


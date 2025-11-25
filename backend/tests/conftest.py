"""
Pytest configuration and fixtures for MuleScheduler tests.
"""
import pytest
from app import app, db
from models import User, Location, TimeSlot, GlobalSettings
from datetime import time

@pytest.fixture
def test_app():
    """Create a test Flask application."""
    # Use in-memory SQLite for testing
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    with app.app_context():
        db.create_all()
        # Initialize default settings
        if GlobalSettings.query.first() is None:
            default_settings = GlobalSettings(
                max_workers_per_shift=3,
                max_hours_per_user_per_week=None
            )
            db.session.add(default_settings)
            db.session.commit()
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    """Create a test client for making requests."""
    return test_app.test_client()

@pytest.fixture
def test_user(test_app):
    """Create a test user."""
    with test_app.app_context():
        user = User(
            name='Test User',
            email='test@colby.edu',
            role='user'
        )
        db.session.add(user)
        db.session.commit()
        return user

@pytest.fixture
def test_admin(test_app):
    """Create a test admin user."""
    with test_app.app_context():
        admin = User(
            name='Test Admin',
            email='admin@colby.edu',
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()
        return admin

@pytest.fixture
def test_location(test_app):
    """Create a test location."""
    with test_app.app_context():
        # Check if location already exists
        existing = Location.query.filter_by(name='Test Location').first()
        if existing:
            return existing
        
        location = Location(
            name='Test Location',
            description='A test location',
            is_active=True
        )
        db.session.add(location)
        db.session.commit()
        return location

@pytest.fixture
def test_time_slot(test_app):
    """Create a test time slot (Monday, 9am-5pm)."""
    with test_app.app_context():
        # Check if time slot already exists
        existing = TimeSlot.query.filter_by(
            day_of_week=0,
            start_time=time(9, 0),
            end_time=time(17, 0)
        ).first()
        if existing:
            return existing
        
        time_slot = TimeSlot(
            day_of_week=0,  # Monday
            start_time=time(9, 0),
            end_time=time(17, 0)
        )
        db.session.add(time_slot)
        db.session.commit()
        return time_slot

@pytest.fixture
def auth_token(client, test_user):
    """Get an auth token for a test user."""
    response = client.post('/api/auth/login', json={
        'email': test_user.email,
        'role': test_user.role
    })
    data = response.get_json()
    return data['token']

@pytest.fixture
def admin_token(client, test_admin):
    """Get an auth token for a test admin."""
    response = client.post('/api/auth/login', json={
        'email': test_admin.email,
        'role': test_admin.role
    })
    data = response.get_json()
    return data['token']


"""
Functional tests for authentication endpoints.
"""
import pytest
from models import User

class TestAuthLogin:
    """Test /api/auth/login endpoint."""
    
    def test_login_with_new_user(self, client):
        """Test login creates a new user if email doesn't exist."""
        response = client.post('/api/auth/login', json={
            'email': 'newuser@colby.edu',
            'role': 'user'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert 'user' in data
        assert data['user']['email'] == 'newuser@colby.edu'
        assert data['user']['role'] == 'user'
    
    def test_login_with_existing_user(self, client, test_user):
        """Test login with existing user returns token."""
        response = client.post('/api/auth/login', json={
            'email': test_user.email,
            'role': test_user.role
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'token' in data
        assert data['user']['id'] == test_user.id
    
    def test_login_missing_email(self, client):
        """Test login without email returns 400."""
        response = client.post('/api/auth/login', json={
            'role': 'user'
        })
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
    
    def test_login_updates_role(self, client, test_user):
        """Test login updates user role if different."""
        assert test_user.role == 'user'
        
        response = client.post('/api/auth/login', json={
            'email': test_user.email,
            'role': 'admin'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['user']['role'] == 'admin'

class TestAuthMe:
    """Test /api/auth/me endpoint."""
    
    def test_get_current_user_with_valid_token(self, client, auth_token):
        """Test getting current user with valid token."""
        response = client.get('/api/auth/me', headers={
            'Authorization': f'Bearer {auth_token}'
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'id' in data
        assert 'email' in data
        assert 'role' in data
    
    def test_get_current_user_without_token(self, client):
        """Test getting current user without token returns 401."""
        response = client.get('/api/auth/me')
        
        assert response.status_code == 401
        data = response.get_json()
        assert 'error' in data
    
    def test_get_current_user_with_invalid_token(self, client):
        """Test getting current user with invalid token returns 401."""
        response = client.get('/api/auth/me', headers={
            'Authorization': 'Bearer invalid-token'
        })
        
        assert response.status_code == 401


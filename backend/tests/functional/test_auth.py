"""
Functional tests for authentication endpoints.
"""

import os
from unittest.mock import MagicMock, patch

import pytest


class TestAuthMe:
    """Test /api/auth/me endpoint."""

    def test_get_current_user_with_valid_token(self, client, auth_token, test_user):
        """Test getting current user with valid test token."""
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {auth_token}"})

        assert response.status_code == 200
        data = response.get_json()
        assert "id" in data
        assert data["email"] == test_user["email"]
        assert "role" in data

    def test_get_current_user_without_token(self, client):
        """Test getting current user without token returns 401."""
        response = client.get("/api/auth/me")

        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data

    def test_get_current_user_with_invalid_token(self, client):
        """Test getting current user with invalid token returns 401."""
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})

        assert response.status_code == 401

    def test_get_current_user_creates_new_user(self, client):
        """Test that /me endpoint creates user from valid @colby.edu email via test token."""
        token_resp = client.post(
            "/api/auth/test-token", json={"email": "newuser@colby.edu", "name": "New User"}
        )
        test_token = token_resp.get_json()["token"]
        response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {test_token}"})

        assert response.status_code == 200
        data = response.get_json()
        assert data["email"] == "newuser@colby.edu"
        assert data["name"] == "New User"
        assert data["role"] == "user"  # Default role

    def test_get_current_user_rejects_non_colby_email(self, client):
        """Test that /me endpoint rejects non-@colby.edu emails."""
        token_resp = client.post(
            "/api/auth/test-token", json={"email": "user@example.com", "name": "Test User"}
        )
        assert token_resp.status_code == 403

        # Direct call to /me with invalid token should still 401/403
        response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid-token"})

        assert response.status_code in (401, 403)


class TestGoogleLogin:
    """Test /api/auth/google/login endpoint."""

    @patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "", "GOOGLE_CLIENT_SECRET": ""})
    def test_google_login_not_configured(self, client):
        """Test that google login returns error when OAuth not configured."""
        # The GOOGLE_CLIENT_ID is read at module load time, so we need to patch it differently
        with patch("routes.auth.GOOGLE_CLIENT_ID", ""):
            response = client.get("/api/auth/google/login")
            assert response.status_code == 500
            data = response.get_json()
            assert "error" in data
            assert "not configured" in data["error"]

    @patch("routes.auth.GOOGLE_CLIENT_ID", "test-client-id")
    @patch("routes.auth.GOOGLE_CLIENT_SECRET", "test-client-secret")
    @patch("routes.auth._google_flow")
    def test_google_login_redirects(self, mock_flow, client):
        """Test that google login redirects to Google OAuth."""
        mock_flow_instance = MagicMock()
        mock_flow_instance.authorization_url.return_value = (
            "https://accounts.google.com/o/oauth2/auth?test=1",
            "test-state",
        )
        mock_flow.return_value = mock_flow_instance

        response = client.get("/api/auth/google/login")
        assert response.status_code == 302
        assert "accounts.google.com" in response.location


class TestGoogleCallback:
    """Test /api/auth/google/callback endpoint."""

    def test_callback_without_session_state(self, client):
        """Test callback returns error when session state is missing."""
        response = client.get("/api/auth/google/callback?code=test-code&state=test-state")
        assert response.status_code == 302
        assert "error=session_expired" in response.location

    @patch("routes.auth._google_flow")
    @patch("routes.auth.verify_google_token")
    def test_callback_with_invalid_token(self, mock_verify, mock_flow, client):
        """Test callback returns error when token is invalid."""
        mock_flow_instance = MagicMock()
        mock_flow_instance.credentials = MagicMock()
        mock_flow_instance.credentials.id_token = "invalid-token"
        mock_flow.return_value = mock_flow_instance
        mock_verify.return_value = None

        with client.session_transaction() as sess:
            sess["oauth_state"] = "test-state"

        response = client.get("/api/auth/google/callback?code=test&state=test-state")
        assert response.status_code == 302
        assert "error=invalid_token" in response.location

    @patch("routes.auth._google_flow")
    @patch("routes.auth.verify_google_token")
    def test_callback_with_non_colby_email(self, mock_verify, mock_flow, client):
        """Test callback rejects non-colby emails."""
        mock_flow_instance = MagicMock()
        mock_flow_instance.credentials = MagicMock()
        mock_flow_instance.credentials.id_token = "valid-token"
        mock_flow.return_value = mock_flow_instance
        mock_verify.return_value = {"email": "user@gmail.com", "name": "Test User"}

        with client.session_transaction() as sess:
            sess["oauth_state"] = "test-state"

        response = client.get("/api/auth/google/callback?code=test&state=test-state")
        assert response.status_code == 302
        assert "error=colby_email_required" in response.location

    @patch("routes.auth._google_flow")
    @patch("routes.auth.verify_google_token")
    def test_callback_success(self, mock_verify, mock_flow, client):
        """Test successful OAuth callback."""
        mock_flow_instance = MagicMock()
        mock_flow_instance.credentials = MagicMock()
        mock_flow_instance.credentials.id_token = "valid-token"
        mock_flow.return_value = mock_flow_instance
        mock_verify.return_value = {"email": "callback.user@colby.edu", "name": "Callback User"}

        with client.session_transaction() as sess:
            sess["oauth_state"] = "test-state"

        response = client.get("/api/auth/google/callback?code=test&state=test-state")
        assert response.status_code == 302
        assert "token=" in response.location
        assert "error" not in response.location

    @patch("routes.auth._google_flow")
    def test_callback_exception(self, mock_flow, client):
        """Test callback handles exceptions gracefully."""
        mock_flow_instance = MagicMock()
        mock_flow_instance.fetch_token.side_effect = Exception("OAuth error")
        mock_flow.return_value = mock_flow_instance

        with client.session_transaction() as sess:
            sess["oauth_state"] = "test-state"

        response = client.get("/api/auth/google/callback?code=test&state=test-state")
        assert response.status_code == 302
        assert "error=auth_failed" in response.location


class TestTestToken:
    """Test /api/auth/test-token endpoint."""

    def test_test_token_success(self, client):
        """Test creating a test token."""
        response = client.post("/api/auth/test-token", json={"email": "testtoken@colby.edu"})
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "testtoken@colby.edu"

    def test_test_token_missing_email(self, client):
        """Test test-token with missing email."""
        response = client.post("/api/auth/test-token", json={})
        assert response.status_code == 400
        data = response.get_json()
        assert "error" in data

    def test_test_token_non_colby_email(self, client):
        """Test test-token rejects non-colby email."""
        response = client.post("/api/auth/test-token", json={"email": "user@gmail.com"})
        assert response.status_code == 403

    @patch("routes.auth.ALLOW_TEST_TOKENS", False)
    def test_test_token_disabled(self, client):
        """Test test-token returns 404 when disabled."""
        response = client.post("/api/auth/test-token", json={"email": "test@colby.edu"})
        assert response.status_code == 404

    def test_test_token_auto_generates_name(self, client):
        """Test test-token auto-generates name from email."""
        response = client.post("/api/auth/test-token", json={"email": "john.doe@colby.edu"})
        assert response.status_code == 200
        data = response.get_json()
        # Name should be derived from email
        assert "user" in data


class TestEnsureUserFromClaims:
    """Test ensure_user_from_claims helper function."""

    def test_creates_name_from_email_when_name_equals_email(self, client):
        """Test that name is derived from email when name matches email."""
        response = client.post(
            "/api/auth/test-token",
            json={"email": "first.last@colby.edu", "name": "first.last@colby.edu"},
        )
        assert response.status_code == 200
        data = response.get_json()
        # Name should be derived since name == email
        assert data["user"]["name"] != "first.last@colby.edu"

    def test_updates_existing_user_name(self, client):
        """Test that existing user name gets updated."""
        # First create user
        client.post(
            "/api/auth/test-token", json={"email": "updatename@colby.edu", "name": "Old Name"}
        )
        # Create again with new name
        response = client.post(
            "/api/auth/test-token", json={"email": "updatename@colby.edu", "name": "New Name"}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["user"]["name"] == "New Name"


class TestVerifyGoogleToken:
    """Test verify_google_token function."""

    def test_verify_invalid_token(self, client):
        """Test that invalid Google token returns None."""
        from routes.auth import verify_google_token

        result = verify_google_token("invalid-token")
        assert result is None

    @patch("routes.auth.id_token.verify_oauth2_token")
    def test_verify_valid_token(self, mock_verify, client):
        """Test that valid Google token returns claims."""
        from routes.auth import verify_google_token

        mock_verify.return_value = {"email": "test@colby.edu", "name": "Test"}
        result = verify_google_token("valid-token")
        assert result is not None
        assert result["email"] == "test@colby.edu"


class TestGetCurrentUserHelper:
    """Test get_current_user helper function edge cases."""

    def test_get_current_user_empty_token(self, client):
        """Test get_current_user with empty Bearer token."""
        response = client.get("/api/users/me", headers={"Authorization": "Bearer "})
        assert response.status_code == 401

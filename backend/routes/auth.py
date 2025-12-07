import os
import secrets

from flask import Blueprint, jsonify, redirect, request, session
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow

from database import db
from models import User

# Allow HTTP for local development (required for OAuth on localhost)
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get(
    "GOOGLE_REDIRECT_URI", "http://localhost:5000/api/auth/google/callback"
)
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
ALLOW_TEST_TOKENS = os.environ.get("ALLOW_TEST_TOKENS", "true").lower() == "true"

# Simple in-memory token storage for app-issued tokens
app_tokens = {}  # token -> user_id


def _google_flow(state: str | None = None) -> Flow:
    """Create a Google OAuth Flow instance."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        state=state,
        redirect_uri=GOOGLE_REDIRECT_URI,
    )
    return flow


def verify_google_token(token: str):
    """Verify a Google ID token and return claims."""
    try:
        return id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)
    except Exception:
        return None


def ensure_user_from_claims(claims):
    """Create or update user from Google claims."""
    email = claims.get("email", "").lower()
    name = claims.get("name", "") or claims.get("given_name", "") or email

    # Enforce @colby.edu emails
    if not email.endswith("@colby.edu"):
        return None

    # Derive a nice name if needed
    if not name or name == email:
        name = email.split("@")[0].replace(".", " ").title()

    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(name=name, email=email, role="user")
        db.session.add(user)
        db.session.commit()
    else:
        if user.name != name:
            user.name = name
            db.session.commit()

    return user


@bp.route("/google/login", methods=["GET"])
def google_login():
    """Begin Google OAuth flow."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return (
            jsonify(
                {
                    "error": "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
                }
            ),
            500,
        )

    flow = _google_flow()
    authorization_url, state = flow.authorization_url(
        prompt="consent", include_granted_scopes="true", access_type="offline"
    )
    session["oauth_state"] = state
    return redirect(authorization_url)


@bp.route("/google/callback", methods=["GET"])
def google_callback():
    """Handle Google OAuth callback."""
    try:
        state = session.get("oauth_state")
        if not state:
            return redirect(f"{FRONTEND_ORIGIN}/login?error=session_expired")

        flow = _google_flow(state=state)

        # Reconstruct the authorization response URL to ensure it's correct
        # Use the actual callback URL with the query parameters
        auth_response = request.url
        if auth_response.startswith("http://"):
            # Keep as HTTP for localhost
            pass

        flow.fetch_token(authorization_response=auth_response)

        credentials = flow.credentials
        claims = verify_google_token(credentials.id_token)
        if not claims:
            return redirect(f"{FRONTEND_ORIGIN}/login?error=invalid_token")

        user = ensure_user_from_claims(claims)
        if not user:
            return redirect(f"{FRONTEND_ORIGIN}/login?error=colby_email_required")

        # Issue app token and redirect to frontend with token
        app_token = secrets.token_urlsafe(32)
        app_tokens[app_token] = user.id

        # Clear the OAuth state from session
        session.pop("oauth_state", None)

        redirect_url = f"{FRONTEND_ORIGIN}/login?token={app_token}"
        return redirect(redirect_url)

    except Exception as e:
        print(f"OAuth callback error: {e}")
        return redirect(f"{FRONTEND_ORIGIN}/login?error=auth_failed")


@bp.route("/me", methods=["GET"])
def me():
    """Get current user from app token or Google ID token."""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    # First, check app-issued tokens
    user_id = app_tokens.get(token)
    if user_id:
        user = User.query.get(user_id)
        if user:
            return jsonify(user.to_dict())

    # Fallback: accept raw Google ID token
    claims = verify_google_token(token)
    if not claims:
        return jsonify({"error": "Invalid token"}), 401

    user = ensure_user_from_claims(claims)
    if not user:
        return jsonify({"error": "Unauthorized: Must use @colby.edu email"}), 403

    return jsonify(user.to_dict())


def get_current_user(request):
    """Helper to resolve current user for protected routes."""
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None

    # Check app tokens
    user_id = app_tokens.get(token)
    if user_id:
        return User.query.get(user_id)

    # Check Google ID token directly
    claims = verify_google_token(token)
    if not claims:
        return None

    return ensure_user_from_claims(claims)


@bp.route("/test-token", methods=["POST"])
def test_token():
    """Issue a test token (only when ALLOW_TEST_TOKENS is enabled)."""
    if not ALLOW_TEST_TOKENS:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    email = (data.get("email") or "").lower()
    name = data.get("name") or email.split("@")[0].replace(".", " ").title()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    claims = {"email": email, "name": name}
    user = ensure_user_from_claims(claims)
    if not user:
        return jsonify({"error": "Unauthorized: Must use @colby.edu email"}), 403

    token = secrets.token_urlsafe(32)
    app_tokens[token] = user.id
    return jsonify({"token": token, "user": user.to_dict()})

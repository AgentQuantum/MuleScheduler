from flask import Blueprint, request, jsonify
from database import db
from models import User
import secrets

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Simple in-memory token storage (replace with proper session management later)
tokens = {}  # token -> user_id

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    role = data.get('role', 'user')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    # Find or create user
    user = User.query.filter_by(email=email).first()
    if not user:
        # Create new user
        user = User(
            name=email.split('@')[0].replace('.', ' ').title(),
            email=email,
            role=role
        )
        db.session.add(user)
        db.session.commit()
    else:
        # Update role if different (for testing)
        if user.role != role:
            user.role = role
            db.session.commit()
    
    # Generate simple token
    token = secrets.token_urlsafe(32)
    tokens[token] = user.id
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    })

@bp.route('/me', methods=['GET'])
def me():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token or token not in tokens:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = tokens[token]
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())

def get_current_user(request):
    """Helper function to get current user from token"""
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token or token not in tokens:
        return None
    user_id = tokens[token]
    return User.query.get(user_id)


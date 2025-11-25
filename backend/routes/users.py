from flask import Blueprint, request, jsonify
from database import db
from models import User
from routes.auth import get_current_user

bp = Blueprint('users', __name__, url_prefix='/api/users')

@bp.route('/me', methods=['GET'])
def get_me():
    user = get_current_user(request)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(user.to_dict())

@bp.route('', methods=['GET'])
def get_users():
    user = get_current_user(request)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    if user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


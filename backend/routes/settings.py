from flask import Blueprint, request, jsonify
from database import db
from models import GlobalSettings
from routes.auth import get_current_user

bp = Blueprint('settings', __name__, url_prefix='/api/settings')

@bp.route('', methods=['GET'])
def get_settings():
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    settings = GlobalSettings.query.first()
    if not settings:
        settings = GlobalSettings(max_workers_per_shift=3, max_hours_per_user_per_week=None)
        db.session.add(settings)
        db.session.commit()
    
    return jsonify(settings.to_dict())

@bp.route('', methods=['PUT'])
def update_settings():
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    settings = GlobalSettings.query.first()
    if not settings:
        settings = GlobalSettings()
        db.session.add(settings)
    
    data = request.get_json()
    if 'max_workers_per_shift' in data:
        settings.max_workers_per_shift = data['max_workers_per_shift']
    if 'max_hours_per_user_per_week' in data:
        settings.max_hours_per_user_per_week = data.get('max_hours_per_user_per_week')
    
    db.session.commit()
    return jsonify(settings.to_dict())


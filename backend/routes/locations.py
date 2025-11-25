from flask import Blueprint, request, jsonify
from database import db
from models import Location
from routes.auth import get_current_user

bp = Blueprint('locations', __name__, url_prefix='/api/locations')

@bp.route('', methods=['GET'])
def get_locations():
    locations = Location.query.filter_by(is_active=True).all()
    return jsonify([loc.to_dict() for loc in locations])

@bp.route('', methods=['POST'])
def create_location():
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    data = request.get_json()
    location = Location(
        name=data.get('name'),
        description=data.get('description'),
        is_active=True
    )
    db.session.add(location)
    db.session.commit()
    return jsonify(location.to_dict()), 201

@bp.route('/<int:location_id>', methods=['PUT'])
def update_location(location_id):
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    location = Location.query.get_or_404(location_id)
    data = request.get_json()
    
    if 'name' in data:
        location.name = data['name']
    if 'description' in data:
        location.description = data.get('description')
    if 'is_active' in data:
        location.is_active = data['is_active']
    
    db.session.commit()
    return jsonify(location.to_dict())

@bp.route('/<int:location_id>', methods=['DELETE'])
def delete_location(location_id):
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    location = Location.query.get_or_404(location_id)
    location.is_active = False  # Soft delete
    db.session.commit()
    return jsonify({'message': 'Location deleted'})


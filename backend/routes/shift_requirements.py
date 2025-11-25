from flask import Blueprint, request, jsonify
from database import db
from models import ShiftRequirement
from routes.auth import get_current_user
from datetime import datetime

bp = Blueprint('shift_requirements', __name__, url_prefix='/api/shift-requirements')

@bp.route('', methods=['GET'])
def get_shift_requirements():
    week_start = request.args.get('week_start')
    if week_start:
        week_start_date = datetime.fromisoformat(week_start).date()
        requirements = ShiftRequirement.query.filter_by(week_start_date=week_start_date).all()
    else:
        requirements = ShiftRequirement.query.all()
    
    return jsonify([req.to_dict() for req in requirements])

@bp.route('', methods=['POST'])
def create_shift_requirement():
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    data = request.get_json()
    week_start_date = datetime.fromisoformat(data.get('week_start_date')).date()
    
    # Check if requirement already exists
    existing = ShiftRequirement.query.filter_by(
        location_id=data.get('location_id'),
        time_slot_id=data.get('time_slot_id'),
        week_start_date=week_start_date
    ).first()
    
    if existing:
        existing.required_workers = data.get('required_workers')
        existing.created_by = user.id
        db.session.commit()
        return jsonify(existing.to_dict())
    
    requirement = ShiftRequirement(
        location_id=data.get('location_id'),
        time_slot_id=data.get('time_slot_id'),
        week_start_date=week_start_date,
        required_workers=data.get('required_workers'),
        created_by=user.id
    )
    db.session.add(requirement)
    db.session.commit()
    return jsonify(requirement.to_dict()), 201

@bp.route('/<int:req_id>', methods=['PUT'])
def update_shift_requirement(req_id):
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    requirement = ShiftRequirement.query.get_or_404(req_id)
    data = request.get_json()
    
    if 'required_workers' in data:
        requirement.required_workers = data['required_workers']
    if 'location_id' in data:
        requirement.location_id = data['location_id']
    if 'time_slot_id' in data:
        requirement.time_slot_id = data['time_slot_id']
    if 'week_start_date' in data:
        requirement.week_start_date = datetime.fromisoformat(data['week_start_date']).date()
    
    db.session.commit()
    return jsonify(requirement.to_dict())

@bp.route('/<int:req_id>', methods=['DELETE'])
def delete_shift_requirement(req_id):
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    requirement = ShiftRequirement.query.get_or_404(req_id)
    db.session.delete(requirement)
    db.session.commit()
    return jsonify({'message': 'Shift requirement deleted'})


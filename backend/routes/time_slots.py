from flask import Blueprint, request, jsonify
from database import db
from models import TimeSlot
from routes.auth import get_current_user
from datetime import time

bp = Blueprint('time_slots', __name__, url_prefix='/api/time-slots')

@bp.route('', methods=['GET'])
def get_time_slots():
    slots = TimeSlot.query.all()
    return jsonify([slot.to_dict() for slot in slots])

@bp.route('', methods=['POST'])
def create_time_slot():
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    data = request.get_json()
    start_time_str = data.get('start_time')
    end_time_str = data.get('end_time')
    
    # Parse time strings (format: "HH:MM" or "HH:MM:SS")
    start_time = time.fromisoformat(start_time_str) if ':' in start_time_str else time.fromisoformat(start_time_str + ':00')
    end_time = time.fromisoformat(end_time_str) if ':' in end_time_str else time.fromisoformat(end_time_str + ':00')
    
    time_slot = TimeSlot(
        day_of_week=data.get('day_of_week'),
        start_time=start_time,
        end_time=end_time
    )
    db.session.add(time_slot)
    db.session.commit()
    return jsonify(time_slot.to_dict()), 201

@bp.route('/<int:slot_id>', methods=['PUT'])
def update_time_slot(slot_id):
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    time_slot = TimeSlot.query.get_or_404(slot_id)
    data = request.get_json()
    
    if 'day_of_week' in data:
        time_slot.day_of_week = data['day_of_week']
    if 'start_time' in data:
        start_time_str = data['start_time']
        time_slot.start_time = time.fromisoformat(start_time_str) if ':' in start_time_str else time.fromisoformat(start_time_str + ':00')
    if 'end_time' in data:
        end_time_str = data['end_time']
        time_slot.end_time = time.fromisoformat(end_time_str) if ':' in end_time_str else time.fromisoformat(end_time_str + ':00')
    
    db.session.commit()
    return jsonify(time_slot.to_dict())

@bp.route('/<int:slot_id>', methods=['DELETE'])
def delete_time_slot(slot_id):
    user = get_current_user(request)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    
    time_slot = TimeSlot.query.get_or_404(slot_id)
    db.session.delete(time_slot)
    db.session.commit()
    return jsonify({'message': 'Time slot deleted'})


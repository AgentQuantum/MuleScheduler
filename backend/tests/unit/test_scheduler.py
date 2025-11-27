"""
Unit tests for scheduler service functions.
"""
import pytest
from datetime import date, time, timedelta
from models import (
    User, Location, TimeSlot, GlobalSettings, 
    UserAvailability, Assignment, ShiftRequirement
)
from services.scheduler import (
    calculate_hours, get_user_total_hours, has_overlapping_assignment,
    get_current_assignment_count, cleanup_orphaned_records, run_auto_scheduler
)
from database import db


class TestCalculateHours:
    """Test calculate_hours function."""
    
    def test_calculate_hours_normal_shift(self, test_app):
        """Test calculating hours for a normal 8-hour shift."""
        with test_app.app_context():
            time_slot = TimeSlot(
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(17, 0)
            )
            hours = calculate_hours(time_slot)
            assert hours == 8.0
    
    def test_calculate_hours_partial_shift(self, test_app):
        """Test calculating hours for a 4-hour shift."""
        with test_app.app_context():
            time_slot = TimeSlot(
                day_of_week=0,
                start_time=time(10, 0),
                end_time=time(14, 0)
            )
            hours = calculate_hours(time_slot)
            assert hours == 4.0
    
    def test_calculate_hours_overnight_shift(self, test_app):
        """Test calculating hours for an overnight shift."""
        with test_app.app_context():
            time_slot = TimeSlot(
                day_of_week=0,
                start_time=time(22, 0),  # 10 PM
                end_time=time(6, 0)      # 6 AM next day
            )
            hours = calculate_hours(time_slot)
            assert hours == 8.0
    
    def test_calculate_hours_30_minute_shift(self, test_app):
        """Test calculating hours for a 30-minute shift."""
        with test_app.app_context():
            time_slot = TimeSlot(
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(9, 30)
            )
            hours = calculate_hours(time_slot)
            assert hours == 0.5


class TestGetUserTotalHours:
    """Test get_user_total_hours function."""
    
    def test_get_user_total_hours_no_assignments(self, test_app, test_user):
        """Test getting hours when user has no assignments."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            total = get_user_total_hours(test_user['id'], week_start)
            assert total == 0
    
    def test_get_user_total_hours_single_assignment(self, test_app, test_user, test_location, test_time_slot):
        """Test getting hours for user with one assignment."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create assignment
            assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            db.session.add(assignment)
            db.session.commit()
            
            total = get_user_total_hours(test_user['id'], week_start)
            assert total == 8.0  # 9am-5pm = 8 hours
    
    def test_get_user_total_hours_multiple_assignments(self, test_app, test_user, test_location):
        """Test getting hours for user with multiple assignments."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create two time slots
            slot1 = TimeSlot(day_of_week=0, start_time=time(9, 0), end_time=time(12, 0))
            slot2 = TimeSlot(day_of_week=0, start_time=time(13, 0), end_time=time(17, 0))
            db.session.add_all([slot1, slot2])
            db.session.commit()
            
            # Create assignments
            assignment1 = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=slot1.id,
                week_start_date=week_start
            )
            assignment2 = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=slot2.id,
                week_start_date=week_start
            )
            db.session.add_all([assignment1, assignment2])
            db.session.commit()
            
            total = get_user_total_hours(test_user['id'], week_start)
            assert total == 7.0  # 3 + 4 hours
    
    def test_get_user_total_hours_orphaned_assignment(self, test_app, test_user, test_location):
        """Test that orphaned assignments (invalid time slot) are skipped."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create assignment with invalid time_slot_id to simulate orphaned record
            # This simulates a time slot that was deleted but assignment still references it
            assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=99999,  # Non-existent time slot ID
                week_start_date=week_start
            )
            db.session.add(assignment)
            db.session.commit()
            
            # The function should handle None time_slot gracefully
            # When accessing assignment.time_slot with invalid ID, it will be None
            total = get_user_total_hours(test_user['id'], week_start)
            # Since the time_slot doesn't exist, accessing it will return None
            # and the function should skip it
            assert total == 0


class TestHasOverlappingAssignment:
    """Test has_overlapping_assignment function."""
    
    def test_has_overlapping_assignment_no_overlap(self, test_app, test_user, test_location, test_time_slot):
        """Test when user has no overlapping assignment."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            has_overlap = has_overlapping_assignment(
                test_user['id'], test_time_slot['id'], test_location['id'], week_start
            )
            assert has_overlap is False
    
    def test_has_overlapping_assignment_with_overlap(self, test_app, test_user, test_location, test_time_slot):
        """Test when user has an overlapping assignment."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create assignment
            assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            db.session.add(assignment)
            db.session.commit()
            
            has_overlap = has_overlapping_assignment(
                test_user['id'], test_time_slot['id'], test_location['id'], week_start
            )
            assert has_overlap is True


class TestGetCurrentAssignmentCount:
    """Test get_current_assignment_count function."""
    
    def test_get_current_assignment_count_empty(self, test_app, test_location, test_time_slot):
        """Test getting count when no assignments exist."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            count = get_current_assignment_count(
                test_time_slot['id'], test_location['id'], week_start
            )
            assert count == 0
    
    def test_get_current_assignment_count_multiple(self, test_app, test_location, test_time_slot):
        """Test getting count with multiple assignments."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create multiple users and assignments
            user1 = User(name='User 1', email='user1@colby.edu', role='user')
            user2 = User(name='User 2', email='user2@colby.edu', role='user')
            user3 = User(name='User 3', email='user3@colby.edu', role='user')
            db.session.add_all([user1, user2, user3])
            db.session.commit()
            
            assignment1 = Assignment(
                user_id=user1.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            assignment2 = Assignment(
                user_id=user2.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            assignment3 = Assignment(
                user_id=user3.id,
                location_id=test_location['id'],
                time_slot_id=test_time_slot['id'],
                week_start_date=week_start
            )
            db.session.add_all([assignment1, assignment2, assignment3])
            db.session.commit()
            
            count = get_current_assignment_count(
                test_time_slot['id'], test_location['id'], week_start
            )
            assert count == 3


class TestCleanupOrphanedRecords:
    """Test cleanup_orphaned_records function."""
    
    def test_cleanup_orphaned_availabilities(self, test_app, test_user, test_location):
        """Test cleaning up orphaned availabilities."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create availability with invalid time_slot_id to simulate orphaned record
            availability = UserAvailability(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=99999,  # Non-existent time slot ID
                week_start_date=week_start
            )
            db.session.add(availability)
            db.session.commit()
            
            avail_id = availability.id
            
            # Run cleanup - should delete orphaned availability
            cleanup_orphaned_records()
            
            # Availability should be deleted
            remaining = UserAvailability.query.filter_by(id=avail_id).first()
            assert remaining is None
    
    def test_cleanup_orphaned_assignments(self, test_app, test_user, test_location):
        """Test cleaning up orphaned assignments."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create assignment with invalid time_slot_id to simulate orphaned record
            assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=99999,  # Non-existent time slot ID
                week_start_date=week_start
            )
            db.session.add(assignment)
            db.session.commit()
            
            assign_id = assignment.id
            
            # Run cleanup - should delete orphaned assignment
            cleanup_orphaned_records()
            
            # Assignment should be deleted
            remaining = Assignment.query.filter_by(id=assign_id).first()
            assert remaining is None
    
    def test_cleanup_when_no_time_slots(self, test_app, test_user, test_location):
        """Test cleanup when no time slots exist."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create orphaned records (time slot was deleted)
            availability = UserAvailability(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=999,  # Non-existent time slot
                week_start_date=week_start
            )
            assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=999,  # Non-existent time slot
                week_start_date=week_start
            )
            db.session.add_all([availability, assignment])
            db.session.commit()
            
            # Delete all time slots
            TimeSlot.query.delete()
            db.session.commit()
            
            # Run cleanup (no time slots exist)
            cleanup_orphaned_records()
            
            # All records should be deleted
            assert UserAvailability.query.count() == 0
            assert Assignment.query.count() == 0
    
    def test_cleanup_with_valid_time_slots(self, test_app, test_user, test_location):
        """Test cleanup when some time slots exist but records reference invalid ones."""
        with test_app.app_context():
            week_start = date.today() - timedelta(days=date.today().weekday())
            
            # Create a valid time slot
            valid_slot = TimeSlot(day_of_week=0, start_time=time(9, 0), end_time=time(17, 0))
            db.session.add(valid_slot)
            db.session.commit()
            
            # Create valid availability
            valid_availability = UserAvailability(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=valid_slot.id,
                week_start_date=week_start
            )
            
            # Create orphaned availability
            orphaned_availability = UserAvailability(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=99999,  # Invalid time slot
                week_start_date=week_start
            )
            
            # Create orphaned assignment
            orphaned_assignment = Assignment(
                user_id=test_user['id'],
                location_id=test_location['id'],
                time_slot_id=99999,  # Invalid time slot
                week_start_date=week_start
            )
            
            db.session.add_all([valid_availability, orphaned_availability, orphaned_assignment])
            db.session.commit()
            
            # Run cleanup
            cleanup_orphaned_records()
            
            # Valid records should remain, orphaned ones should be deleted
            assert UserAvailability.query.count() == 1
            assert Assignment.query.count() == 0
            assert UserAvailability.query.first().time_slot_id == valid_slot.id

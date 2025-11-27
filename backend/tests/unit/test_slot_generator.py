"""
Comprehensive tests for slot generator service.
Tests all slot generation functions.
"""
import pytest
from app import app, db
from models import DaySchedule, TimeSlot
from services.slot_generator import (
    generate_slots_for_day,
    delete_slots_for_day,
    regenerate_slots_for_day,
    regenerate_all_slots,
    count_slots_for_day,
    preview_slots
)
from datetime import time


class TestGenerateSlotsForDay:
    """Tests for generate_slots_for_day function."""

    def test_generate_slots_creates_correct_count(self, test_app):
        """Generates correct number of slots."""
        with test_app.app_context():
            # 9:00 to 12:00 with 30 min slots = 6 slots
            schedule = DaySchedule(
                day_of_week=0,
                start_time=time(9, 0),
                end_time=time(12, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            
            slots = generate_slots_for_day(schedule)
            assert len(slots) == 6

    def test_generate_slots_does_not_duplicate(self, test_app):
        """Does not create duplicate slots."""
        with test_app.app_context():
            schedule = DaySchedule(
                day_of_week=1,
                start_time=time(9, 0),
                end_time=time(10, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            
            # Generate twice
            slots1 = generate_slots_for_day(schedule)
            slots2 = generate_slots_for_day(schedule)
            
            # Second call should return empty (no new slots)
            assert len(slots1) == 2
            assert len(slots2) == 0

    def test_generate_slots_different_duration(self, test_app):
        """Works with different slot durations."""
        with test_app.app_context():
            # 9:00 to 11:00 with 60 min slots = 2 slots
            schedule = DaySchedule(
                day_of_week=2,
                start_time=time(9, 0),
                end_time=time(11, 0),
                slot_duration_minutes=60,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            
            slots = generate_slots_for_day(schedule)
            assert len(slots) == 2


class TestDeleteSlotsForDay:
    """Tests for delete_slots_for_day function."""

    def test_delete_slots_for_day(self, test_app):
        """Deletes all slots for a specific day."""
        with test_app.app_context():
            # Create slots for day 3
            for i in range(3):
                slot = TimeSlot(
                    day_of_week=3,
                    start_time=time(9 + i, 0),
                    end_time=time(10 + i, 0)
                )
                db.session.add(slot)
            db.session.commit()
            
            count = delete_slots_for_day(3)
            assert count == 3
            assert TimeSlot.query.filter_by(day_of_week=3).count() == 0

    def test_delete_slots_for_nonexistent_day(self, test_app):
        """Returns 0 for day with no slots."""
        with test_app.app_context():
            count = delete_slots_for_day(6)  # Day with no slots
            assert count == 0


class TestRegenerateSlotsForDay:
    """Tests for regenerate_slots_for_day function."""

    def test_regenerate_slots_replaces_old(self, test_app):
        """Regenerate deletes old slots and creates new ones."""
        with test_app.app_context():
            # Create old slots for day 4
            old_slot = TimeSlot(
                day_of_week=4,
                start_time=time(8, 0),
                end_time=time(9, 0)
            )
            db.session.add(old_slot)
            db.session.commit()
            
            # Create schedule with different times
            schedule = DaySchedule(
                day_of_week=4,
                start_time=time(10, 0),
                end_time=time(12, 0),
                slot_duration_minutes=30,
                is_active=True
            )
            db.session.add(schedule)
            db.session.commit()
            
            slots = regenerate_slots_for_day(schedule)
            
            # Old slot should be gone, new slots created
            assert len(slots) == 4  # 10-12 with 30 min = 4 slots
            # Verify old slot is gone
            old = TimeSlot.query.filter_by(
                day_of_week=4,
                start_time=time(8, 0)
            ).first()
            assert old is None


class TestRegenerateAllSlots:
    """Tests for regenerate_all_slots function."""

    def test_regenerate_all_slots(self, test_app):
        """Regenerates all slots from active schedules."""
        with test_app.app_context():
            # Clear existing
            TimeSlot.query.delete()
            DaySchedule.query.delete()
            db.session.commit()
            
            # Create schedules for multiple days
            for day in [0, 1, 2]:
                schedule = DaySchedule(
                    day_of_week=day,
                    start_time=time(9, 0),
                    end_time=time(10, 0),
                    slot_duration_minutes=30,
                    is_active=True
                )
                db.session.add(schedule)
            
            # Create one inactive schedule
            inactive = DaySchedule(
                day_of_week=5,
                start_time=time(9, 0),
                end_time=time(17, 0),
                slot_duration_minutes=30,
                is_active=False
            )
            db.session.add(inactive)
            db.session.commit()
            
            result = regenerate_all_slots()
            
            assert result['created'] == 6  # 3 days * 2 slots each
            assert 'by_day' in result

    def test_regenerate_all_clears_existing(self, test_app):
        """Regenerate all clears existing slots first."""
        with test_app.app_context():
            # Create some manual slots
            manual = TimeSlot(
                day_of_week=6,
                start_time=time(8, 0),
                end_time=time(9, 0)
            )
            db.session.add(manual)
            db.session.commit()
            
            DaySchedule.query.delete()
            db.session.commit()
            
            result = regenerate_all_slots()
            
            # Manual slot should be deleted
            assert TimeSlot.query.filter_by(day_of_week=6).count() == 0


class TestCountSlotsForDay:
    """Tests for count_slots_for_day function."""

    def test_count_slots_for_day(self, test_app):
        """Counts slots correctly."""
        with test_app.app_context():
            # Create slots
            for i in range(5):
                slot = TimeSlot(
                    day_of_week=0,
                    start_time=time(9 + i, 0),
                    end_time=time(10 + i, 0)
                )
                db.session.add(slot)
            db.session.commit()
            
            count = count_slots_for_day(0)
            assert count >= 5

    def test_count_slots_empty_day(self, test_app):
        """Returns 0 for day with no slots."""
        with test_app.app_context():
            # Delete all slots for day 6
            TimeSlot.query.filter_by(day_of_week=6).delete()
            db.session.commit()
            
            count = count_slots_for_day(6)
            assert count == 0


class TestPreviewSlots:
    """Tests for preview_slots function."""

    def test_preview_slots_30_min(self):
        """Preview generates correct 30-min slots."""
        slots = preview_slots('09:00', '12:00', 30)
        assert len(slots) == 6
        assert slots[0]['start_time'] == '09:00'
        assert slots[0]['end_time'] == '09:30'
        assert slots[-1]['start_time'] == '11:30'
        assert slots[-1]['end_time'] == '12:00'

    def test_preview_slots_60_min(self):
        """Preview generates correct 60-min slots."""
        slots = preview_slots('09:00', '12:00', 60)
        assert len(slots) == 3

    def test_preview_slots_15_min(self):
        """Preview generates correct 15-min slots."""
        slots = preview_slots('09:00', '10:00', 15)
        assert len(slots) == 4

    def test_preview_slots_default_duration(self):
        """Default duration is 30 minutes."""
        slots = preview_slots('09:00', '10:00')
        assert len(slots) == 2

    def test_preview_slots_short_window(self):
        """Short window generates fewer slots."""
        slots = preview_slots('09:00', '09:30', 30)
        assert len(slots) == 1

    def test_preview_slots_exact_fit(self):
        """Exact fit generates expected slots."""
        slots = preview_slots('09:00', '11:00', 30)
        assert len(slots) == 4


from datetime import datetime, timedelta

from database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False, default="user")  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "is_active": self.is_active,
        }


class TimeSlot(db.Model):
    __tablename__ = "time_slots"

    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0-6, where 0 = Monday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M:%S"),
            "end_time": self.end_time.strftime("%H:%M:%S"),
        }

    def get_day_name(self):
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return days[self.day_of_week]


class GlobalSettings(db.Model):
    __tablename__ = "global_settings"

    id = db.Column(db.Integer, primary_key=True)
    max_workers_per_shift = db.Column(db.Integer, default=3, nullable=False)
    max_hours_per_user_per_week = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "max_workers_per_shift": self.max_workers_per_shift,
            "max_hours_per_user_per_week": self.max_hours_per_user_per_week,
        }


class DaySchedule(db.Model):
    """Defines the standard working hours for each day - time slots are auto-generated from this (Standard Week Template)"""

    __tablename__ = "day_schedules"

    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False, unique=True)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_duration_minutes = db.Column(db.Integer, default=30, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "slot_duration_minutes": self.slot_duration_minutes,
            "is_active": self.is_active,
        }

    def get_day_name(self):
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return days[self.day_of_week]


class WeeklyScheduleOverride(db.Model):
    """Week-specific overrides for day schedules (exceptions to the standard week)"""

    __tablename__ = "weekly_schedule_overrides"

    id = db.Column(db.Integer, primary_key=True)
    week_start_date = db.Column(db.Date, nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Monday, 6=Sunday
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    slot_duration_minutes = db.Column(db.Integer, default=30, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Unique constraint: one override per week/day combination
    __table_args__ = (
        db.UniqueConstraint("week_start_date", "day_of_week", name="unique_weekly_override"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "week_start_date": self.week_start_date.isoformat(),
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "slot_duration_minutes": self.slot_duration_minutes,
            "is_active": self.is_active,
        }

    def get_day_name(self):
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return days[self.day_of_week]


class ShiftRequirement(db.Model):
    __tablename__ = "shift_requirements"

    id = db.Column(db.Integer, primary_key=True)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey("time_slots.id"), nullable=False)
    week_start_date = db.Column(db.Date, nullable=False)
    required_workers = db.Column(db.Integer, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    location = db.relationship("Location", backref="shift_requirements")
    time_slot = db.relationship("TimeSlot", backref="shift_requirements")
    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        return {
            "id": self.id,
            "location_id": self.location_id,
            "time_slot_id": self.time_slot_id,
            "week_start_date": self.week_start_date.isoformat(),
            "required_workers": self.required_workers,
            "created_by": self.created_by,
        }


class UserAvailability(db.Model):
    __tablename__ = "user_availability"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey("time_slots.id"), nullable=False)
    week_start_date = db.Column(db.Date, nullable=False)
    preference_level = db.Column(
        db.Integer, default=1, nullable=False
    )  # 1 = neutral, 2 = preferred

    user = db.relationship("User", backref="availabilities")
    location = db.relationship("Location", backref="availabilities")
    time_slot = db.relationship("TimeSlot", backref="availabilities")

    # Unique constraint: one availability per user/location/time_slot/week
    __table_args__ = (
        db.UniqueConstraint(
            "user_id", "location_id", "time_slot_id", "week_start_date", name="unique_availability"
        ),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "location_id": self.location_id,
            "time_slot_id": self.time_slot_id,
            "week_start_date": self.week_start_date.isoformat(),
            "preference_level": self.preference_level,
        }


class Assignment(db.Model):
    __tablename__ = "assignments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey("locations.id"), nullable=False)
    time_slot_id = db.Column(db.Integer, db.ForeignKey("time_slots.id"), nullable=False)
    week_start_date = db.Column(db.Date, nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    user = db.relationship("User", foreign_keys=[user_id], backref="assignments")
    location = db.relationship("Location", backref="assignments")
    time_slot = db.relationship("TimeSlot", backref="assignments")
    assigner = db.relationship("User", foreign_keys=[assigned_by])

    def to_dict(self):
        # Calculate start and end datetime for calendar
        start_datetime = None
        end_datetime = None

        if self.time_slot and self.week_start_date:
            # Calculate the actual date (week_start + day_of_week offset)
            event_date = datetime.combine(self.week_start_date, datetime.min.time()) + timedelta(
                days=self.time_slot.day_of_week
            )

            # Combine date with time slot times
            start_datetime = datetime.combine(event_date.date(), self.time_slot.start_time)
            end_datetime = datetime.combine(event_date.date(), self.time_slot.end_time)

        return {
            "id": self.id,
            "user_id": self.user_id,
            "location_id": self.location_id,
            "time_slot_id": self.time_slot_id,
            "week_start_date": self.week_start_date.isoformat(),
            "assigned_by": self.assigned_by,
            "user_name": self.user.name if self.user else None,
            "location_name": self.location.name if self.location else None,
            "time_slot": self.time_slot.to_dict() if self.time_slot else None,
            "start": start_datetime.isoformat() if start_datetime else None,
            "end": end_datetime.isoformat() if end_datetime else None,
            "title": f"{self.user.name if self.user else 'Unknown'} – {self.location.name if self.location else 'Unknown'}",
        }

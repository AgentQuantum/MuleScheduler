"""
Functional tests for assignments API endpoints.
"""

from datetime import date, time, timedelta

import pytest

from models import Assignment, GlobalSettings, Location, TimeSlot, User, UserAvailability


class TestRunSchedulerEndpoint:
    """Test POST /api/assignments/run-scheduler endpoint."""

    def test_run_scheduler_as_admin(self, client, admin_token, test_location, test_time_slot):
        """Test running scheduler as admin."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            # Create user and availability
            user = User(name="Test Worker", email="worker@colby.edu", role="user")
            db.session.add(user)
            db.session.commit()

            availability = UserAvailability(
                user_id=user.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                preference_level=1,
            )
            db.session.add(availability)
            db.session.commit()

        week_start_str = week_start.isoformat()
        response = client.post(
            "/api/assignments/run-scheduler",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"week_start_date": week_start_str},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert "scheduled" in data
        assert "assignments" in data
        assert data["scheduled"] >= 0

    def test_run_scheduler_as_user_forbidden(self, client, auth_token):
        """Test running scheduler as non-admin returns 403."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        week_start_str = week_start.isoformat()

        response = client.post(
            "/api/assignments/run-scheduler",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"week_start_date": week_start_str},
        )

        assert response.status_code == 403

    def test_run_scheduler_missing_week_start(self, client, admin_token):
        """Test running scheduler without week_start_date returns 400."""
        response = client.post(
            "/api/assignments/run-scheduler",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={},
        )

        assert response.status_code == 400

    def test_run_scheduler_creates_assignments(
        self, client, admin_token, test_location, test_time_slot
    ):
        """Test that scheduler actually creates assignments."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            # Create two users with availability
            user1 = User(name="Worker 1", email="worker1@colby.edu", role="user")
            user2 = User(name="Worker 2", email="worker2@colby.edu", role="user")
            db.session.add_all([user1, user2])
            db.session.commit()

            availability1 = UserAvailability(
                user_id=user1.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                preference_level=1,
            )
            availability2 = UserAvailability(
                user_id=user2.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                preference_level=1,
            )
            db.session.add_all([availability1, availability2])
            db.session.commit()

            # Verify no assignments exist
            initial_count = Assignment.query.filter_by(week_start_date=week_start).count()
            assert initial_count == 0

        week_start_str = week_start.isoformat()
        response = client.post(
            "/api/assignments/run-scheduler",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"week_start_date": week_start_str},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data["scheduled"] > 0

        # Verify assignments were created
        with client.application.app_context():
            from database import db

            final_count = Assignment.query.filter_by(week_start_date=week_start).count()
            assert final_count == data["scheduled"]


class TestCreateAssignmentEndpoint:
    """Test POST /api/assignments endpoint."""

    def test_create_assignment_as_admin(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test creating assignment as admin."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        week_start_str = week_start.isoformat()

        response = client.post(
            "/api/assignments",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "user_id": test_user["id"],
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": week_start_str,
            },
        )

        assert response.status_code == 201
        data = response.get_json()
        assert data["user_id"] == test_user["id"]
        assert data["location_id"] == test_location["id"]
        assert data["time_slot_id"] == test_time_slot["id"]

    def test_create_assignment_respects_max_workers(
        self, client, admin_token, test_location, test_time_slot
    ):
        """Test that creating assignment respects max_workers_per_shift."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            # Set max workers to 2
            settings = GlobalSettings.query.first()
            settings.max_workers_per_shift = 2
            db.session.commit()

            # Create 2 users and assign them
            user1 = User(name="Worker 1", email="worker1@colby.edu", role="user")
            user2 = User(name="Worker 2", email="worker2@colby.edu", role="user")
            db.session.add_all([user1, user2])
            db.session.commit()

            assignment1 = Assignment(
                user_id=user1.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            assignment2 = Assignment(
                user_id=user2.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add_all([assignment1, assignment2])
            db.session.commit()

            # Try to create third assignment
            user3 = User(name="Worker 3", email="worker3@colby.edu", role="user")
            db.session.add(user3)
            db.session.commit()
            user3_id = user3.id  # Store ID before leaving context

        week_start_str = week_start.isoformat()
        response = client.post(
            "/api/assignments",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "user_id": user3_id,
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": week_start_str,
            },
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "OVER_MAX_WORKERS"

    def test_create_assignment_prevents_overlap(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test that creating assignment prevents overlapping shifts."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            # Create existing assignment
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()

        week_start_str = week_start.isoformat()
        response = client.post(
            "/api/assignments",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "user_id": test_user["id"],
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": week_start_str,
            },
        )

        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "OVERLAP_FOR_USER"

    def test_create_assignment_as_user_forbidden(
        self, client, auth_token, test_user, test_location, test_time_slot
    ):
        """Test creating assignment as non-admin returns 403."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.post(
            "/api/assignments",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "user_id": test_user["id"],
                "location_id": test_location["id"],
                "time_slot_id": test_time_slot["id"],
                "week_start_date": week_start.isoformat(),
            },
        )
        assert response.status_code == 403

    def test_create_assignment_missing_fields(self, client, admin_token, test_user, test_location):
        """Test creating assignment with missing required fields returns 400."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.post(
            "/api/assignments",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "user_id": test_user["id"],
                "location_id": test_location["id"],
                # Missing time_slot_id and week_start_date
            },
        )
        assert response.status_code == 400


class TestGetAssignmentsEndpoint:
    """Test GET /api/assignments endpoint."""

    def test_get_assignments_as_admin(self, client, admin_token):
        """Test getting assignments as admin."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.get(
            f"/api/assignments?week_start={week_start.isoformat()}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_assignments_as_user(self, client, auth_token):
        """Test getting assignments as regular user (own assignments only)."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.get(
            f"/api/assignments?week_start={week_start.isoformat()}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_assignments_missing_week_start(self, client, admin_token):
        """Test getting assignments without week_start returns 400."""
        response = client.get(
            "/api/assignments", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400

    def test_get_assignments_unauthorized(self, client):
        """Test getting assignments without auth returns 401."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.get(f"/api/assignments?week_start={week_start.isoformat()}")
        assert response.status_code == 401

    def test_get_assignments_admin_filter_by_user(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test admin filtering assignments by user_id."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()

        response = client.get(
            f'/api/assignments?week_start={week_start.isoformat()}&user_id={test_user["id"]}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        for assignment in data:
            assert assignment["user_id"] == test_user["id"]

    def test_get_assignments_admin_filter_by_location(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test admin filtering assignments by location_id."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()

        response = client.get(
            f'/api/assignments?week_start={week_start.isoformat()}&location_id={test_location["id"]}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200


class TestUpdateAssignmentEndpoint:
    """Test PUT /api/assignments/<id> endpoint."""

    def test_update_assignment_as_admin(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test updating assignment as admin."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            # Create a new user to reassign to
            new_user = User(name="New Worker", email="newworker@colby.edu", role="user")
            db.session.add(new_user)
            db.session.commit()
            new_user_id = new_user.id

            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.put(
            f"/api/assignments/{assignment_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": new_user_id},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["user_id"] == new_user_id

    def test_update_assignment_as_user_forbidden(
        self, client, auth_token, test_user, test_location, test_time_slot
    ):
        """Test updating assignment as non-admin returns 403."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.put(
            f"/api/assignments/{assignment_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"user_id": 999},
        )
        assert response.status_code == 403

    def test_update_nonexistent_assignment(self, client, admin_token):
        """Test updating nonexistent assignment returns 404."""
        response = client.put(
            "/api/assignments/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": 1},
        )
        assert response.status_code == 404


class TestMoveAssignmentEndpoint:
    """Test PUT /api/assignments/<id>/move endpoint."""

    def test_move_assignment_as_admin(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment as admin."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        # Move to a new time
        new_start = f"{week_start}T10:00:00"
        new_end = f"{week_start}T11:00:00"

        response = client.put(
            f"/api/assignments/{assignment_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "new_start": new_start,
                "new_end": new_end,
                "new_time_slot_id": test_time_slot["id"],
            },
        )
        assert response.status_code == 200

    def test_move_assignment_missing_times(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment without times returns 400."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.put(
            f"/api/assignments/{assignment_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={},
        )
        assert response.status_code == 400

    def test_move_assignment_as_user_forbidden(
        self, client, auth_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment as non-admin returns 403."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.put(
            f"/api/assignments/{assignment_id}/move",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"new_start": "2024-01-01T10:00:00", "new_end": "2024-01-01T11:00:00"},
        )
        assert response.status_code == 403

    def test_move_assignment_invalid_datetime(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment with invalid datetime returns 400."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.put(
            f"/api/assignments/{assignment_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"new_start": "invalid", "new_end": "also-invalid"},
        )
        assert response.status_code == 400


class TestDeleteAssignmentEndpoint:
    """Test DELETE /api/assignments/<id> endpoint."""

    def test_delete_assignment_as_admin(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test deleting assignment as admin."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.delete(
            f"/api/assignments/{assignment_id}", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "deleted" in response.get_json()["message"].lower()

    def test_delete_assignment_as_user_forbidden(
        self, client, auth_token, test_user, test_location, test_time_slot
    ):
        """Test deleting assignment as non-admin returns 403."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        response = client.delete(
            f"/api/assignments/{assignment_id}", headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 403

    def test_delete_nonexistent_assignment(self, client, admin_token):
        """Test deleting nonexistent assignment returns 404."""
        response = client.delete(
            "/api/assignments/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestAvailableWorkersEndpoint:
    """Test GET /api/assignments/available-workers endpoint."""

    def test_get_available_workers_as_admin(
        self, client, admin_token, test_location, test_time_slot
    ):
        """Test getting available workers as admin."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.get(
            f'/api/assignments/available-workers?location_id={test_location["id"]}&time_slot_id={test_time_slot["id"]}&week_start={week_start.isoformat()}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_get_available_workers_as_user_forbidden(
        self, client, auth_token, test_location, test_time_slot
    ):
        """Test getting available workers as non-admin returns 403."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.get(
            f'/api/assignments/available-workers?location_id={test_location["id"]}&time_slot_id={test_time_slot["id"]}&week_start={week_start.isoformat()}',
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 403

    def test_get_available_workers_missing_params(self, client, admin_token):
        """Test getting available workers with missing params returns 400."""
        response = client.get(
            "/api/assignments/available-workers", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400

    def test_get_available_workers_invalid_time_slot(self, client, admin_token, test_location):
        """Test getting available workers with invalid time slot returns 404."""
        week_start = date.today() - timedelta(days=date.today().weekday())
        response = client.get(
            f'/api/assignments/available-workers?location_id={test_location["id"]}&time_slot_id=99999&week_start={week_start.isoformat()}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404

    def test_get_available_workers_with_availability(
        self, client, admin_token, test_location, test_time_slot
    ):
        """Test getting available workers returns users with availability."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            # Create user with availability
            worker = User(name="Available Worker", email="available@colby.edu", role="user")
            db.session.add(worker)
            db.session.commit()

            availability = UserAvailability(
                user_id=worker.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
                preference_level=1,
            )
            db.session.add(availability)
            db.session.commit()

        response = client.get(
            f'/api/assignments/available-workers?location_id={test_location["id"]}&time_slot_id={test_time_slot["id"]}&week_start={week_start.isoformat()}',
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) >= 1


class TestUpdateAssignmentBranches:
    """Additional tests for update assignment edge cases."""

    def test_update_assignment_without_user_id(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test updating assignment without user_id in data."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id
            original_user_id = assignment.user_id

        response = client.put(
            f"/api/assignments/{assignment_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["user_id"] == original_user_id


class TestMoveAssignmentBranches:
    """Additional tests for move assignment edge cases."""

    def test_move_assignment_invalid_time_slot_id(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment with invalid time_slot_id returns 404."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        new_start = f"{week_start}T10:00:00"
        new_end = f"{week_start}T11:00:00"

        response = client.put(
            f"/api/assignments/{assignment_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"new_start": new_start, "new_end": new_end, "new_time_slot_id": 99999},
        )
        assert response.status_code == 404
        data = response.get_json()
        assert "Time slot not found" in data["error"]

    def test_move_assignment_overlapping(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment to overlapping slot returns 400."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            assignment1 = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment1)
            db.session.commit()

            loc2 = Location(name="Second Location", description="Test")
            db.session.add(loc2)
            db.session.commit()

            assignment2 = Assignment(
                user_id=test_user["id"],
                location_id=loc2.id,
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment2)
            db.session.commit()
            assignment2_id = assignment2.id

        new_start = f'{week_start}T{test_time_slot["start_time"]}'
        new_end = f'{week_start}T{test_time_slot["end_time"]}'

        response = client.put(
            f"/api/assignments/{assignment2_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "new_start": new_start,
                "new_end": new_end,
                "new_time_slot_id": test_time_slot["id"],
                "new_location_id": test_location["id"],
            },
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "OVERLAP_FOR_USER"

    def test_move_assignment_over_max_workers(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment when max workers exceeded returns 400."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())

            settings = GlobalSettings.query.first()
            if not settings:
                settings = GlobalSettings(max_workers_per_shift=1)
                db.session.add(settings)
            else:
                settings.max_workers_per_shift = 1
            db.session.commit()

            worker1 = User(name="Worker1", email="w1@colby.edu", role="user")
            worker2 = User(name="Worker2", email="w2@colby.edu", role="user")
            db.session.add_all([worker1, worker2])
            db.session.commit()

            assignment1 = Assignment(
                user_id=worker1.id,
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment1)
            db.session.commit()

            loc2 = Location(name="Third Location", description="Test")
            db.session.add(loc2)
            db.session.commit()

            assignment2 = Assignment(
                user_id=worker2.id,
                location_id=loc2.id,
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment2)
            db.session.commit()
            assignment2_id = assignment2.id

        new_start = f'{week_start}T{test_time_slot["start_time"]}'
        new_end = f'{week_start}T{test_time_slot["end_time"]}'

        response = client.put(
            f"/api/assignments/{assignment2_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "new_start": new_start,
                "new_end": new_end,
                "new_time_slot_id": test_time_slot["id"],
                "new_location_id": test_location["id"],
            },
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data["error"] == "OVER_MAX_WORKERS"

    def test_move_assignment_without_time_slot_id(
        self, client, admin_token, test_user, test_location, test_time_slot
    ):
        """Test moving assignment without time_slot_id tries to find matching slot."""
        with client.application.app_context():
            from database import db

            week_start = date.today() - timedelta(days=date.today().weekday())
            assignment = Assignment(
                user_id=test_user["id"],
                location_id=test_location["id"],
                time_slot_id=test_time_slot["id"],
                week_start_date=week_start,
            )
            db.session.add(assignment)
            db.session.commit()
            assignment_id = assignment.id

        new_start = f"{week_start}T10:00:00"
        new_end = f"{week_start}T11:00:00"

        response = client.put(
            f"/api/assignments/{assignment_id}/move",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"new_start": new_start, "new_end": new_end},
        )
        assert response.status_code in [200, 404]

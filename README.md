# Colby Scheduler

A full-stack scheduling web application for Colby College student workers. This app allows student workers to set their availability preferences and enables administrators to manage locations, time slots, shift requirements, and automatically generate weekly schedules.

## Tech Stack

- **Backend:** Python Flask (REST API)
- **Frontend:** React with TypeScript
- **UI Framework:** Bootstrap 5 + React-Bootstrap
- **Calendar:** FullCalendar React with Bootstrap 5 theme
- **Database:** SQLite (can be switched to PostgreSQL)

## Project Structure

```
MuleScheduler/
├── backend/              # Flask API
│   ├── app.py           # Main Flask application
│   ├── models.py        # SQLAlchemy models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (scheduler)
│   ├── requirements.txt # Python dependencies
│   └── seed_data.py     # Database seeding script
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── pages/       # Page components
│   │   └── services/    # API client
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Initialize the database:**
   ```bash
   python app.py
   ```
   This will create the SQLite database file (`scheduler.db`) and initialize tables.

6. **Seed sample data (optional but recommended for testing):**
   ```bash
   python seed_data.py
   ```
   This creates:
   - 1 admin user (`admin@colby.edu`)
   - ~30 student worker users
   - 5 sample locations
   - Time slots for Monday-Friday, 9am-5pm (hourly)
   - Default global settings

7. **Run the Flask server:**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## Usage

### Authentication

Currently, the app uses a simple stub authentication system:

- **Login:** Enter any email address and select your role (user or admin)
- **Admin Access:** Use `admin@colby.edu` or any email with role "admin"
- **Student Access:** Use any email with role "user"

> **Note:** In production, this should be replaced with Google OAuth restricted to `@colby.edu` emails.

### Student Worker Flow

1. **Set Availability:**
   - Navigate to "Availability" from the navbar
   - Select a week starting date
   - For each location and time slot, mark yourself as available
   - Optionally mark shifts as "Preferred" vs "Neutral"
   - Click "Save Availability"

2. **View Schedule:**
   - Navigate to "My Schedule"
   - View your assigned shifts in a weekly calendar view
   - Use the date picker or navigation buttons to change weeks

### Admin Flow

1. **Configure Settings:**
   - Navigate to "Settings"
   - **Locations:** Add, edit, or delete locations
   - **Time Slots:** Define time slots (day of week + start/end time)
   - **Global Settings:** Set max workers per shift and max hours per user per week

2. **Set Shift Requirements:**
   - Navigate to "Requirements"
   - Select a week starting date
   - For each location and time slot, specify how many workers are needed
   - Click "Save Requirements"

3. **Generate Schedule:**
   - Navigate to "Schedule"
   - Select the week you want to schedule
   - Click "Run Auto-Scheduler"
   - The system will automatically assign workers based on:
     - Their availability preferences
     - Shift requirements
     - Global constraints (max workers per shift, max hours per user)
     - Priority: workers with fewer assigned hours get assigned first

4. **Manual Adjustments:**
   - Click on any shift in the calendar
   - View assigned worker
   - Reassign to a different available worker
   - Remove assignments

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (stub)
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/me` - Get current user info
- `GET /api/users` - List all users (admin only)

### Locations
- `GET /api/locations` - List all active locations
- `POST /api/locations` - Create location (admin)
- `PUT /api/locations/:id` - Update location (admin)
- `DELETE /api/locations/:id` - Delete location (admin)

### Time Slots
- `GET /api/time-slots` - List all time slots
- `POST /api/time-slots` - Create time slot (admin)
- `PUT /api/time-slots/:id` - Update time slot (admin)
- `DELETE /api/time-slots/:id` - Delete time slot (admin)

### Settings
- `GET /api/settings` - Get global settings (admin)
- `PUT /api/settings` - Update global settings (admin)

### Shift Requirements
- `GET /api/shift-requirements?week_start=YYYY-MM-DD` - Get requirements for a week
- `POST /api/shift-requirements` - Create/update requirement (admin)
- `PUT /api/shift-requirements/:id` - Update requirement (admin)
- `DELETE /api/shift-requirements/:id` - Delete requirement (admin)

### Availability
- `GET /api/availability?week_start=YYYY-MM-DD` - Get current user's availability
- `POST /api/availability` - Create/update availability entry
- `POST /api/availability/batch` - Create/update multiple availability entries

### Assignments
- `GET /api/assignments?week_start=YYYY-MM-DD` - Get assignments (user sees only their own, admin sees all)
- `POST /api/assignments/run-scheduler` - Run auto-scheduler for a week (admin)
- `PUT /api/assignments/:id` - Update assignment (admin)
- `DELETE /api/assignments/:id` - Delete assignment (admin)
- `GET /api/assignments/available-workers` - Get available workers for a shift (admin)

## Auto-Scheduler Algorithm

The auto-scheduler assigns workers to shifts based on:

1. **Availability:** Only assigns workers who marked themselves as available
2. **No Overlaps:** Skips workers already assigned to overlapping time slots
3. **Max Hours Constraint:** Respects `max_hours_per_user_per_week` if set
4. **Priority:**
   - Workers with fewer assigned hours in the week are prioritized
   - Workers who marked a shift as "preferred" get slight priority over "neutral"
5. **Requirements:** Assigns up to `min(required_workers, max_workers_per_shift)` per shift

## Development Notes

- The backend uses SQLite by default. To switch to PostgreSQL, update the `DATABASE_URL` in `app.py` or set it as an environment variable.
- The frontend uses Vite for fast development. The proxy is configured to forward `/api` requests to the Flask backend.
- Authentication tokens are stored in localStorage. In production, use secure HTTP-only cookies.
- The calendar view uses FullCalendar with Bootstrap 5 theme for consistent styling.

## Future Enhancements

- Replace stub authentication with Google OAuth
- Add email notifications for schedule assignments
- Add shift swap/request functionality
- Add reporting and analytics
- Add mobile app support
- Add shift templates for recurring requirements

## License

See LICENSE file for details.

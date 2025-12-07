# MuleScheduler 📅

![CI](https://github.com/AgentQuantum/MuleScheduler/actions/workflows/ci.yml/badge.svg)
![Backend Coverage](https://img.shields.io/badge/backend%20coverage-95%25-brightgreen)
![Frontend Coverage](https://img.shields.io/badge/frontend%20coverage-97%25-brightgreen)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/react-18-61dafb)

> **A modern, intelligent scheduling system for Colby College student workers**

MuleScheduler is a full-stack web application designed to streamline the scheduling process for student workers at Colby College. It empowers students to set their availability preferences while giving administrators powerful tools to manage locations, time slots, and automatically generate optimized weekly schedules.

## ✨ Features

- 📅 **Smart Auto-Scheduling** - Automatically assigns workers based on availability, preferences, and constraints
- 👥 **Multi-Location Support** - Manage shifts across multiple campus locations
- ⏰ **Flexible Time Slots** - Define custom time slots for each day of the week
- 🎯 **Preference-Based Matching** - Workers can mark preferred shifts, and the scheduler prioritizes accordingly
- 📊 **Admin Dashboard** - Comprehensive tools for managing users, locations, and schedules
- 🔄 **Real-Time Updates** - View and modify schedules with instant feedback
- 🎨 **Modern UI** - Beautiful, responsive interface built with React and Bootstrap 5

## 🛠️ Tech Stack

- **Backend:** Python Flask (REST API) 🐍
- **Frontend:** React with TypeScript ⚛️
- **UI Framework:** Bootstrap 5 + React-Bootstrap 🎨
- **Calendar:** FullCalendar React with Bootstrap 5 theme 📅
- **Database:** SQLite (easily switchable to PostgreSQL) 🗄️
- **Testing:** pytest (Backend) + Jest (Frontend) ✅

## 📁 Project Structure

```
MuleScheduler/
├── backend/              # Flask API
│   ├── app.py           # Main Flask application
│   ├── models.py        # SQLAlchemy models
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (scheduler)
│   ├── tests/           # Backend tests (pytest)
│   ├── requirements.txt # Python dependencies
│   └── seed_data.py     # Database seeding script
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── pages/       # Page components
│   │   ├── __tests__/   # Frontend tests (Jest)
│   │   └── services/    # API client
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the database:**
   ```bash
   python app.py
   ```
   This creates the SQLite database and initializes all tables.

5. **Seed sample data (recommended):**
   ```bash
   python seed_data.py
   ```
   Creates:
   - 1 admin user (`admin@colby.edu`)
   - ~30 student worker users
   - 5 sample locations
   - Time slots for Monday-Friday, 9am-5pm (hourly)
   - Default global settings

6. **Run the Flask server:**
   ```bash
   python app.py
   ```
   API available at `http://localhost:5000` 🌐

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
   App available at `http://localhost:5173` 🎉

## 📖 Usage Guide

### 🔐 Authentication (Google OAuth – restricted to `@colby.edu`)

MuleScheduler now uses Google OAuth 2.0. Emails must end with `@colby.edu`; non-Colby emails are rejected.

#### Setup Instructions

1. **Create a Google OAuth client (Web application):**
   - Go to Google Cloud Console → APIs & Services → Credentials.
   - Create OAuth client ID (type: Web application).
   - Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback` (and your production URL).
   - Copy the **Client ID** and **Client Secret**.

2. **Backend env vars (required):**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (optional; defaults to `http://localhost:5000/api/auth/google/callback`)
   - `FRONTEND_ORIGIN` (optional; defaults to `http://localhost:5173`)

3. **Frontend env vars:**
   - `VITE_GOOGLE_CLIENT_ID` (not currently required for the flow, but keep for future use)

#### Authentication Flow

- User clicks **“Sign In with Colby”** on the login page.
- Browser is redirected to Google OAuth; user signs in with `@colby.edu`.
- Backend validates the ID token, enforces `@colby.edu`, creates the user if needed, and issues an app token.
- Backend redirects back to the frontend with `?token=...`; the SPA stores it and uses it for API calls.
- User roles (admin/user) remain in the database.

### 👨‍🎓 Student Worker Flow

1. **Set Availability:**
   - Navigate to "Availability" from the navbar
   - Select a week starting date
   - Mark yourself as available for each location and time slot
   - Optionally mark shifts as "Preferred" vs "Neutral"
   - Click "Save Availability"

2. **View Schedule:**
   - Navigate to "My Schedule"
   - View your assigned shifts in a beautiful weekly calendar view
   - Use the date picker or navigation buttons to change weeks

### 👨‍💼 Admin Flow

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
   - The system automatically assigns workers based on:
     - Their availability preferences
     - Shift requirements
     - Global constraints (max workers per shift, max hours per user)
     - Priority: workers with fewer assigned hours get assigned first

4. **Manual Adjustments:**
   - Click on any shift in the calendar
   - View assigned worker
   - Reassign to a different available worker
   - Remove assignments

## 🧪 Testing

### Backend Testing (pytest) 🐍

The backend uses **pytest** for comprehensive testing with a **95% branch coverage requirement**.

**Directory Structure:**
```
backend/tests/
├── unit/              # Unit tests for individual functions
│   ├── test_models.py
│   ├── test_scheduler.py
│   └── test_slot_generator.py
└── functional/        # Integration tests for API endpoints
    ├── test_auth.py
    ├── test_assignments.py
    ├── test_availability.py
    ├── test_locations.py
    ├── test_settings.py
    ├── test_shift_requirements.py
    ├── test_time_slots.py
    ├── test_users.py
    └── test_weekly_overrides.py
```

**Running Tests:**
```bash
cd backend
pytest                    # Run all tests (coverage enforced, min 95% branch)
pytest -v                 # Verbose output
pytest tests/unit/        # Run only unit tests
pytest tests/functional/  # Run only functional tests
pytest --cov=. --cov-branch  # With branch coverage report
pytest --cov=. --cov-report=html  # Generate HTML report (open htmlcov/index.html)
```

**Coverage Requirement:** 
- **Branch Coverage:** ≥ 95% (enforced in CI)
- Tests will fail if branch coverage is below 95%. This is enforced both locally and in CI.

**Viewing Coverage Reports:**
- **GitHub Actions:** Check the "Backend Tests" job summary for a detailed coverage table showing branch and line coverage percentages
- **Coverage Artifacts:** Download `coverage.xml` from the Actions run artifacts for detailed analysis
- **Local HTML Report:** Run `pytest --cov=. --cov-branch --cov-report=html` and open `htmlcov/index.html` in your browser

**Key Test Files:**
- `test_scheduler.py` - Unit tests for scheduler service functions (calculate_hours, get_user_total_hours, has_overlapping_assignment, run_auto_scheduler, etc.)
- `test_assignments.py` - Functional tests for assignment API endpoints (run-scheduler, create assignment, validation)

### Frontend Testing (Jest) ⚛️

The frontend uses **Jest** with **React Testing Library** for component testing.

**Directory Structure:**
```
frontend/src/__tests__/
├── App.test.tsx
├── LoginPage.test.tsx
├── SignupPage.test.tsx
└── Navbar.test.tsx
```

**Running Tests:**
```bash
cd frontend
npm test                  # Run tests in watch mode
npm run test:ci          # Run tests once (CI mode)
```

**Testing Approach:**
- Uses React Testing Library for user-centric testing
- Mocks API calls with `jest.mock()`
- Tests component rendering, user interactions, and error handling
- Aim for 60%+ coverage on components and pages

**Key Test Files:**
- `SignupPage.test.tsx` - Tests for signup form rendering, validation, and submission
- `LoginPage.test.tsx` - Tests for login functionality
- `Navbar.test.tsx` - Tests for navigation component

### CI/CD Pipeline 🔄

GitHub Actions automatically runs tests on:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

**CI Jobs:**
1. **Backend Tests**
   - Installs Python dependencies
   - Runs flake8 linting
   - Runs pytest with branch coverage (95% minimum)
   - Extracts and displays coverage percentages in job summary
   - Uploads coverage.xml as artifact for detailed analysis

2. **Frontend Tests**
   - Installs Node.js dependencies
   - Runs ESLint
   - Runs Jest tests

**Branch Protection:** All tests must pass before merging to `main` ✅

## 🔌 API Endpoints

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
- `POST /api/assignments` - Create assignment (admin)
- `PUT /api/assignments/:id` - Update assignment (admin)
- `DELETE /api/assignments/:id` - Delete assignment (admin)
- `GET /api/assignments/available-workers` - Get available workers for a shift (admin)

## 🧠 Auto-Scheduler Algorithm

The intelligent auto-scheduler assigns workers to shifts based on:

1. **Availability** - Only assigns workers who marked themselves as available ✅
2. **No Overlaps** - Skips workers already assigned to overlapping time slots ⏰
3. **Max Hours Constraint** - Respects `max_hours_per_user_per_week` if set 📊
4. **Priority System:**
   - Workers with fewer assigned hours in the week are prioritized first 🎯
   - Workers who marked a shift as "preferred" get slight priority over "neutral" ⭐
5. **Capacity Management** - Assigns up to `min(required_workers, max_workers_per_shift)` per shift 👥

## 💡 Development Notes

- The backend uses SQLite by default. To switch to PostgreSQL, update the `DATABASE_URL` in `app.py` or set it as an environment variable.
- The frontend uses Vite for fast development. The proxy is configured to forward `/api` requests to the Flask backend.
- Authentication tokens are stored in localStorage. In production, use secure HTTP-only cookies.
- The calendar view uses FullCalendar with Bootstrap 5 theme for consistent styling.

## 🚧 Future Enhancements

- 🔐 Replace stub authentication with Google OAuth
- 📧 Add email notifications for schedule assignments
- 🔄 Add shift swap/request functionality
- 📊 Add reporting and analytics
- 📱 Add mobile app support
- 📋 Add shift templates for recurring requirements

## 📄 License

See LICENSE file for details.

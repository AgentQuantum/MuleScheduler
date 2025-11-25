/**
 * Basic test for App component.
 */
import { render } from '@testing-library/react'
import App from '../App'

// Mock AuthProvider to avoid context issues
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({ user: null, token: null, login: jest.fn(), logout: jest.fn(), loading: false })
}))

// Mock FullCalendar and related components to avoid ESM parsing issues
jest.mock('@fullcalendar/react', () => {
  return function MockFullCalendar() {
    return <div data-testid="mock-fullcalendar">Mock Calendar</div>
  }
})

jest.mock('@fullcalendar/daygrid', () => ({}))
jest.mock('@fullcalendar/timegrid', () => ({}))
jest.mock('@fullcalendar/interaction', () => ({}))
jest.mock('@fullcalendar/bootstrap5', () => ({}))
jest.mock('@fullcalendar/core', () => ({
  formatDate: jest.fn()
}))

// Mock the API
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}))

describe('App', () => {
  it('renders without crashing', () => {
    // App already includes its own Router, no need to wrap it
    render(<App />)
  })
})

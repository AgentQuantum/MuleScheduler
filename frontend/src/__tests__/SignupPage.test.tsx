/**
 * Test suite for SignupPage component.
 * Tests focus on rendering and static content.
 */
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SignupPage from '../pages/SignupPage'

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: jest.fn().mockResolvedValue({}),
    logout: jest.fn(),
    loading: false
  })
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

describe('SignupPage', () => {
  it('renders signup form with all fields', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )
    
    // Check for form elements
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    expect(screen.getByText(/role/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('renders branding elements', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )
    
    // Check for branding
    expect(screen.getByText(/join mulescheduler/i)).toBeInTheDocument()
    expect(screen.getByText(/create account/i)).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )
    
    const loginLink = screen.getByText(/login here/i)
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('renders role selector with options', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )
    
    const roleSelect = screen.getByRole('combobox')
    expect(roleSelect).toBeInTheDocument()
    expect(screen.getByText(/student worker/i)).toBeInTheDocument()
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('renders email helper text', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText(/@colby.edu email/i)).toBeInTheDocument()
  })
})

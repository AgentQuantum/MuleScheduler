/**
 * Test suite for LoginPage component.
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import { AuthProvider } from '../contexts/AuthContext'
import api from '../services/api'

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

const mockedApi = api as jest.Mocked<typeof api>

describe('LoginPage', () => {
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form', () => {
    renderLoginPage()
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('allows user to enter email and select role', async () => {
    const user = userEvent.setup()
    renderLoginPage()
    
    const emailInput = screen.getByLabelText(/email/i)
    const roleSelect = screen.getByLabelText(/role/i)
    
    await user.type(emailInput, 'test@colby.edu')
    await user.selectOptions(roleSelect, 'admin')
    
    expect(emailInput).toHaveValue('test@colby.edu')
    expect(roleSelect).toHaveValue('admin')
  })

  it('shows error message on login failure', async () => {
    const user = userEvent.setup()
    mockedApi.post.mockRejectedValueOnce({ response: { data: { error: 'Login failed' } } })
    
    renderLoginPage()
    
    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })
    
    await user.type(emailInput, 'test@colby.edu')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument()
    })
  })

  it('has link to signup page', () => {
    renderLoginPage()
    
    const signupLink = screen.getByRole('link', { name: /sign up here/i })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute('href', '/signup')
  })
})

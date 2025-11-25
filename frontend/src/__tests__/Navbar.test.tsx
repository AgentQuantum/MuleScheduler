/**
 * Test suite for Navbar component.
 */
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { AuthProvider } from '../contexts/AuthContext'
import * as authContext from '../contexts/AuthContext'

// Mock the useAuth hook
jest.mock('../contexts/AuthContext', () => {
  const actual = jest.requireActual('../contexts/AuthContext')
  return {
    ...actual,
    useAuth: jest.fn()
  }
})

const mockUseAuth = authContext.useAuth as jest.MockedFunction<typeof authContext.useAuth>

describe('Navbar', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@colby.edu',
        role: 'user'
      },
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    })
  })

  it('renders MuleScheduler brand', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )
    
    expect(screen.getByText('MuleScheduler')).toBeInTheDocument()
  })

  it('renders user navigation links for student role', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )
    
    expect(screen.getByText('My Schedule')).toBeInTheDocument()
    expect(screen.getByText('Availability')).toBeInTheDocument()
  })

  it('renders admin navigation links for admin role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@colby.edu',
        role: 'admin'
      },
      token: 'test-token',
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    )
    
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Requirements')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})

/**
 * Test suite for SignupPage component.
 * Tests focus on rendering and static content.
 */
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from '../pages/SignupPage';

// Mock AuthContext
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: mockLogin,
    logout: jest.fn(),
    loading: false,
  }),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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
        common: {},
      },
    },
  },
}));

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({});
  });

  it('renders signup form with all fields', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

    // Check for form elements
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders branding elements', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

    // Check for branding
    expect(screen.getByText(/join mulescheduler/i)).toBeInTheDocument();
    expect(screen.getByText(/designed for colby college/i)).toBeInTheDocument();
  });

  it('renders role selector with options', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveTextContent('Student Worker');
    expect(options[1]).toHaveTextContent('Administrator');
  });

  it('renders email helper text', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/use your @colby.edu email address/i)).toBeInTheDocument();
  });

  it('renders link to login page', () => {
    render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    );

    const loginLink = screen.getByText(/sign in here/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });
});

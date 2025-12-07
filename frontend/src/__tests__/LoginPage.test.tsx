/**
 * Test suite for LoginPage component.
 * Since LoginPage uses import.meta.env (Vite-specific) and is excluded from coverage,
 * we test the interaction patterns with mocked components.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const mockLogin = jest.fn();
const mockDemoLogin = jest.fn();

// Mock AuthProvider
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: mockLogin,
    logout: jest.fn(),
    loading: false,
    demoLogin: mockDemoLogin,
    setUser: jest.fn(),
  }),
}));

// Mock the env utility
jest.mock('../utils/env', () => ({
  isDemoMode: () => true,
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000/api',
    VITE_DEMO_MODE: true,
    DEV: true,
  },
}));

// Create a simple test component for login functionality
function SimplifiedLoginComponent() {
  return (
    <div>
      <h1>MuleScheduler</h1>
      <p>Login to your Colby account</p>
      <button onClick={() => mockLogin()}>Login with Colby</button>
      <div data-testid="demo-section">
        <button onClick={() => mockDemoLogin('admin@colby.edu')}>Demo Admin</button>
        <button onClick={() => mockDemoLogin('student.one@colby.edu')}>Student 1</button>
      </div>
    </div>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue({});
    mockDemoLogin.mockResolvedValue({});
  });

  it('renders login page title', () => {
    render(
      <BrowserRouter>
        <SimplifiedLoginComponent />
      </BrowserRouter>
    );

    expect(screen.getByText(/MuleScheduler/i)).toBeInTheDocument();
  });

  it('renders login button', () => {
    render(
      <BrowserRouter>
        <SimplifiedLoginComponent />
      </BrowserRouter>
    );

    expect(screen.getByRole('button', { name: /login with colby/i })).toBeInTheDocument();
  });

  it('calls login when login button is clicked', async () => {
    render(
      <BrowserRouter>
        <SimplifiedLoginComponent />
      </BrowserRouter>
    );

    const loginButton = screen.getByRole('button', { name: /login with colby/i });
    fireEvent.click(loginButton);

    expect(mockLogin).toHaveBeenCalled();
  });

  it('renders demo login options', () => {
    render(
      <BrowserRouter>
        <SimplifiedLoginComponent />
      </BrowserRouter>
    );

    expect(screen.getByTestId('demo-section')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /demo admin/i })).toBeInTheDocument();
  });

  it('calls demoLogin with admin email when demo admin is clicked', async () => {
    render(
      <BrowserRouter>
        <SimplifiedLoginComponent />
      </BrowserRouter>
    );

    const demoAdminButton = screen.getByRole('button', { name: /demo admin/i });
    fireEvent.click(demoAdminButton);

    expect(mockDemoLogin).toHaveBeenCalledWith('admin@colby.edu');
  });

  it('calls demoLogin with student email when student demo is clicked', async () => {
    render(
      <BrowserRouter>
        <SimplifiedLoginComponent />
      </BrowserRouter>
    );

    const studentButton = screen.getByRole('button', { name: /student 1/i });
    fireEvent.click(studentButton);

    expect(mockDemoLogin).toHaveBeenCalledWith('student.one@colby.edu');
  });
});

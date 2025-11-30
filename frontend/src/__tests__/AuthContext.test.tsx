/**
 * Comprehensive tests for AuthContext.
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../services/api';

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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component to consume auth context
function TestConsumer() {
  const { user, token, loading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <button onClick={() => login('test@colby.edu', 'user')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('provides initial loading state', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  it('provides null user when no token stored', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  it('loads user from stored token on mount', async () => {
    localStorageMock.getItem.mockReturnValue('stored-token');
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: 1, email: 'stored@colby.edu', name: 'Stored User', role: 'user' },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('user').textContent).toBe('stored@colby.edu');
  });

  it('clears invalid token on mount', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token');
    (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('login sets user and token', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: {
        token: 'new-token',
        user: { id: 1, email: 'test@colby.edu', name: 'Test User', role: 'user' },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@colby.edu');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
  });

  it('logout clears user and token', async () => {
    localStorageMock.getItem.mockReturnValue('stored-token');
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: 1, email: 'stored@colby.edu', name: 'Stored User', role: 'user' },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('stored@colby.edu');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});

describe('useAuth', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});

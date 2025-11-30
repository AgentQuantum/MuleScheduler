/**
 * Test suite for Navbar component.
 */
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Mock AuthProvider and useAuth
jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@colby.edu',
      role: 'user',
    },
    token: 'test-token',
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
  }),
}));

describe('Navbar', () => {
  it('renders MuleScheduler brand', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('MuleScheduler')).toBeInTheDocument();
  });
});

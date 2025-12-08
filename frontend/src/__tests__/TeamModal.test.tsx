import { render, screen } from '@testing-library/react';
import TeamModal from '../components/TeamModal';
import { User } from '../types/scheduler';

// Mock UserAvatar component
jest.mock('../components/UserAvatar', () => {
  return function MockUserAvatar({ name }: { name: string }) {
    return <div data-testid="user-avatar">{name}</div>;
  };
});

describe('TeamModal', () => {
  const mockOnHide = jest.fn();

  const mockUsers: User[] = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@colby.edu',
      role: 'admin',
      profile_picture_url: undefined,
    },
    {
      id: 2,
      name: 'Worker One',
      email: 'worker1@colby.edu',
      role: 'user',
      class_year: 2025,
      profile_picture_url: undefined,
    },
    {
      id: 3,
      name: 'Worker Two',
      email: 'worker2@colby.edu',
      role: 'user',
      profile_picture_url: undefined,
    },
  ];

  beforeEach(() => {
    mockOnHide.mockClear();
  });

  it('renders modal when show is true', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    expect(screen.getByText('Team Members')).toBeInTheDocument();
  });

  it('does not render modal when show is false', () => {
    render(<TeamModal show={false} onHide={mockOnHide} users={mockUsers} />);

    expect(screen.queryByText('Team Members')).not.toBeInTheDocument();
  });

  it('displays loading spinner when loading is true', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={[]} loading={true} />);

    expect(screen.getByText('Team Members')).toBeInTheDocument();
    // Should show spinner, not user lists
    expect(screen.queryByText('Administrators')).not.toBeInTheDocument();
  });

  it('displays administrators section with correct count', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    expect(screen.getByText('Administrators')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 admin
  });

  it('displays workers section with correct count', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    expect(screen.getByText('Workers')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 workers
  });

  it('displays admin user details', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    // Name appears twice (avatar mock and display), so use getAllByText
    expect(screen.getAllByText('Admin User').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('admin@colby.edu')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('displays worker user details', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    // Names appear twice (avatar mock and display), so use getAllByText
    expect(screen.getAllByText('Worker One').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('worker1@colby.edu')).toBeInTheDocument();
    expect(screen.getAllByText('Worker Two').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('worker2@colby.edu')).toBeInTheDocument();
  });

  it('displays class year for workers who have it', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    expect(screen.getByText(/Class of 2025/)).toBeInTheDocument();
  });

  it('shows empty state when no administrators', () => {
    const workersOnly = mockUsers.filter((u) => u.role === 'user');
    render(<TeamModal show={true} onHide={mockOnHide} users={workersOnly} />);

    expect(screen.getByText('No administrators found')).toBeInTheDocument();
  });

  it('shows empty state when no workers', () => {
    const adminsOnly = mockUsers.filter((u) => u.role === 'admin');
    render(<TeamModal show={true} onHide={mockOnHide} users={adminsOnly} />);

    expect(screen.getByText('No workers found')).toBeInTheDocument();
  });

  it('renders user avatars for all users', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    const avatars = screen.getAllByTestId('user-avatar');
    expect(avatars).toHaveLength(3);
  });

  it('renders Worker badges for worker users', () => {
    render(<TeamModal show={true} onHide={mockOnHide} users={mockUsers} />);

    const workerBadges = screen.getAllByText('Worker');
    expect(workerBadges).toHaveLength(2);
  });
});

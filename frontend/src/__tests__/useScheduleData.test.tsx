/**
 * Tests for useScheduleData hook.
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useScheduleData } from '../hooks/useScheduleData';
import api from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('useScheduleData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with loading state', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    expect(result.current.loading).toBe(true);
    expect(result.current.data.users).toEqual([]);
    expect(result.current.data.assignments).toEqual([]);
  });

  it('loads data successfully', async () => {
    const mockData = {
      users: [{ id: 1, name: 'Test User', email: 'test@test.com', role: 'user' }],
      assignments: [{ id: 1, user_id: 1, location_id: 1, time_slot_id: 1 }],
      locations: [{ id: 1, name: 'Location 1', is_active: true }],
      timeSlots: [{ id: 1, day_of_week: 0, start_time: '09:00', end_time: '10:00' }],
    };

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/assignments')) return Promise.resolve({ data: mockData.assignments });
      if (url.includes('/users')) return Promise.resolve({ data: mockData.users });
      if (url.includes('/locations')) return Promise.resolve({ data: mockData.locations });
      if (url.includes('/time-slots')) return Promise.resolve({ data: mockData.timeSlots });
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.users.length).toBe(1);
    expect(result.current.data.assignments.length).toBe(1);
    expect(result.current.data.locations.length).toBe(1);
    expect(result.current.data.timeSlots.length).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('handles API error', async () => {
    (api.get as jest.Mock).mockRejectedValue({
      response: { data: { error: 'Server error' } },
    });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
  });

  it('handles error without response', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load schedule data');
  });

  it('filters inactive locations', async () => {
    const mockLocations = [
      { id: 1, name: 'Active', is_active: true },
      { id: 2, name: 'Inactive', is_active: false },
    ];

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/locations')) return Promise.resolve({ data: mockLocations });
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.locations.length).toBe(1);
    expect(result.current.data.locations[0].name).toBe('Active');
  });

  it('filters admin users', async () => {
    const mockUsers = [
      { id: 1, name: 'User', role: 'user' },
      { id: 2, name: 'Admin', role: 'admin' },
    ];

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve({ data: mockUsers });
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data.users.length).toBe(1);
    expect(result.current.data.users[0].name).toBe('User');
  });

  it('passes location filter to API', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    renderHook(() =>
      useScheduleData({
        weekStart: '2024-01-01',
        locationFilter: 5,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('location_id=5'));
    });
  });

  it('passes user filter to API', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    renderHook(() =>
      useScheduleData({
        weekStart: '2024-01-01',
        userFilter: 10,
      })
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('user_id=10'));
    });
  });

  it('provides lookup maps', async () => {
    const mockData = {
      users: [{ id: 1, name: 'Test User', email: 'test@test.com', role: 'user' }],
      locations: [{ id: 2, name: 'Location 1', is_active: true }],
      timeSlots: [{ id: 3, day_of_week: 0, start_time: '09:00', end_time: '10:00' }],
    };

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/users')) return Promise.resolve({ data: mockData.users });
      if (url.includes('/locations')) return Promise.resolve({ data: mockData.locations });
      if (url.includes('/time-slots')) return Promise.resolve({ data: mockData.timeSlots });
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.usersById.get(1)?.name).toBe('Test User');
    expect(result.current.locationsById.get(2)?.name).toBe('Location 1');
    expect(result.current.timeSlotsById.get(3)?.day_of_week).toBe(0);
  });

  it('refreshData reloads data', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCallCount = (api.get as jest.Mock).mock.calls.length;

    await act(async () => {
      result.current.refreshData();
    });

    expect((api.get as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('getAssignmentsForCell returns correct assignments', async () => {
    const mockTimeSlots = [{ id: 1, day_of_week: 0, start_time: '09:00', end_time: '10:00' }];
    const mockAssignments = [{ id: 100, user_id: 1, location_id: 5, time_slot_id: 1 }];

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/time-slots')) return Promise.resolve({ data: mockTimeSlots });
      if (url.includes('/assignments')) return Promise.resolve({ data: mockAssignments });
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const assignments = result.current.getAssignmentsForCell(0, 1, 5);
    expect(assignments.length).toBe(1);
    expect(assignments[0].id).toBe(100);
  });

  it('getAssignmentsForCell returns empty for nonexistent cell', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const assignments = result.current.getAssignmentsForCell(0, 999, 999);
    expect(assignments).toEqual([]);
  });

  it('getUnassignedShifts returns empty array', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useScheduleData({ weekStart: '2024-01-01' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const unassigned = result.current.getUnassignedShifts();
    expect(unassigned).toEqual([]);
  });
});

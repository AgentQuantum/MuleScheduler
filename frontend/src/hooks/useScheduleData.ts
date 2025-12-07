import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { ScheduleData, Assignment, User, Location, TimeSlot } from '../types/scheduler';

interface UseScheduleDataOptions {
  weekStart: string;
  locationFilter?: number | null;
  userFilter?: number | null;
}

export const useScheduleData = (options: UseScheduleDataOptions) => {
  const { weekStart, locationFilter, userFilter } = options;
  const [data, setData] = useState<ScheduleData>({
    users: [],
    assignments: [],
    locations: [],
    timeSlots: [],
    weekStart,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ week_start: weekStart });
      if (locationFilter) params.append('location_id', locationFilter.toString());
      if (userFilter) params.append('user_id', userFilter.toString());

      const [assignmentsRes, usersRes, locationsRes, timeSlotsRes] = await Promise.all([
        api.get(`/assignments?${params.toString()}`),
        api.get('/users'),
        api.get('/locations'),
        api.get('/time-slots'),
      ]);

      // Load all users (not just 'user' role) so assignments can display properly
      // Filter to 'user' role only for the workers list display
      const allUsers = usersRes.data as User[];
      setData({
        users: allUsers.filter((u: User) => u.role === 'user') as User[],
        assignments: assignmentsRes.data as Assignment[],
        locations: locationsRes.data.filter((l: Location) => l.is_active) as Location[],
        timeSlots: timeSlotsRes.data as TimeSlot[],
        weekStart,
        allUsers, // Store all users for assignment lookups
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schedule data');
      console.error('Failed to load schedule data:', err);
    } finally {
      setLoading(false);
    }
  }, [weekStart, locationFilter, userFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  // Normalized data structures for easy lookup
  const usersById = new Map(data.users.map((u) => [u.id, u]));
  // Use allUsers for assignment lookups (includes admin and other roles)
  const allUsersById = new Map((data.allUsers || data.users).map((u) => [u.id, u]));
  const assignmentsById = new Map(data.assignments.map((a) => [a.id, a]));
  const locationsById = new Map(data.locations.map((l) => [l.id, l]));
  const timeSlotsById = new Map(data.timeSlots.map((ts) => [ts.id, ts]));

  // Grid index: [dayOfWeek][timeSlotId][locationId] = [assignmentIds]
  const gridIndex = new Map<number, Map<number, Map<number, number[]>>>();

  data.assignments.forEach((assignment) => {
    const timeSlot = timeSlotsById.get(assignment.time_slot_id);
    if (!timeSlot) return;

    const day = timeSlot.day_of_week;
    const timeSlotId = assignment.time_slot_id;
    const locationId = assignment.location_id;

    if (!gridIndex.has(day)) {
      gridIndex.set(day, new Map());
    }
    const dayMap = gridIndex.get(day)!;

    if (!dayMap.has(timeSlotId)) {
      dayMap.set(timeSlotId, new Map());
    }
    const timeSlotMap = dayMap.get(timeSlotId)!;

    if (!timeSlotMap.has(locationId)) {
      timeSlotMap.set(locationId, []);
    }
    timeSlotMap.get(locationId)!.push(assignment.id);
  });

  // Get assignments for a specific cell
  const getAssignmentsForCell = useCallback(
    (dayOfWeek: number, timeSlotId: number, locationId: number): Assignment[] => {
      const dayMap = gridIndex.get(dayOfWeek);
      if (!dayMap) return [];

      const timeSlotMap = dayMap.get(timeSlotId);
      if (!timeSlotMap) return [];

      const assignmentIds = timeSlotMap.get(locationId);
      if (!assignmentIds) return [];

      return assignmentIds
        .map((id) => assignmentsById.get(id))
        .filter((a): a is Assignment => a !== undefined);
    },
    [gridIndex, assignmentsById]
  );

  // Get unassigned shifts (shifts with requirements but no assignments)
  const getUnassignedShifts = useCallback((): Array<{
    locationId: number;
    timeSlotId: number;
    locationName: string;
    timeSlot: TimeSlot;
    requiredWorkers: number;
    currentWorkers: number;
  }> => {
    // This would ideally come from shift requirements
    // For now, return empty array - can be extended later
    return [];
  }, []);

  return {
    data,
    loading,
    error,
    refreshData,
    usersById,
    allUsersById, // For assignment lookups (includes all roles)
    assignmentsById,
    locationsById,
    timeSlotsById,
    getAssignmentsForCell,
    getUnassignedShifts,
  };
};

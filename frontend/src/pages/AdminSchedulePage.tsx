import { useState } from 'react';
import { Row, Col, Form, Button, Alert } from 'react-bootstrap';
import api from '../services/api';
import ShiftScheduleGrid from '../components/ShiftScheduleGrid';
import ShiftDetailsDrawer from '../components/ShiftDetailsDrawer';
import ActionableInsights from '../components/ActionableInsights';
import { useToast } from '../components/Toast';
import { ScheduleIllustration, NoWorkersIllustration } from '../components/Illustrations';
import { useScheduleData } from '../hooks/useScheduleData';
import { Assignment } from '../types/scheduler';
import '../styles/scheduler.css';

function AdminSchedulePage() {
  const { showToast } = useToast();

  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    return monday.toISOString().split('T')[0];
  });

  const [locationFilter, setLocationFilter] = useState<number | null>(null);
  const [userFilter, _setUserFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRunningScheduler, setIsRunningScheduler] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');

  const { data, loading, error, refreshData, timeSlotsById } = useScheduleData({
    weekStart,
    locationFilter,
    userFilter,
  });

  // Filter users by search query
  const filteredUsers = data.users.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  // Filter assignments by location
  const filteredAssignments = locationFilter
    ? data.assignments.filter((a) => a.location_id === locationFilter)
    : data.assignments;

  const handleWeekChange = (direction: 'prev' | 'next' | 'today') => {
    const current = new Date(weekStart);
    if (direction === 'prev') {
      current.setDate(current.getDate() - 7);
    } else if (direction === 'next') {
      current.setDate(current.getDate() + 7);
    } else {
      const today = new Date();
      current.setTime(today.getTime());
      current.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    }
    setWeekStart(current.toISOString().split('T')[0]);
  };

  const formatWeekRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  // @ts-ignore unused handler placeholder
  const _handleAssignmentMove = async (
    assignmentId: number,
    target: { userId: number; locationId: number; timeSlotId: number }
  ) => {
    try {
      const timeSlot = timeSlotsById.get(target.timeSlotId);
      if (!timeSlot) throw new Error('Time slot not found');

      const assignment = data.assignments.find((a) => a.id === assignmentId);
      if (!assignment) throw new Error('Assignment not found');

      await api.put(`/assignments/${assignmentId}/move`, {
        new_time_slot_id: target.timeSlotId,
        new_location_id: target.locationId,
        new_start: new Date(weekStart).toISOString(),
        new_end: new Date(weekStart).toISOString(),
      });

      if (target.userId !== assignment.user_id) {
        await api.put(`/assignments/${assignmentId}`, {
          user_id: target.userId,
        });
      }

      showToast('success', 'Shift moved successfully!');
      refreshData();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || 'Failed to move shift';
      showToast('danger', errorMsg);
      throw err;
    }
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDrawerOpen(true);
  };

  const handleAssignmentUpdate = async (
    assignmentId: number,
    updates: { userId?: number; locationId?: number; timeSlotId?: number }
  ) => {
    try {
      if (updates.userId !== undefined) {
        await api.put(`/assignments/${assignmentId}`, { user_id: updates.userId });
      }
      if (updates.locationId !== undefined || updates.timeSlotId !== undefined) {
        const assignment = data.assignments.find((a) => a.id === assignmentId);
        if (assignment) {
          await api.put(`/assignments/${assignmentId}/move`, {
            new_time_slot_id: updates.timeSlotId || assignment.time_slot_id,
            new_location_id: updates.locationId || assignment.location_id,
            new_start: new Date(weekStart).toISOString(),
            new_end: new Date(weekStart).toISOString(),
          });
        }
      }
      showToast('success', 'Shift updated successfully!');
      refreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update shift';
      showToast('danger', errorMsg);
      throw err;
    }
  };

  const handleAssignmentDelete = async (assignmentId: number) => {
    try {
      await api.delete(`/assignments/${assignmentId}`);
      showToast('success', 'Shift deleted successfully!');
      setIsDrawerOpen(false);
      setSelectedAssignment(null);
      refreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to delete shift';
      showToast('danger', errorMsg);
      throw err;
    }
  };

  // Handler for drag-and-drop assigning workers to shifts
  const handleAssignWorker = async (userId: number, timeSlotId: number, locationId: number) => {
    try {
      await api.post('/assignments', {
        user_id: userId,
        time_slot_id: timeSlotId,
        location_id: locationId,
        week_start_date: weekStart,
      });
      showToast('success', 'Worker assigned successfully!');
      refreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to assign worker';
      showToast('danger', errorMsg);
      throw err;
    }
  };

  // Handler for removing an assignment
  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      // Find assignment to get user name before deleting
      const assignment = data.assignments.find((a) => a.id === assignmentId);
      const userName = assignment?.user_name || 'Student';

      await api.delete(`/assignments/${assignmentId}`);
      showToast('success', `${userName} removed`);
      refreshData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to remove assignment';
      showToast('danger', errorMsg);
      throw err;
    }
  };

  const handleRunScheduler = async () => {
    setIsRunningScheduler(true);
    try {
      await api.post('/assignments/run-scheduler', {
        week_start_date: weekStart,
      });
      showToast('success', 'Auto-scheduler completed successfully!');
      refreshData();
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to run scheduler');
    } finally {
      setIsRunningScheduler(false);
    }
  };

  // Calculate stats
  const totalShifts = data.assignments.length;
  const assignedShifts = data.assignments.filter((a) => a.user_id).length;
  const unassignedCount = totalShifts - assignedShifts;
  // Calculate unique workers (distinct user_ids from assignments)
  const uniqueWorkers = new Set(data.assignments.filter((a) => a.user_id).map((a) => a.user_id))
    .size;

  if (loading) {
    return (
      <div className="ms-loading" style={{ minHeight: '60vh' }}>
        <div className="ms-spinner"></div>
        <p className="ms-loading-text">Loading schedule data...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="ms-animate-in">
      {/* Stats Row - Color-coded cards with emphasized numbers */}
      <Row className="g-4 mb-4">
        <Col xs={6} lg={3}>
          <div className="ms-stat-card sky">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              {totalShifts > 0 && (
                <span className="ms-stat-trend up">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  </svg>
                  Active
                </span>
              )}
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{totalShifts}</div>
              <div className="ms-stat-label">Total Shifts</div>
              <div className="ms-stat-sublabel">This week</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card mint">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              {assignedShifts > 0 && (
                <span className="ms-stat-trend up">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Good
                </span>
              )}
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{assignedShifts}</div>
              <div className="ms-stat-label">Assigned</div>
              <div className="ms-stat-sublabel">Shifts filled</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card yellow">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              {unassignedCount > 0 && (
                <span className="ms-stat-trend down">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Needs attention
                </span>
              )}
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{unassignedCount}</div>
              <div className="ms-stat-label">Unassigned</div>
              <div className="ms-stat-sublabel">Open shifts</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card lavender">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              {uniqueWorkers > 0 && (
                <span className="ms-stat-trend up">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Active
                </span>
              )}
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{uniqueWorkers}</div>
              <div className="ms-stat-label">Workers</div>
              <div className="ms-stat-sublabel">Unique this week</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Top Toolbar Card */}
      <div className="ms-toolbar">
        {/* Week Navigation with Icon Buttons */}
        <div className="ms-week-picker">
          <button
            className="ms-icon-btn"
            onClick={() => handleWeekChange('prev')}
            title="Previous week"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="ms-week-picker-label">{formatWeekRange(weekStart)}</div>
          <button
            className="ms-icon-btn"
            onClick={() => handleWeekChange('next')}
            title="Next week"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button className="ms-week-picker-today" onClick={() => handleWeekChange('today')}>
            Today
          </button>
        </div>

        {/* Filter Chips with Professional Icons */}
        <div className="ms-filter-chips">
          <button
            className={`ms-chip ms-chip-filter ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            All
          </button>
          <button
            className={`ms-chip ms-chip-assigned ms-chip-filter ${statusFilter === 'assigned' ? 'active' : ''}`}
            onClick={() => setStatusFilter('assigned')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Assigned
          </button>
          <button
            className={`ms-chip ms-chip-unassigned ms-chip-filter ${statusFilter === 'unassigned' ? 'active' : ''}`}
            onClick={() => setStatusFilter('unassigned')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Unassigned
          </button>
        </div>

        {/* Search & Filters */}
        <div className="d-flex align-items-center gap-3">
          <div style={{ maxWidth: '220px', width: '100%' }}>
            <Form.Control
              type="text"
              placeholder="Search workers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ms-search-input"
            />
          </div>
          <div style={{ minWidth: '160px' }}>
            <Form.Select
              value={locationFilter || ''}
              onChange={(e) => setLocationFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="ms-select-pill"
            >
              <option value="">All Locations</option>
              {data.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>

        {/* Run Scheduler Button */}
        <Button
          className="ms-btn ms-btn-primary"
          onClick={handleRunScheduler}
          disabled={isRunningScheduler}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isRunningScheduler ? (
            <>
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>Run Scheduler</span>
            </>
          )}
        </Button>
      </div>

      {/* Main Content - Full Width Schedule Grid */}
      <Row className="g-4">
        <Col xs={12}>
          {filteredUsers.length === 0 ? (
            <div className="ms-card">
              <div className="ms-card-body">
                <div className="ms-empty-state">
                  <div className="ms-empty-illustration">
                    <NoWorkersIllustration width={220} height={180} />
                  </div>
                  <h4 className="ms-empty-title">No Workers Found</h4>
                  <p className="ms-empty-description">
                    {searchQuery
                      ? `No workers match "${searchQuery}". Try a different search term.`
                      : 'No workers are registered yet. Workers will appear here once they sign up.'}
                  </p>
                </div>
              </div>
            </div>
          ) : data.timeSlots.length === 0 ? (
            <div className="ms-card">
              <div className="ms-card-body">
                <div className="ms-empty-state">
                  <div className="ms-empty-illustration">
                    <ScheduleIllustration width={220} height={180} />
                  </div>
                  <h4 className="ms-empty-title">No Time Slots Configured</h4>
                  <p className="ms-empty-description">
                    You need to configure time slots before you can schedule workers.
                  </p>
                  <Button
                    className="ms-btn ms-btn-primary"
                    onClick={() => (window.location.href = '/admin/settings')}
                  >
                    Go to Settings
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <ShiftScheduleGrid
              assignments={filteredAssignments}
              users={filteredUsers}
              locations={data.locations}
              timeSlots={data.timeSlots}
              weekStart={weekStart}
              onAssignWorker={handleAssignWorker}
              onRemoveAssignment={handleRemoveAssignment}
              onAssignmentClick={handleAssignmentClick}
              onAlert={(type, message) => showToast(type, message)}
              allUsers={data.allUsers}
            />
          )}
        </Col>
      </Row>

      {/* Actionable Insights Panel - Below Schedule */}
      <Row className="g-4 mt-2">
        <Col lg={4}>
          <ActionableInsights
            assignments={filteredAssignments}
            users={data.users}
            timeSlots={data.timeSlots}
            maxCapacity={data.settings?.max_workers_per_shift || 3}
          />
        </Col>
      </Row>

      {/* Right Drawer - Shift Details */}
      <ShiftDetailsDrawer
        assignment={selectedAssignment}
        users={data.users}
        locations={data.locations}
        timeSlot={
          selectedAssignment ? timeSlotsById.get(selectedAssignment.time_slot_id) : undefined
        }
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAssignment(null);
        }}
        onUpdate={handleAssignmentUpdate}
        onDelete={handleAssignmentDelete}
      />
    </div>
  );
}

export default AdminSchedulePage;

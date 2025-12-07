import { useState, useEffect } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import api from '../services/api';
import { Location, TimeSlot, UserAvailability } from '../types/scheduler';
import { useAuth } from '../contexts/AuthContext';
import StatusChip from '../components/StatusChip';
import IconButton from '../components/IconButton';
import { AvailabilityIllustration } from '../components/Illustrations';
import { useToast } from '../components/Toast';
import '../styles/scheduler.css';

// SVG Icons
const Icons = {
  Calendar: () => (
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  MapPin: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Check: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Star: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

// Day names
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function StudentAvailabilityPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    return monday.toISOString().split('T')[0];
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availabilities, setAvailabilities] = useState<Map<string, UserAvailability>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Generate default time slots (8am-5pm, 30-min intervals) - industry standard
  const generateDefaultSlots = (dayOfWeek: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let slotId = dayOfWeek * 100 + 1000;
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startHour = hour.toString().padStart(2, '0');
        const startMin = minute.toString().padStart(2, '0');
        const endMinute = (minute + 30) % 60;
        const endHour = minute + 30 >= 60 ? hour + 1 : hour;
        slots.push({
          id: slotId++,
          day_of_week: dayOfWeek,
          start_time: `${startHour}:${startMin}:00`,
          end_time: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`,
        });
      }
    }
    return slots;
  };

  useEffect(() => {
    loadData();
  }, [weekStart]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locationsRes, timeSlotsRes, availabilityRes] = await Promise.all([
        api.get('/locations'),
        api.get('/time-slots'),
        api.get(`/availability?week_start=${weekStart}`),
      ]);

      const activeLocations = locationsRes.data.filter((l: Location) => l.is_active);
      setLocations(activeLocations);

      // Auto-select first location if none selected
      if (activeLocations.length > 0 && !selectedLocationId) {
        setSelectedLocationId(activeLocations[0].id);
      }

      setTimeSlots(timeSlotsRes.data);

      const availMap = new Map<string, UserAvailability>();
      availabilityRes.data.forEach((av: UserAvailability) => {
        const key = `${av.location_id}-${av.time_slot_id}`;
        availMap.set(key, av);
      });
      setAvailabilities(availMap);
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Get all unique time ranges across all days, sorted
  const getUniqueTimeRanges = (): { start: string; end: string }[] => {
    const timeRanges = new Map<string, { start: string; end: string }>();

    ALL_DAYS.forEach((day) => {
      const existingSlots = timeSlots.filter((ts) => ts.day_of_week === day);
      const daySlots = existingSlots.length > 0 ? existingSlots : generateDefaultSlots(day);

      daySlots.forEach((slot) => {
        const key = `${slot.start_time}-${slot.end_time}`;
        if (!timeRanges.has(key)) {
          timeRanges.set(key, { start: slot.start_time, end: slot.end_time });
        }
      });
    });

    // Sort by start time
    return Array.from(timeRanges.values()).sort((a, b) => a.start.localeCompare(b.start));
  };

  // Get slot for a specific day and time range
  const getSlotForDayAndTime = (
    day: number,
    startTime: string,
    endTime: string
  ): TimeSlot | undefined => {
    const existingSlots = timeSlots.filter((ts) => ts.day_of_week === day);
    const daySlots = existingSlots.length > 0 ? existingSlots : generateDefaultSlots(day);
    return daySlots.find((s) => s.start_time === startTime && s.end_time === endTime);
  };

  // Handle cell click - cycle through: Not Available → Available → Preferred → Not Available
  const handleCellClick = (day: number, startTime: string, endTime: string) => {
    if (!selectedLocationId) return;

    const slot = getSlotForDayAndTime(day, startTime, endTime);
    if (!slot) return;

    const key = `${selectedLocationId}-${slot.id}`;
    const newAvailabilities = new Map(availabilities);
    const current = newAvailabilities.get(key);

    if (!current) {
      // Not available → Available
      newAvailabilities.set(key, {
        user_id: user?.id || 0,
        location_id: selectedLocationId,
        time_slot_id: slot.id,
        preference_level: 1,
        week_start_date: weekStart,
      });
    } else if (current.preference_level === 1) {
      // Available → Preferred
      newAvailabilities.set(key, { ...current, preference_level: 2 });
    } else {
      // Preferred → Not available
      newAvailabilities.delete(key);
    }

    setAvailabilities(newAvailabilities);
  };

  // Get availability status for a cell
  const getCellStatus = (day: number, startTime: string, endTime: string): number => {
    if (!selectedLocationId) return 0;

    const slot = getSlotForDayAndTime(day, startTime, endTime);
    if (!slot) return 0;

    const key = `${selectedLocationId}-${slot.id}`;
    const availability = availabilities.get(key);
    return availability?.preference_level || 0;
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const entries = Array.from(availabilities.values()).map((av) => ({
        location_id: av.location_id,
        time_slot_id: av.time_slot_id,
        preference_level: av.preference_level,
      }));

      await api.post('/availability/batch', {
        week_start_date: weekStart,
        entries,
      });

      showToast('success', 'Availability saved!');
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (!selectedLocationId) return;

    const newAvailabilities = new Map(availabilities);
    // Remove all entries for selected location
    Array.from(newAvailabilities.keys()).forEach((key) => {
      if (key.startsWith(`${selectedLocationId}-`)) {
        newAvailabilities.delete(key);
      }
    });
    setAvailabilities(newAvailabilities);
    showToast('success', 'Availability cleared');
  };

  const handleCopyFromLastWeek = async () => {
    try {
      const current = new Date(weekStart);
      current.setDate(current.getDate() - 7);
      const lastWeekStart = current.toISOString().split('T')[0];

      const lastWeekRes = await api.get(`/availability?week_start=${lastWeekStart}`);
      const lastWeekAvailabilities = lastWeekRes.data;

      if (lastWeekAvailabilities.length === 0) {
        showToast('info', 'No availability found for last week');
        return;
      }

      const newAvailabilities = new Map<string, UserAvailability>();
      lastWeekAvailabilities.forEach((av: UserAvailability) => {
        const key = `${av.location_id}-${av.time_slot_id}`;
        newAvailabilities.set(key, {
          ...av,
          week_start_date: weekStart,
        });
      });

      setAvailabilities(newAvailabilities);
      showToast('success', 'Copied from last week');
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to copy from last week');
    }
  };

  // Format time as compact start time (e.g., "9:00a", "12:30p")
  const formatTimeCompact = (timeStr: string): string => {
    const [hours, mins] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'p' : 'a';
    const displayHour = hour % 12 || 12;
    return mins === '00' ? `${displayHour}:00${ampm}` : `${displayHour}:${mins}${ampm}`;
  };

  const formatWeekRange = (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

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

  // Count availabilities for selected location
  const availableCount = Array.from(availabilities.values()).filter(
    (a) => a.preference_level === 1 && a.location_id === selectedLocationId
  ).length;
  const preferredCount = Array.from(availabilities.values()).filter(
    (a) => a.preference_level === 2 && a.location_id === selectedLocationId
  ).length;

  const timeRanges = getUniqueTimeRanges();

  if (loading) {
    return (
      <div className="ms-loading" style={{ minHeight: '60vh' }}>
        <div className="ms-spinner"></div>
        <p className="ms-loading-text">Loading availability data...</p>
      </div>
    );
  }

  return (
    <div className="ms-animate-in" style={{ paddingBottom: '100px' }}>
      {/* Stats Row */}
      <Row className="g-4 mb-4">
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
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{availableCount}</div>
              <div className="ms-stat-label">Available</div>
              <div className="ms-stat-sublabel">Slots marked</div>
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
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{preferredCount}</div>
              <div className="ms-stat-label">Preferred</div>
              <div className="ms-stat-sublabel">Priority slots</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card sky">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <Icons.MapPin />
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{locations.length}</div>
              <div className="ms-stat-label">Locations</div>
              <div className="ms-stat-sublabel">Work sites</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card yellow">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <Icons.Calendar />
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{timeRanges.length}</div>
              <div className="ms-stat-label">Time Slots</div>
              <div className="ms-stat-sublabel">Per day</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Toolbar */}
      <div className="ms-toolbar mb-4">
        <div className="ms-week-picker">
          <IconButton
            icon="chevronLeft"
            onClick={() => handleWeekChange('prev')}
            title="Previous week"
            size="sm"
          />
          <div className="ms-week-picker-label">{formatWeekRange(weekStart)}</div>
          <IconButton
            icon="chevronRight"
            onClick={() => handleWeekChange('next')}
            title="Next week"
            size="sm"
          />
          <button className="ms-week-picker-today" onClick={() => handleWeekChange('today')}>
            Today
          </button>
        </div>

        <div className="d-flex gap-2">
          <Button className="ms-btn ms-btn-secondary" onClick={handleCopyFromLastWeek}>
            Copy From Last Week
          </Button>
          <Button className="ms-btn ms-btn-secondary" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="ms-card">
          <div className="ms-card-body">
            <div className="ms-empty-state">
              <div className="ms-empty-illustration">
                <AvailabilityIllustration width={240} height={200} />
              </div>
              <h4 className="ms-empty-title">No Locations Available</h4>
              <p className="ms-empty-description">
                An administrator needs to configure at least one location.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Location Selector */}
          {locations.length > 1 && (
            <div className="ms-card mb-4">
              <div className="ms-card-body" style={{ padding: '12px 20px' }}>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span
                    style={{ fontSize: '0.85rem', color: 'var(--ms-text-muted)', fontWeight: 600 }}
                  >
                    <Icons.MapPin /> Location:
                  </span>
                  {locations.map((loc, idx) => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`ms-location-badge loc-${(idx % 6) + 1}`}
                      style={{
                        cursor: 'pointer',
                        opacity: selectedLocationId === loc.id ? 1 : 0.5,
                        transform: selectedLocationId === loc.id ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        border:
                          selectedLocationId === loc.id
                            ? '2px solid var(--ms-primary)'
                            : '2px solid transparent',
                      }}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="ms-card mb-4">
            <div className="ms-card-body" style={{ padding: '12px 20px' }}>
              <div className="d-flex align-items-center gap-4 flex-wrap">
                <span
                  style={{ fontSize: '0.85rem', color: 'var(--ms-text-muted)', fontWeight: 600 }}
                >
                  Click to set:
                </span>
                <StatusChip variant="default" label="Not Available" />
                <StatusChip variant="available" label="Available" />
                <StatusChip variant="preferred" label="Preferred" />
                <span className="ms-hint-text">
                  <span className="ms-hint-dot">•</span>
                  Click once for available, twice for preferred, thrice to clear
                </span>
              </div>
            </div>
          </div>

          {/* Availability Grid */}
          <div className="ms-card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="availability-grid-table">
                <thead>
                  <tr>
                    <th className="time-header">Time</th>
                    {ALL_DAYS.map((day, idx) => (
                      <th key={day} className="day-header">
                        {DAY_NAMES[idx]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeRanges.map(({ start, end }) => (
                    <tr key={`${start}-${end}`}>
                      <td className="time-cell">{formatTimeCompact(start)}</td>
                      {ALL_DAYS.map((day) => {
                        const status = getCellStatus(day, start, end);
                        const slot = getSlotForDayAndTime(day, start, end);
                        const hasSlot = !!slot;

                        return (
                          <td
                            key={day}
                            className={`availability-cell ${!hasSlot ? 'no-slot' : ''} ${status === 1 ? 'available' : status === 2 ? 'preferred' : ''}`}
                            onClick={() => hasSlot && handleCellClick(day, start, end)}
                            title={
                              hasSlot
                                ? status === 0
                                  ? 'Click to mark available'
                                  : status === 1
                                    ? 'Click to mark preferred'
                                    : 'Click to clear'
                                : 'Not scheduled'
                            }
                          >
                            {status === 1 && <Icons.Check />}
                            {status === 2 && <Icons.Star />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Fixed Save Button at Bottom */}
      {locations.length > 0 && (
        <div className="availability-save-bar">
          <div className="availability-save-content">
            <div className="availability-save-info">
              <strong>{availableCount + preferredCount}</strong> slots selected ({availableCount}{' '}
              available, {preferredCount} preferred)
            </div>
            <Button
              className="ms-btn ms-btn-accent"
              onClick={handleSave}
              disabled={saving}
              style={{ minWidth: '180px' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="me-2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Save Availability
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentAvailabilityPage;

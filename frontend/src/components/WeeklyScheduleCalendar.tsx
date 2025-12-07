import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import { Alert } from 'react-bootstrap';
import api from '../services/api';
import '../styles/calendar-overrides.css';

interface Assignment {
  id: number;
  user_id: number;
  user_name: string;
  location_id: number;
  location_name: string;
  time_slot_id: number;
  week_start_date: string;
  start?: string;
  end?: string;
  title?: string;
  time_slot?: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  };
}

interface WeeklyScheduleCalendarProps {
  role: 'user' | 'admin';
  weekStart: string;
  onWeekChange?: (newWeekStart: string) => void;
  locationFilter?: number | null;
  userFilter?: number | null;
}

function WeeklyScheduleCalendar({
  role,
  weekStart,
  onWeekChange,
  locationFilter,
  userFilter,
}: WeeklyScheduleCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  useEffect(() => {
    loadSchedule();
  }, [weekStart, locationFilter, userFilter]);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { week_start: weekStart };
      if (locationFilter) params.location_id = locationFilter;
      if (userFilter) params.user_id = userFilter;

      const response = await api.get('/assignments', { params });
      const assignments: Assignment[] = response.data;

      const calendarEvents = assignments
        .map((assignment) => {
          // Use start/end from API if available, otherwise calculate
          let start: Date;
          let end: Date;

          if (assignment.start && assignment.end) {
            start = new Date(assignment.start);
            end = new Date(assignment.end);
          } else if (assignment.time_slot) {
            // Fallback: calculate from week_start_date and time_slot
            const weekStartDate = new Date(assignment.week_start_date);
            const dayOfWeek = assignment.time_slot.day_of_week;
            const eventDate = new Date(weekStartDate);
            eventDate.setDate(weekStartDate.getDate() + dayOfWeek);

            const [startHours, startMinutes] = assignment.time_slot.start_time.split(':');
            const [endHours, endMinutes] = assignment.time_slot.end_time.split(':');

            start = new Date(eventDate);
            start.setHours(parseInt(startHours), parseInt(startMinutes), 0);

            end = new Date(eventDate);
            end.setHours(parseInt(endHours), parseInt(endMinutes), 0);
          } else {
            // Skip if no time info
            return null;
          }

          // Determine title based on role
          const title = isAdmin
            ? `${assignment.user_name} – ${assignment.location_name}`
            : assignment.location_name;

          return {
            id: assignment.id.toString(),
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor: isAdmin ? 'var(--color-primary)' : 'var(--color-primary)',
            borderColor: 'var(--color-primary-border)',
            textColor: 'var(--color-primary-darker)',
            extendedProps: {
              assignment,
              userId: assignment.user_id,
              userName: assignment.user_name,
              locationId: assignment.location_id,
              locationName: assignment.location_name,
              timeSlotId: assignment.time_slot_id,
            },
          };
        })
        .filter(Boolean);

      setEvents(calendarEvents as any[]);
    } catch (err: any) {
      console.error('Failed to load schedule:', err);
      setError(err.response?.data?.error || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleEventDrop = async (dropInfo: any) => {
    if (!isAdmin) return;

    const assignment: Assignment = dropInfo.event.extendedProps.assignment;
    const newStart = dropInfo.event.start;
    const newEnd = dropInfo.event.end;

    if (!newStart || !newEnd) {
      dropInfo.revert();
      setError('Invalid drop location');
      return;
    }

    // Find the time slot that matches the new datetime
    const dayOfWeek = newStart.getDay() === 0 ? 6 : newStart.getDay() - 1; // Convert to Monday=0
    const startTime = `${String(newStart.getHours()).padStart(2, '0')}:${String(newStart.getMinutes()).padStart(2, '0')}:00`;
    const endTime = `${String(newEnd.getHours()).padStart(2, '0')}:${String(newEnd.getMinutes()).padStart(2, '0')}:00`;

    try {
      // First, try to find matching time slot
      const timeSlotsResponse = await api.get('/time-slots');
      const timeSlots = timeSlotsResponse.data;

      let matchingTimeSlot = timeSlots.find(
        (ts: any) =>
          ts.day_of_week === dayOfWeek &&
          ts.start_time.startsWith(startTime.substring(0, 5)) &&
          ts.end_time.startsWith(endTime.substring(0, 5))
      );

      // If no exact match, find by day of week (we'll let backend handle the time slot mapping)
      if (!matchingTimeSlot) {
        matchingTimeSlot = timeSlots.find((ts: any) => ts.day_of_week === dayOfWeek);
      }

      if (!matchingTimeSlot) {
        dropInfo.revert();
        setError('No time slot found for the selected time');
        return;
      }

      // Call move endpoint
      await api.put(`/assignments/${assignment.id}/move`, {
        new_start: newStart.toISOString(),
        new_end: newEnd.toISOString(),
        new_time_slot_id: matchingTimeSlot.id,
        new_location_id: assignment.location_id, // Keep same location for now
      });

      // Reload schedule to get updated data
      await loadSchedule();
      setError(null);
    } catch (err: any) {
      // Revert the drag
      dropInfo.revert();

      // Show error message
      const errorCode = err.response?.data?.error;
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || 'Failed to move assignment';

      if (errorCode === 'OVER_MAX_WORKERS') {
        setError(`Conflict: ${errorMessage}`);
      } else if (errorCode === 'OVERLAP_FOR_USER') {
        setError(`Conflict: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleEventClick = (clickInfo: any) => {
    // Optional: Show details on click
    const assignment: Assignment = clickInfo.event.extendedProps.assignment;
    console.log('Event clicked:', assignment);
  };

  return (
    <div>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        events={events}
        initialDate={weekStart}
        height="auto"
        themeSystem="bootstrap5"
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        allDaySlot={false}
        editable={isAdmin}
        eventDurationEditable={false} // Don't allow resizing for now
        eventOverlap={false}
        droppable={false}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        weekends={true}
        dayHeaderFormat={{ weekday: 'short' }}
        slotLabelFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
        }}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          omitZeroMinute: false,
        }}
        datesSet={(dateInfo) => {
          // Update weekStart when calendar navigates (but only if different to avoid loops)
          if (onWeekChange && dateInfo.start) {
            const monday = new Date(dateInfo.start);
            monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
            const newWeekStart = monday.toISOString().split('T')[0];
            if (newWeekStart !== weekStart) {
              onWeekChange(newWeekStart);
            }
          }
        }}
        loading={(isLoading) => setLoading(isLoading)}
        eventDidMount={(info) => {
          // Add hover effect
          info.el.style.cursor = isAdmin ? 'move' : 'pointer';
        }}
      />
    </div>
  );
}

export default WeeklyScheduleCalendar;

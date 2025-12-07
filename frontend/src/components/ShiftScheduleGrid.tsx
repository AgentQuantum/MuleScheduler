import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import UserAvatar from './UserAvatar';
import { Assignment, TimeSlot, Location, User } from '../types/scheduler';
import '../styles/scheduler.css';

// Worker color palette - each worker gets a unique color
const WORKER_COLORS = [
  { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }, // Red
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }, // Blue
  { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // Green
  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Yellow
  { bg: '#E9D5FF', border: '#8B5CF6', text: '#5B21B6' }, // Purple
  { bg: '#CFFAFE', border: '#06B6D4', text: '#155E75' }, // Cyan
  { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' }, // Pink
  { bg: '#FED7AA', border: '#F97316', text: '#9A3412' }, // Orange
];

const getWorkerColor = (userId: number) => {
  return WORKER_COLORS[userId % WORKER_COLORS.length];
};

interface ShiftScheduleGridProps {
  assignments: Assignment[];
  users: User[];
  locations: Location[];
  timeSlots: TimeSlot[];
  weekStart: string;
  onAssignWorker: (userId: number, timeSlotId: number, locationId: number) => Promise<void>;
  onRemoveAssignment: (assignmentId: number) => Promise<void>;
  onAssignmentClick: (assignment: Assignment) => void;
  onAlert?: (type: 'warning' | 'info' | 'success', message: string) => void;
  allUsers?: User[]; // All users (including admin) for assignment lookups
}

// Draggable worker in sidebar
const DraggableWorker: React.FC<{
  user: User;
  color: (typeof WORKER_COLORS)[0];
  isDragging?: boolean;
}> = ({ user, color, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `worker-${user.id}`,
    data: { type: 'worker', user },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="calendar-worker-card"
      {...listeners}
      {...attributes}
    >
      <div className="worker-color-bar" style={{ background: color.border }} />
      <UserAvatar
        name={user.name}
        userId={user.id}
        profilePhotoUrl={
          user.profile_picture_url
            ? user.profile_picture_url.startsWith('http')
              ? user.profile_picture_url
              : `http://localhost:5000${user.profile_picture_url}`
            : undefined
        }
        size="sm"
        showBorder={false}
      />
      <div className="worker-details">
        <div className="worker-name" style={{ color: color.text }}>
          {user.name}
        </div>
        <div className="worker-email">{user.email}</div>
      </div>
    </div>
  );
};

// Shift Block - Calendar-style event block
const ShiftBlock: React.FC<{
  assignment: Assignment;
  user?: User;
  timeSlot?: TimeSlot;
  color: (typeof WORKER_COLORS)[0];
  onRemove: () => void;
  onClick: () => void;
}> = ({ assignment, user, timeSlot, color, onRemove, onClick }) => {
  return (
    <div
      className="calendar-shift-block"
      onClick={onClick}
      style={{
        background: color.bg,
        borderLeft: `4px solid ${color.border}`,
      }}
    >
      <div className="shift-block-content">
        <UserAvatar
          name={user?.name || '?'}
          userId={assignment.user_id}
          profilePhotoUrl={
            user?.profile_picture_url
              ? user.profile_picture_url.startsWith('http')
                ? user.profile_picture_url
                : `http://localhost:5000${user.profile_picture_url}`
              : undefined
          }
          size="xs"
          showBorder={false}
        />
        <span className="shift-block-name" style={{ color: color.text }}>
          {user?.name?.split(' ')[0] || 'Unknown'}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shift-block-remove"
        title="Remove assignment"
      >
        ×
      </button>
    </div>
  );
};

// Drop Zone for a time slot
const TimeSlotDropZone: React.FC<{
  timeSlot: TimeSlot;
  locationId: number;
  day: number;
  isOver: boolean;
  children: React.ReactNode;
}> = ({ timeSlot, locationId, day, isOver, children }) => {
  const { setNodeRef } = useDroppable({
    id: `slot-${locationId}-${timeSlot.id}-${day}`,
    data: { type: 'slot', timeSlotId: timeSlot.id, locationId, day },
  });

  return (
    <div ref={setNodeRef} className={`calendar-cell ${isOver ? 'drag-over' : ''}`}>
      {children}
    </div>
  );
};

// Drop Zone for unconfigured days - shows subtle centered message only once per day
const UnconfiguredDropZone: React.FC<{
  day: number;
  timeSlotId: string;
  isOver: boolean;
  showHint?: boolean;
}> = ({ day, timeSlotId, isOver, showHint = false }) => {
  const { setNodeRef } = useDroppable({
    id: `unconfigured-${day}-${timeSlotId}`,
    data: { type: 'unconfigured', day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`calendar-cell not-configured ${isOver ? 'drag-over-invalid' : ''}`}
    >
      {showHint && (
        <div className="not-configured-hint">
          <span>Configure to add workers</span>
        </div>
      )}
    </div>
  );
};

const ShiftScheduleGrid: React.FC<ShiftScheduleGridProps> = ({
  assignments,
  users,
  locations,
  timeSlots,
  weekStart,
  onAssignWorker,
  onRemoveAssignment,
  onAssignmentClick,
  onAlert,
  allUsers,
}) => {
  const [activeWorker, setActiveWorker] = useState<User | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // All 7 days of the week
  const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get configured days (days that have time slots)
  const configuredDays = new Set(timeSlots.map((ts) => ts.day_of_week));

  // Use allUsers for assignment lookups (includes all roles), fallback to users
  const usersForLookup = allUsers || users;
  const usersById = new Map(usersForLookup.map((u) => [u.id, u]));

  const getDayDate = (dayOfWeek: number): Date => {
    const weekStartDate = new Date(weekStart);
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + dayOfWeek);
    return dayDate;
  };

  const isToday = (dayOfWeek: number): boolean => {
    const dayDate = getDayDate(dayOfWeek);
    return dayDate.toDateString() === new Date().toDateString();
  };

  // Get unique time ranges sorted
  const uniqueTimeRanges = Array.from(
    new Set(timeSlots.map((ts) => `${ts.start_time}-${ts.end_time}`))
  ).sort();

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}${minutes !== '00' ? ':' + minutes : ''} ${ampm}`;
  };

  const formatTimeShort = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'p' : 'a';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes}${ampm}`;
  };

  const location = locations[0];

  const getAssignmentsForCell = (timeSlotId: number, locationId: number) => {
    return assignments.filter((a) => a.time_slot_id === timeSlotId && a.location_id === locationId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'worker') {
      setActiveWorker(data.user);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const overId = String(over.id);
      if (overId.startsWith('slot-')) {
        const overData = over.data.current;
        // Only allow drag-over on configured days
        if (overData?.type === 'slot') {
          const slotDay = timeSlots.find((ts) => ts.id === overData.timeSlotId)?.day_of_week;
          if (slotDay !== undefined && configuredDays.has(slotDay)) {
            setDragOverCell(overId);
            return;
          }
        }
      } else if (overId.startsWith('unconfigured-')) {
        // Show visual feedback when dragging over unconfigured day
        setDragOverCell(overId);
        return;
      }
    }
    setDragOverCell(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveWorker(null);
    setDragOverCell(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'worker') {
      // Check if dropping on unconfigured day - silently ignore
      if (overData?.type === 'unconfigured') {
        return;
      }

      // Check if dropping on valid slot
      if (overData?.type === 'slot') {
        const slotDay = timeSlots.find((ts) => ts.id === overData.timeSlotId)?.day_of_week;

        if (slotDay === undefined || !configuredDays.has(slotDay)) {
          // Day is not configured - silently ignore
          return;
        }

        const userId = activeData.user.id;
        const existing = assignments.find(
          (a) =>
            a.user_id === userId &&
            a.time_slot_id === overData.timeSlotId &&
            a.location_id === overData.locationId
        );
        if (!existing) {
          await onAssignWorker(userId, overData.timeSlotId, overData.locationId);
        }
      }
    }
  };

  if (!location) {
    return (
      <div className="calendar-empty-state">
        <p>No locations configured. Add a location in Settings to start scheduling.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="calendar-schedule-container">
        {/* Workers Sidebar */}
        <div className="calendar-workers-sidebar">
          <div className="calendar-sidebar-header">
            <svg
              width="16"
              height="16"
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
            <span>Workers</span>
            <span className="calendar-badge">{users.length}</span>
          </div>
          <div className="calendar-workers-list">
            {users.map((user) => (
              <DraggableWorker
                key={user.id}
                user={user}
                color={getWorkerColor(user.id)}
                isDragging={activeWorker?.id === user.id}
              />
            ))}
            {users.length === 0 && (
              <div className="calendar-no-workers">
                <p>No workers available</p>
              </div>
            )}
          </div>
          <div className="calendar-sidebar-footer">Drag to assign shifts</div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {/* Header Row - Days */}
          <div className="calendar-header-row">
            <div className="calendar-time-header">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            {ALL_DAYS.map((day) => {
              const dayDate = getDayDate(day);
              const isConfigured = configuredDays.has(day);
              const isTodayCell = isToday(day);

              return (
                <div
                  key={day}
                  className={`calendar-day-header ${isTodayCell ? 'today' : ''} ${!isConfigured ? 'not-configured' : ''}`}
                >
                  <div className="day-date-number">{dayDate.getDate()}</div>
                  <div className="day-date-name">{DAY_SHORT[day]}</div>
                </div>
              );
            })}
          </div>

          {/* Body - Time rows */}
          <div className="calendar-body">
            {uniqueTimeRanges.length === 0 ? (
              <div className="calendar-no-slots">
                <p>No time slots configured</p>
                <p className="hint">Go to Settings → Day Schedules to add time slots</p>
              </div>
            ) : (
              uniqueTimeRanges.map((timeRange, rowIndex) => {
                const [start, end] = timeRange.split('-');
                // Show hint only in the middle row
                const middleRowIndex = Math.floor(uniqueTimeRanges.length / 2);
                const isMiddleRow = rowIndex === middleRowIndex;

                return (
                  <div key={timeRange} className="calendar-time-row">
                    <div className="calendar-time-label">
                      <span className="time-main">{formatTimeShort(start)}</span>
                    </div>
                    {ALL_DAYS.map((day) => {
                      const isConfigured = configuredDays.has(day);
                      const slotForDay = timeSlots.find(
                        (ts) =>
                          ts.day_of_week === day && ts.start_time === start && ts.end_time === end
                      );

                      if (!isConfigured) {
                        const unconfiguredId = `unconfigured-${day}-${timeRange}`;
                        return (
                          <UnconfiguredDropZone
                            key={day}
                            day={day}
                            timeSlotId={timeRange}
                            isOver={dragOverCell === unconfiguredId}
                            showHint={isMiddleRow}
                          />
                        );
                      }

                      if (!slotForDay) {
                        return <div key={day} className="calendar-cell empty" />;
                      }

                      const cellAssignments = getAssignmentsForCell(slotForDay.id, location.id);
                      const cellId = `slot-${location.id}-${slotForDay.id}-${day}`;

                      return (
                        <TimeSlotDropZone
                          key={day}
                          timeSlot={slotForDay}
                          locationId={location.id}
                          day={day}
                          isOver={dragOverCell === cellId}
                        >
                          {cellAssignments.length > 0 ? (
                            <div className="calendar-cell-assignments">
                              {cellAssignments.map((assignment) => {
                                const user = usersById.get(assignment.user_id);
                                return (
                                  <ShiftBlock
                                    key={assignment.id}
                                    assignment={assignment}
                                    user={user}
                                    timeSlot={slotForDay}
                                    color={getWorkerColor(assignment.user_id)}
                                    onRemove={() => onRemoveAssignment(assignment.id)}
                                    onClick={() => onAssignmentClick(assignment)}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="calendar-cell-empty">
                              <span>+</span>
                            </div>
                          )}
                        </TimeSlotDropZone>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeWorker && (
          <div
            className="calendar-drag-overlay"
            style={{
              background: getWorkerColor(activeWorker.id).bg,
              borderLeft: `4px solid ${getWorkerColor(activeWorker.id).border}`,
            }}
          >
            <UserAvatar
              name={activeWorker.name}
              userId={activeWorker.id}
              size="sm"
              showBorder={false}
            />
            <span style={{ color: getWorkerColor(activeWorker.id).text, fontWeight: 600 }}>
              {activeWorker.name}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default ShiftScheduleGrid;

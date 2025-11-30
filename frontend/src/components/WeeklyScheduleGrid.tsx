import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Row, Col } from 'react-bootstrap';
import ShiftCard from './ShiftCard';
import UserAvatar from './UserAvatar';
import StatusChip from './StatusChip';
import { Assignment, TimeSlot, Location, User } from '../types/scheduler';
import '../styles/scheduler.css';

interface WeeklyScheduleGridProps {
  assignments: Assignment[];
  users: User[];
  locations: Location[];
  timeSlots: TimeSlot[];
  weekStart: string;
  onAssignmentMove: (
    assignmentId: number,
    target: { userId: number; locationId: number; timeSlotId: number }
  ) => Promise<void>;
  onAssignmentClick: (assignment: Assignment) => void;
}

interface SortableShiftCardProps {
  assignment: Assignment;
  timeSlot?: TimeSlot;
  onClick: () => void;
}

const SortableShiftCard: React.FC<SortableShiftCardProps> = ({ assignment, timeSlot, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `assignment-${assignment.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ShiftCard
        assignment={assignment}
        timeSlot={timeSlot}
        onClick={onClick}
        isDragging={isDragging}
      />
    </div>
  );
};

const WeeklyScheduleGrid: React.FC<WeeklyScheduleGridProps> = ({
  assignments,
  users,
  locations,
  timeSlots,
  weekStart,
  onAssignmentMove,
  onAssignmentClick,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ userId: number; day: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayOfWeek];
  };

  const getFullDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayOfWeek];
  };

  // Get all unique days from time slots
  const days = Array.from(new Set(timeSlots.map((ts) => ts.day_of_week))).sort();

  // Get assignments for a user on a specific day
  const getAssignmentsForUserDay = (userId: number, dayOfWeek: number): Assignment[] => {
    return assignments.filter((a) => {
      if (a.user_id !== userId) return false;
      const timeSlot = timeSlots.find((ts) => ts.id === a.time_slot_id);
      return timeSlot?.day_of_week === dayOfWeek;
    });
  };

  // Check if a day is today
  const isToday = (dayOfWeek: number): boolean => {
    const today = new Date();
    const weekStartDate = new Date(weekStart);
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + dayOfWeek);
    return dayDate.toDateString() === today.toDateString();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setDragOverCell(null);
      return;
    }

    const overId = over.id as string;
    if (overId.startsWith('cell-')) {
      const [, userId, day] = overId.split('-');
      setDragOverCell({
        userId: parseInt(userId),
        day: parseInt(day),
      });
    } else {
      setDragOverCell(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverCell(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    if (!activeIdStr.startsWith('assignment-')) return;

    const assignmentId = parseInt(activeIdStr.replace('assignment-', ''));
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    const overId = over.id as string;
    if (!overId.startsWith('cell-')) return;

    const [, userIdStr, dayStr] = overId.split('-');
    const targetUserId = parseInt(userIdStr);
    const targetDay = parseInt(dayStr);

    // Find a time slot for the target day
    const targetTimeSlot =
      timeSlots.find((ts) => ts.day_of_week === targetDay) ||
      timeSlots.find((ts) => ts.id === assignment.time_slot_id);

    if (!targetTimeSlot) {
      console.error('No time slot found for target day');
      return;
    }

    try {
      await onAssignmentMove(assignmentId, {
        userId: targetUserId,
        locationId: assignment.location_id,
        timeSlotId: targetTimeSlot.id,
      });
    } catch (error) {
      console.error('Failed to move assignment:', error);
    }
  };

  const activeAssignment = activeId
    ? assignments.find((a) => `assignment-${a.id}` === activeId)
    : null;

  const timeSlotsById = new Map(timeSlots.map((ts) => [ts.id, ts]));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="schedule-grid">
        {/* Header row with days */}
        <Row className="g-0">
          <Col xs="auto" className="schedule-grid-row-header" style={{ minWidth: '200px' }}>
            <div
              style={{
                padding: '18px 20px',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'var(--ms-text-primary)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="me-2"
                style={{ opacity: 0.6 }}
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Workers
            </div>
          </Col>
          {days.map((day) => {
            const weekStartDate = new Date(weekStart);
            const dayDate = new Date(weekStartDate);
            dayDate.setDate(weekStartDate.getDate() + day);
            const isTodayCell = isToday(day);

            return (
              <Col key={day} className={`schedule-grid-header ${isTodayCell ? 'today' : ''}`}>
                <div
                  style={{
                    fontWeight: 700,
                    color: isTodayCell ? 'var(--ms-sky-dark)' : 'var(--ms-text-primary)',
                    fontSize: '1rem',
                  }}
                >
                  {getFullDayName(day)}
                </div>
                <div
                  style={{
                    color: isTodayCell ? 'var(--ms-sky-dark)' : 'var(--ms-text-muted)',
                    fontSize: '0.85rem',
                    marginTop: '2px',
                  }}
                >
                  {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {isTodayCell && <StatusChip variant="today" label="Today" size="sm" />}
              </Col>
            );
          })}
        </Row>

        {/* Rows for each user */}
        {users.map((user) => (
          <Row key={user.id} className="g-0">
            {/* User name header with avatar */}
            <Col xs="auto" className="schedule-grid-row-header" style={{ minWidth: '200px' }}>
              <div className="ms-worker-info" style={{ padding: '14px 20px' }}>
                <UserAvatar name={user.name} email={user.email} userId={user.id} size="md" />
                <div className="ms-worker-details">
                  <div className="ms-worker-name">{user.name}</div>
                  <div className="ms-worker-email">{user.email}</div>
                </div>
              </div>
            </Col>

            {/* Cells for each day */}
            {days.map((day) => {
              const dayAssignments = getAssignmentsForUserDay(user.id, day);
              const isDragOver = dragOverCell?.userId === user.id && dragOverCell?.day === day;
              const isTodayCell = isToday(day);

              return (
                <Col key={day}>
                  <div
                    id={`cell-${user.id}-${day}`}
                    className={`schedule-grid-cell ${isDragOver ? 'drag-over' : ''} ${isTodayCell ? 'today-column' : ''}`}
                  >
                    <SortableContext
                      items={dayAssignments.map((a) => `assignment-${a.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {dayAssignments.length > 0 ? (
                        dayAssignments.map((assignment) => {
                          const timeSlot = timeSlotsById.get(assignment.time_slot_id);
                          return (
                            <SortableShiftCard
                              key={assignment.id}
                              assignment={assignment}
                              timeSlot={timeSlot}
                              onClick={() => onAssignmentClick(assignment)}
                            />
                          );
                        })
                      ) : (
                        <div
                          style={{
                            height: '100%',
                            minHeight: '90px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--ms-text-muted)',
                            fontSize: '0.8rem',
                            borderRadius: '10px',
                            border: '2px dashed var(--ms-border)',
                            background: 'var(--ms-surface)',
                          }}
                        >
                          Drop shift here
                        </div>
                      )}
                    </SortableContext>
                  </div>
                </Col>
              );
            })}
          </Row>
        ))}
      </div>

      <DragOverlay>
        {activeAssignment ? (
          <ShiftCard
            assignment={activeAssignment}
            timeSlot={timeSlotsById.get(activeAssignment.time_slot_id)}
            isDragging={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default WeeklyScheduleGrid;

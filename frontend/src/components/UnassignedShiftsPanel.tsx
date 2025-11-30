import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Location, TimeSlot } from '../types/scheduler';
import StatusChip from './StatusChip';
import '../styles/scheduler.css';

// SVG Icons
const Icons = {
  Box: () => (
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
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#059669"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  MapPin: () => (
    <svg
      width="12"
      height="12"
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
  Calendar: () => (
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

interface UnassignedShift {
  locationId: number;
  timeSlotId: number;
  locationName: string;
  timeSlot: TimeSlot;
  requiredWorkers: number;
  currentWorkers: number;
}

interface UnassignedShiftsPanelProps {
  shifts: UnassignedShift[];
  locations: Location[];
  timeSlots: TimeSlot[];
}

interface DraggableShiftItemProps {
  shift: UnassignedShift;
  timeSlot: TimeSlot;
}

// Get location color index (1-6)
const getLocationColorIndex = (locationName: string | undefined): number => {
  if (!locationName) return 1;
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) {
    hash = (hash << 5) - hash + locationName.charCodeAt(i);
  }
  return (Math.abs(hash) % 6) + 1;
};

const DraggableShiftItem: React.FC<DraggableShiftItemProps> = ({ shift, timeSlot }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unassigned-${shift.locationId}-${shift.timeSlotId}`,
    data: {
      type: 'unassigned',
      locationId: shift.locationId,
      timeSlotId: shift.timeSlotId,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'p' : 'a';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayOfWeek];
  };

  // Determine urgency level
  const remaining = shift.requiredWorkers - shift.currentWorkers;
  const locColorIndex = getLocationColorIndex(shift.locationName);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`unassigned-shift-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="d-flex justify-content-between align-items-start mb-2">
        <span
          className={`ms-location-badge loc-${locColorIndex}`}
          style={{
            fontSize: '0.7rem',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Icons.MapPin /> {shift.locationName}
        </span>
        <StatusChip
          variant={remaining >= 3 ? 'conflict' : remaining >= 2 ? 'unassigned' : 'open'}
          label={`${remaining} needed`}
          size="sm"
        />
      </div>
      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--ms-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Icons.Calendar /> {getDayName(timeSlot.day_of_week)} • {formatTime(timeSlot.start_time)} –{' '}
        {formatTime(timeSlot.end_time)}
      </div>
      <div style={{ marginTop: '8px' }}>
        <div className="ms-intensity-bar">
          <div
            className={`ms-intensity-fill ${remaining >= 3 ? 'high' : remaining >= 2 ? 'medium' : 'low'}`}
            style={{
              width: `${Math.min((shift.currentWorkers / shift.requiredWorkers) * 100, 100)}%`,
            }}
          />
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--ms-text-muted)',
            marginTop: '4px',
            display: 'block',
          }}
        >
          {shift.currentWorkers} / {shift.requiredWorkers} assigned
        </span>
      </div>
    </div>
  );
};

const UnassignedShiftsPanel: React.FC<UnassignedShiftsPanelProps> = ({
  shifts,
  locations,
  timeSlots,
}) => {
  const timeSlotsById = new Map(timeSlots.map((ts) => [ts.id, ts]));

  return (
    <div className="ms-unassigned-panel">
      <div className="ms-unassigned-header">
        <h5
          className="ms-unassigned-title"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Icons.Box /> Unassigned Shifts
        </h5>
        <p className="ms-unassigned-subtitle">Drag to schedule workers</p>
      </div>
      <div className="ms-unassigned-body">
        {shifts.length === 0 ? (
          <div className="ms-unassigned-empty">
            <div style={{ marginBottom: '16px', opacity: 0.7 }}>
              <Icons.Check />
            </div>
            <p
              style={{
                fontSize: '0.9rem',
                fontWeight: 500,
                marginBottom: '4px',
                color: 'var(--ms-text-secondary)',
              }}
            >
              All shifts assigned!
            </p>
            <small style={{ fontSize: '0.8rem', color: 'var(--ms-text-muted)' }}>
              New unassigned shifts will appear here based on your requirements.
            </small>
          </div>
        ) : (
          shifts.map((shift, index) => {
            const timeSlot = timeSlotsById.get(shift.timeSlotId);
            if (!timeSlot) return null;

            return (
              <DraggableShiftItem
                key={`${shift.locationId}-${shift.timeSlotId}-${index}`}
                shift={shift}
                timeSlot={timeSlot}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default UnassignedShiftsPanel;

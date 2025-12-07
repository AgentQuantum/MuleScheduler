import React from 'react';
import { Assignment, TimeSlot } from '../types/scheduler';
import StatusChip from './StatusChip';
import UserAvatar from './UserAvatar';

interface ShiftCardProps {
  assignment: Assignment;
  timeSlot?: TimeSlot;
  onClick?: () => void;
  isDragging?: boolean;
  variant?: 'default' | 'warning' | 'danger' | 'info';
  showAvatar?: boolean;
}

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'p' : 'a';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}${ampm}`;
};

const formatTimeRange = (timeSlot?: TimeSlot): string => {
  if (!timeSlot) return '';
  const start = formatTime(timeSlot.start_time);
  const end = formatTime(timeSlot.end_time);
  return `${start}–${end}`;
};

// Get initials from a name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Get location color index (1-6)
const getLocationColorIndex = (locationName: string | undefined): number => {
  if (!locationName) return 1;
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) {
    hash = (hash << 5) - hash + locationName.charCodeAt(i);
  }
  return (Math.abs(hash) % 6) + 1;
};

const ShiftCard: React.FC<ShiftCardProps> = ({
  assignment,
  timeSlot,
  onClick,
  isDragging = false,
  variant: _variant = 'default',
  showAvatar = false,
}) => {
  const timeRange = formatTimeRange(timeSlot || assignment.time_slot);
  const workerName = assignment.user_name || 'Unassigned';
  const locationName = assignment.location_name || 'Unknown';
  const locColorIndex = getLocationColorIndex(locationName);

  return (
    <div
      className={`shift-card loc-${locColorIndex} ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Shift: ${workerName} at ${locationName}, ${timeRange}`}
    >
      <div className="shift-card-header">
        <span className="shift-card-time">{timeRange}</span>
        <span className="shift-card-drag-handle" aria-label="Drag to move">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            style={{ opacity: 0.5 }}
          >
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
          </svg>
        </span>
      </div>
      <div className="shift-card-location">
        <svg
          width="10"
          height="10"
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
        {locationName}
      </div>
      <div className="shift-card-worker">
        {assignment.user_name ? (
          <div className="d-flex align-items-center gap-1">
            {showAvatar && <UserAvatar name={workerName} size="sm" showBorder={false} />}
            <span style={{ opacity: 0.8 }}>{getInitials(workerName)}</span>
            {workerName.split(' ')[0]}
          </div>
        ) : (
          <StatusChip variant="unassigned" label="Unassigned" size="sm" />
        )}
      </div>
    </div>
  );
};

export default ShiftCard;

import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { Assignment, User, Location, TimeSlot } from '../types/scheduler';
import UserAvatar from './UserAvatar';
import StatusChip from './StatusChip';
import '../styles/scheduler.css';

// SVG Icons
const Icons = {
  Calendar: ({ size = 20 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
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
  Clock: ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Clipboard: ({ size = 20 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  User: ({ size = 20 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  MapPin: ({ size = 12 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
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
  Trash: ({ size = 16 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: ({ size = 16 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

interface ShiftDetailsDrawerProps {
  assignment: Assignment | null;
  users: User[];
  locations: Location[];
  timeSlot?: TimeSlot;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    assignmentId: number,
    updates: { userId?: number; locationId?: number; timeSlotId?: number }
  ) => Promise<void>;
  onDelete: (assignmentId: number) => Promise<void>;
}

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const getDayName = (dayOfWeek: number): string => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek];
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

const ShiftDetailsDrawer: React.FC<ShiftDetailsDrawerProps> = ({
  assignment,
  users,
  locations,
  timeSlot,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();
  const [selectedLocationId, setSelectedLocationId] = useState<number | undefined>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (assignment) {
      setSelectedUserId(assignment.user_id);
      setSelectedLocationId(assignment.location_id);
    }
  }, [assignment]);

  const handleUpdate = async () => {
    if (!assignment) return;

    setIsUpdating(true);
    try {
      const updates: { userId?: number; locationId?: number } = {};
      if (selectedUserId !== assignment.user_id) {
        updates.userId = selectedUserId;
      }
      if (selectedLocationId !== assignment.location_id) {
        updates.locationId = selectedLocationId;
      }

      if (Object.keys(updates).length > 0) {
        await onUpdate(assignment.id, updates);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) return;

    if (
      window.confirm(
        'Are you sure you want to delete this shift assignment? This action cannot be undone.'
      )
    ) {
      setIsDeleting(true);
      try {
        await onDelete(assignment.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const hasChanges =
    assignment &&
    (selectedUserId !== assignment.user_id || selectedLocationId !== assignment.location_id);

  const locColorIndex = assignment ? getLocationColorIndex(assignment.location_name) : 1;

  return (
    <>
      {/* Backdrop */}
      <div className={`ms-drawer-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`ms-drawer ${isOpen ? 'open' : ''}`}>
        <div className="ms-drawer-header">
          <h5
            className="ms-drawer-title"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icons.Calendar /> Shift Details
          </h5>
          <button className="ms-drawer-close" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="ms-drawer-body">
          {assignment ? (
            <>
              {/* Time & Day Info Card */}
              <div
                className="ms-card mb-4"
                style={{
                  background: `var(--ms-loc-${locColorIndex}-bg)`,
                  borderLeft: `4px solid var(--ms-loc-${locColorIndex})`,
                }}
              >
                <div className="ms-card-body" style={{ padding: '20px' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: `var(--ms-loc-${locColorIndex})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <Icons.Clock size={26} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: 'var(--ms-text-primary)',
                          fontSize: '1.1rem',
                        }}
                      >
                        {timeSlot
                          ? `${formatTime(timeSlot.start_time)} – ${formatTime(timeSlot.end_time)}`
                          : 'N/A'}
                      </div>
                      <div
                        style={{
                          color: 'var(--ms-text-secondary)',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Icons.Calendar size={14} />{' '}
                        {timeSlot ? getDayName(timeSlot.day_of_week) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Assignment Status */}
              <div
                className="mb-4 p-4"
                style={{ background: 'var(--ms-surface)', borderRadius: '14px' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6
                    className="ms-label mb-0"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Icons.Clipboard size={16} /> Current Assignment
                  </h6>
                  {assignment.user_name ? (
                    <StatusChip variant="assigned" label="Assigned" />
                  ) : (
                    <StatusChip variant="unassigned" label="Unassigned" />
                  )}
                </div>
                <div className="d-flex align-items-center gap-3">
                  {assignment.user_name ? (
                    <>
                      <UserAvatar name={assignment.user_name} size="lg" />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '1rem',
                            color: 'var(--ms-text-primary)',
                          }}
                        >
                          {assignment.user_name}
                        </div>
                        <span
                          className={`ms-location-badge loc-${locColorIndex}`}
                          style={{
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Icons.MapPin /> {assignment.location_name}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'var(--ms-yellow-light)',
                          border: '2px dashed var(--ms-yellow)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--ms-yellow-dark)',
                        }}
                      >
                        <Icons.User />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--ms-text-muted)' }}>
                          No worker assigned
                        </div>
                        <span
                          className={`ms-location-badge loc-${locColorIndex}`}
                          style={{
                            marginTop: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Icons.MapPin /> {assignment.location_name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Selection */}
              <Form.Group className="mb-4">
                <Form.Label
                  className="ms-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.User size={16} /> Assign Worker
                </Form.Label>
                <Form.Select
                  value={selectedUserId || ''}
                  onChange={(e) =>
                    setSelectedUserId(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  style={{ padding: '12px 16px' }}
                >
                  <option value="">-- Unassigned --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Location Selection */}
              <Form.Group className="mb-4">
                <Form.Label
                  className="ms-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.MapPin size={16} /> Location
                </Form.Label>
                <Form.Select
                  value={selectedLocationId || ''}
                  onChange={(e) =>
                    setSelectedLocationId(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  style={{ padding: '12px 16px' }}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          ) : (
            <div className="ms-empty-state">
              <div className="ms-empty-icon" style={{ opacity: 0.5 }}>
                <Icons.Clipboard size={48} />
              </div>
              <p className="ms-empty-title">No Shift Selected</p>
              <p className="ms-empty-description">
                Click on a shift card to view and edit its details.
              </p>
            </div>
          )}
        </div>

        {assignment && (
          <div className="ms-drawer-footer">
            <Button
              className="ms-btn ms-btn-danger"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ marginRight: 'auto' }}
            >
              {isDeleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Deleting...
                </>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Trash /> Delete
                </span>
              )}
            </Button>
            <Button className="ms-btn ms-btn-secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="ms-btn ms-btn-accent"
              onClick={handleUpdate}
              disabled={!hasChanges || isUpdating}
            >
              {isUpdating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Saving...
                </>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Check /> Save Changes
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ShiftDetailsDrawer;

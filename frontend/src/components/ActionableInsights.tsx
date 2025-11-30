import React, { useState } from 'react';
import { Assignment, TimeSlot, User } from '../types/scheduler';

interface ActionableInsightsProps {
  assignments: Assignment[];
  users: User[];
  timeSlots: TimeSlot[];
  maxCapacity: number;
}

// Icons
const Icons = {
  ChevronDown: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronUp: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Info: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  CheckCircle: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Users: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="16"
      height="16"
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
  Zap: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  HelpCircle: () => (
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Play: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

// Tooltip component for help icons
const HelpTooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="help-tooltip" title={text}>
    <Icons.HelpCircle />
  </span>
);

interface InsightItem {
  id: string;
  type: 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  description: string;
  count?: number;
}

const ActionableInsights: React.FC<ActionableInsightsProps> = ({
  assignments,
  users,
  timeSlots,
  maxCapacity,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate insights
  // Convert to strings to handle potential type mismatches between number/string IDs
  const workersWithShifts = new Set(
    assignments.filter((a) => a.user_id != null).map((a) => String(a.user_id))
  );
  const idleWorkers = users.filter((u) => !workersWithShifts.has(String(u.id)));

  // Slots under capacity
  const slotAssignmentCounts = new Map<number, number>();
  assignments.forEach((a) => {
    slotAssignmentCounts.set(a.time_slot_id, (slotAssignmentCounts.get(a.time_slot_id) || 0) + 1);
  });
  const underCapacitySlots = timeSlots.filter((ts) => {
    const count = slotAssignmentCounts.get(ts.id) || 0;
    return count > 0 && count < maxCapacity;
  });

  // Empty slots (no assignments at all)
  const emptySlots = timeSlots.filter((ts) => !slotAssignmentCounts.has(ts.id));

  // Build insight items
  const insights: InsightItem[] = [];

  if (idleWorkers.length > 0) {
    insights.push({
      id: 'idle-workers',
      type: 'warning',
      icon: <Icons.Users />,
      title: `${idleWorkers.length} idle worker${idleWorkers.length > 1 ? 's' : ''}`,
      description:
        idleWorkers.map((w) => w.name.split(' ')[0]).join(', ') +
        ' ha' +
        (idleWorkers.length > 1 ? 've' : 's') +
        ' no shifts',
      count: idleWorkers.length,
    });
  }

  if (underCapacitySlots.length > 0) {
    insights.push({
      id: 'under-capacity',
      type: 'info',
      icon: <Icons.Clock />,
      title: `${underCapacitySlots.length} slot${underCapacitySlots.length > 1 ? 's' : ''} under capacity`,
      description: `Can add more workers (max ${maxCapacity} per slot)`,
      count: underCapacitySlots.length,
    });
  }

  if (emptySlots.length > 0) {
    insights.push({
      id: 'empty-slots',
      type: 'warning',
      icon: <Icons.AlertTriangle />,
      title: `${emptySlots.length} uncovered slot${emptySlots.length > 1 ? 's' : ''}`,
      description: 'Time slots with no workers assigned',
      count: emptySlots.length,
    });
  }

  // Success state
  if (insights.length === 0 && assignments.length > 0) {
    insights.push({
      id: 'all-good',
      type: 'success',
      icon: <Icons.CheckCircle />,
      title: 'Schedule looks good!',
      description: 'No issues detected',
    });
  }

  const actionableCount = insights.filter((i) => i.type === 'warning' || i.type === 'info').length;

  return (
    <div className={`actionable-insights ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header - Always visible */}
      <div className="insights-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="insights-title">
          <Icons.Zap />
          <span>Actionable Items</span>
          <HelpTooltip text="Shows scheduling issues that need attention: idle workers, understaffed slots, and capacity warnings" />
          {actionableCount > 0 && <span className="insights-badge warning">{actionableCount}</span>}
        </div>
        <button className="insights-toggle">
          {isExpanded ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
        </button>
      </div>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="insights-content">
          {insights.length === 0 ? (
            <div className="insights-empty">
              <Icons.Info />
              <p>No schedule data yet</p>
            </div>
          ) : (
            <div className="insights-list">
              {insights.map((insight) => (
                <div key={insight.id} className={`insight-item ${insight.type}`}>
                  <div className="insight-icon">{insight.icon}</div>
                  <div className="insight-text">
                    <div className="insight-title">{insight.title}</div>
                    <div className="insight-desc">{insight.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionableInsights;

/*
 * ACTIONABLE ITEMS TYPES:
 *
 * ⚠️ WARNINGS (Need attention):
 *    - Idle Workers: Workers with 0 shifts this week
 *    - Uncovered Slots: Time slots with no assignments
 *    - Near Max Hours: Workers approaching weekly hour limit
 *    - Availability Conflicts: Scheduled outside availability
 *
 * ℹ️ INFO (Optimization opportunities):
 *    - Under Capacity: Slots that can take more workers
 *    - Uneven Distribution: Some workers have many more shifts
 *
 * ✅ SUCCESS:
 *    - All clear when no issues detected
 */

import { Card } from 'react-bootstrap';

interface ScheduleBlockProps {
  timeSlot: string;
  location: string;
  assigned?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

/**
 * ScheduleBlock Component
 *
 * A reusable component that displays a schedule slot in the green block style
 * matching the MuleScheduler theme. Used throughout the app for displaying
 * time slots, availability, and assignments.
 *
 * @example
 * <ScheduleBlock
 *   timeSlot="9a - 5p"
 *   location="FRONT OF HOUSE"
 *   assigned="John Doe"
 *   onClick={() => handleClick()}
 * />
 */
function ScheduleBlock({
  timeSlot,
  location,
  assigned,
  onClick,
  active = false,
  className = '',
}: ScheduleBlockProps) {
  return (
    <Card
      className={`schedule-block ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="schedule-block-time">{timeSlot}</div>
      <div className="schedule-block-location">{location}</div>
      {assigned && <div className="schedule-block-assigned">{assigned}</div>}
    </Card>
  );
}

export default ScheduleBlock;

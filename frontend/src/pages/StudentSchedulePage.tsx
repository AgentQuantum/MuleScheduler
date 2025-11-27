import { useState, useEffect } from 'react'
import { Alert, Row, Col } from 'react-bootstrap'
import api from '../services/api'
import { Assignment, TimeSlot } from '../types/scheduler'
import StatusChip from '../components/StatusChip'
import IconButton from '../components/IconButton'
import { ScheduleIllustration } from '../components/Illustrations'
import '../styles/scheduler.css'

// SVG Icons
const Icons = {
  Calendar: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Moon: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function StudentSchedulePage() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    return monday.toISOString().split('T')[0]
  })

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [weekStart])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [assignmentsRes, timeSlotsRes] = await Promise.all([
        api.get(`/assignments?week_start=${weekStart}`),
        api.get('/time-slots')
      ])
      setAssignments(assignmentsRes.data)
      setTimeSlots(timeSlotsRes.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleWeekChange = (direction: 'prev' | 'next' | 'today') => {
    const current = new Date(weekStart)
    if (direction === 'prev') {
      current.setDate(current.getDate() - 7)
    } else if (direction === 'next') {
      current.setDate(current.getDate() + 7)
    } else {
      const today = new Date()
      current.setTime(today.getTime())
      current.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    }
    setWeekStart(current.toISOString().split('T')[0])
  }

  const formatWeekRange = (startDate: string): string => {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatTimeRange = (startTime: string, endTime: string): string => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startHour12 = startHours % 12 || 12
    const endHour12 = endHours % 12 || 12
    const startAMPM = startHours >= 12 ? 'PM' : 'AM'
    const endAMPM = endHours >= 12 ? 'PM' : 'AM'
    
    const startMinStr = startMinutes.toString().padStart(2, '0')
    const endMinStr = endMinutes.toString().padStart(2, '0')
    
    // If both times have the same AM/PM, only show it once at the end
    if (startAMPM === endAMPM) {
      return `${startHour12}:${startMinStr} - ${endHour12}:${endMinStr} ${endAMPM}`
    } else {
      // Different AM/PM, show both
      return `${startHour12}:${startMinStr} ${startAMPM} - ${endHour12}:${endMinStr} ${endAMPM}`
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getDayName = (dayOfWeek: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[dayOfWeek]
  }

  const getShortDayName = (dayOfWeek: number): string => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days[dayOfWeek]
  }

  // Check if a day is today
  const isToday = (dayOfWeek: number): boolean => {
    const today = new Date()
    const weekStartDate = new Date(weekStart)
    const dayDate = new Date(weekStartDate)
    dayDate.setDate(weekStartDate.getDate() + dayOfWeek)
    return dayDate.toDateString() === today.toDateString()
  }

  // Get day date
  const getDayDate = (dayOfWeek: number): string => {
    const weekStartDate = new Date(weekStart)
    const dayDate = new Date(weekStartDate)
    dayDate.setDate(weekStartDate.getDate() + dayOfWeek)
    return dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Check if shift is past, today, or upcoming
  const getShiftStatus = (assignment: Assignment): 'past' | 'today' | 'upcoming' => {
    const ts = timeSlots.find(t => t.id === assignment.time_slot_id)
    if (!ts) return 'upcoming'
    
    const weekStartDate = new Date(weekStart)
    const shiftDate = new Date(weekStartDate)
    shiftDate.setDate(weekStartDate.getDate() + ts.day_of_week)
    
    // Get today's date (midnight)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get shift day (midnight)
    const shiftDay = new Date(shiftDate)
    shiftDay.setHours(0, 0, 0, 0)
    
    // Compare dates first
    const dayDiff = shiftDay.getTime() - today.getTime()
    
    if (dayDiff < 0) {
      // Shift is in the past
      return 'past'
    } else if (dayDiff === 0) {
      // Shift is today - check if end time has passed
      const [hours, minutes] = ts.end_time.split(':').map(Number)
      const shiftEndTime = new Date(shiftDate)
      shiftEndTime.setHours(hours, minutes, 0, 0)
      
      if (shiftEndTime < new Date()) {
        return 'past'
      } else {
        return 'today'
      }
    } else {
      // Shift is in the future
      return 'upcoming'
    }
  }

  // Group time slots by day
  const days = Array.from(new Set(timeSlots.map(ts => ts.day_of_week))).sort()
  
  // Get assignments for a specific day
  const getAssignmentsForDay = (dayOfWeek: number): Assignment[] => {
    return assignments.filter(a => {
      const ts = timeSlots.find(ts => ts.id === a.time_slot_id)
      return ts?.day_of_week === dayOfWeek
    })
  }

  // Calculate total hours for the week
  const totalHours = assignments.reduce((total, a) => {
    const ts = timeSlots.find(ts => ts.id === a.time_slot_id)
    if (ts) {
      const [startH, startM] = ts.start_time.split(':').map(Number)
      const [endH, endM] = ts.end_time.split(':').map(Number)
      const hours = (endH + endM / 60) - (startH + startM / 60)
      return total + hours
    }
    return total
  }, 0)

  // Get location color index
  const getLocationColorIndex = (locationName: string): number => {
    let hash = 0
    for (let i = 0; i < locationName.length; i++) {
      hash = ((hash << 5) - hash) + locationName.charCodeAt(i)
    }
    return (Math.abs(hash) % 6) + 1
  }

  if (loading) {
    return (
      <div className="ms-loading" style={{ minHeight: '60vh' }}>
            <div className="ms-spinner"></div>
            <p className="ms-loading-text">Loading your schedule...</p>
      </div>
    )
  }

  return (
    <div className="ms-animate-in">
      {/* Stats Row - Color-coded cards */}
      <Row className="g-4 mb-4">
        <Col xs={6} lg={3}>
          <div className="ms-stat-card sky">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{assignments.length}</div>
              <div className="ms-stat-label">Shifts This Week</div>
              <div className="ms-stat-sublabel">Scheduled</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card mint">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{totalHours.toFixed(1)}</div>
              <div className="ms-stat-label">Total Hours</div>
              <div className="ms-stat-sublabel">This week</div>
                </div>
                </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card lavender">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{new Set(assignments.map(a => a.location_name)).size}</div>
              <div className="ms-stat-label">Locations</div>
              <div className="ms-stat-sublabel">Assigned to</div>
                </div>
                </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card coral">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{days.filter(d => getAssignmentsForDay(d).length > 0).length}</div>
              <div className="ms-stat-label">Work Days</div>
              <div className="ms-stat-sublabel">Active days</div>
            </div>
          </div>
        </Col>
      </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
            {error}
          </Alert>
        )}

        {/* Toolbar */}
        <div className="ms-toolbar mb-4">
          <div className="ms-week-picker">
          <IconButton
            icon="chevronLeft"
              onClick={() => handleWeekChange('prev')}
            title="Previous week"
            size="sm"
          />
            <div className="ms-week-picker-label">
              {formatWeekRange(weekStart)}
            </div>
          <IconButton
            icon="chevronRight"
              onClick={() => handleWeekChange('next')}
            title="Next week"
            size="sm"
          />
            <button
              className="ms-week-picker-today"
              onClick={() => handleWeekChange('today')}
            >
              Today
            </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="ms-card">
          <div className="ms-card-body" style={{ padding: 0 }}>
            {days.length === 0 ? (
              <div className="ms-empty-state" style={{ margin: '40px' }}>
              <div className="ms-empty-illustration">
                <ScheduleIllustration width={220} height={180} />
              </div>
                <h4 className="ms-empty-title">No Schedule Data</h4>
                <p className="ms-empty-description">
                  Time slots haven't been configured yet. Contact an administrator to set up the schedule.
                </p>
              </div>
            ) : (
              <Row className="g-0">
                {[0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => {
                  const dayAssignments = getAssignmentsForDay(dayOfWeek)
                  const isTodayCell = isToday(dayOfWeek)
                  
                  return (
                    <Col key={dayOfWeek} style={{ borderRight: dayOfWeek < 6 ? '1px solid var(--ms-border)' : 'none' }}>
                      {/* Day Header */}
                      <div 
                      className={`schedule-grid-header ${isTodayCell ? 'today' : ''}`}
                      style={{ padding: '16px' }}
                      >
                        <div style={{ 
                        fontWeight: 700, 
                        color: isTodayCell ? 'var(--ms-sky-dark)' : 'var(--ms-text-primary)',
                        fontSize: '1rem'
                        }}>
                          {getShortDayName(dayOfWeek)}
                        </div>
                        <div style={{ 
                        fontSize: '0.85rem', 
                        color: isTodayCell ? 'var(--ms-sky-dark)' : 'var(--ms-text-muted)'
                        }}>
                          {getDayDate(dayOfWeek)}
                      </div>
                          {isTodayCell && (
                        <StatusChip variant="today" label="Today" size="sm" />
                          )}
                      </div>
                      
                      {/* Day Content */}
                      <div 
                        style={{ 
                        minHeight: '400px', 
                        padding: '20px 18px',
                        background: isTodayCell ? 'rgba(125, 211, 252, 0.05)' : undefined
                        }}
                      >
                        {dayAssignments.length === 0 ? (
                          <div 
                            style={{ 
                              height: '100%',
                            minHeight: '140px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '8px',
                              color: 'var(--ms-text-muted)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            padding: '24px'
                            }}
                          >
                          <Icons.Moon />
                          <span>No shifts</span>
                          </div>
                        ) : (
                        <div className="d-flex flex-column" style={{ gap: '16px' }}>
                            {dayAssignments.map(assignment => {
                              const ts = timeSlots.find(t => t.id === assignment.time_slot_id)
                            const locColorIndex = getLocationColorIndex(assignment.location_name || '')
                              const shiftStatus = getShiftStatus(assignment)
                              const isPast = shiftStatus === 'past'
                              
                              return (
                                <div 
                                  key={assignment.id}
                                className={`shift-card loc-${locColorIndex}`}
                                  style={{ 
                                    cursor: 'default',
                                    opacity: isPast ? 0.6 : 1
                                  }}
                                >
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <span className="shift-card-time">
                                      {ts ? formatTimeRange(ts.start_time, ts.end_time) : 'N/A'}
                                    </span>
                                    <div>
                                      {shiftStatus === 'upcoming' && (
                                  <StatusChip variant="upcoming" label="Upcoming" size="sm" />
                                      )}
                                      {shiftStatus === 'today' && (
                                        <StatusChip variant="today" label="Today" size="sm" />
                                      )}
                                      {shiftStatus === 'past' && (
                                        <StatusChip variant="completed" label="Completed" size="sm" />
                                      )}
                                  </div>
                                  <div className="shift-card-location">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {assignment.location_name}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </Col>
                  )
                })}
              </Row>
            )}
          </div>
        </div>
    </div>
  )
}

export default StudentSchedulePage

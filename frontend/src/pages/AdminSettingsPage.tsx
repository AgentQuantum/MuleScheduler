import { useState, useEffect } from 'react'
import { Form, Button, Modal, Row, Col } from 'react-bootstrap'
import api from '../services/api'
import { useToast } from '../components/Toast'
import '../styles/scheduler.css'

interface Location {
  id: number
  name: string
  description: string | null
  is_active: boolean
}

interface TimeSlot {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
}

interface DaySchedule {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean
  slot_count?: number
  day_name?: string
}

interface Settings {
  max_workers_per_shift: number
  max_hours_per_user_per_week: number | null
}

// SVG Icons
const Icons = {
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Sliders: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/>
      <line x1="4" y1="10" x2="4" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12" y2="3"/>
      <line x1="20" y1="21" x2="20" y2="16"/>
      <line x1="20" y1="12" x2="20" y2="3"/>
      <line x1="1" y1="14" x2="7" y2="14"/>
      <line x1="9" y1="8" x2="15" y2="8"/>
      <line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  )
}

// Simple tooltip - just uses native title attribute for clean hover
const Tip: React.FC<{ text: string, children?: React.ReactNode }> = ({ text, children }) => (
  <span title={text} style={{ cursor: 'help' }}>
    {children || (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginLeft: '4px', verticalAlign: 'middle' }}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )}
  </span>
)

function AdminSettingsPage() {
  const { showToast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [settings, setSettings] = useState<Settings>({ max_workers_per_shift: 3, max_hours_per_user_per_week: null })
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    return monday.toISOString().split('T')[0]
  })
  const [weekSchedules, setWeekSchedules] = useState<DaySchedule[]>([])
  
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false)
  const [showDayScheduleModal, setShowDayScheduleModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null)
  const [editingDaySchedule, setEditingDaySchedule] = useState<DaySchedule | null>(null)
  
  const [locationForm, setLocationForm] = useState({ name: '', description: '' })
  const [timeSlotForm, setTimeSlotForm] = useState({ day_of_week: 0, start_time: '08:00', end_time: '17:00' })
  const [dayScheduleForm, setDayScheduleForm] = useState({ 
    day_of_week: 0, 
    start_time: '08:00', 
    end_time: '17:00',
    slot_duration_minutes: 30
  })
  
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingDaySchedule, setSavingDaySchedule] = useState(false)

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadWeekSchedules()
  }, [weekStart])

  const loadData = async () => {
    try {
      const [locationsRes, timeSlotsRes, settingsRes] = await Promise.all([
        api.get('/locations'),
        api.get('/time-slots'),
        api.get('/settings')
      ])
      setLocations(locationsRes.data)
      setTimeSlots(timeSlotsRes.data)
      setSettings(settingsRes.data)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadWeekSchedules = async () => {
    try {
      const res = await api.get(`/weekly-overrides?week_start=${weekStart}`)
      setWeekSchedules(res.data)
    } catch (err) {
      console.error('Failed to load week schedules:', err)
      setWeekSchedules([])
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
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const handleCopyFromPreviousWeek = async () => {
    try {
      // Get previous week's start date
      const prevWeek = new Date(weekStart)
      prevWeek.setDate(prevWeek.getDate() - 7)
      const prevWeekStart = prevWeek.toISOString().split('T')[0]
      
      // Get previous week's schedules
      const prevSchedules = await api.get(`/weekly-overrides?week_start=${prevWeekStart}`)
      
      if (prevSchedules.data.length === 0) {
        showToast('danger', 'Previous week has no configured days to copy.')
        return
      }
      
      // Copy each day from previous week
      for (const schedule of prevSchedules.data) {
        await api.post('/weekly-overrides', {
          week_start_date: weekStart,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          slot_duration_minutes: schedule.slot_duration_minutes,
          is_active: schedule.is_active
        })
      }
      
      showToast('success', `Copied ${prevSchedules.data.length} days from previous week!`)
      await loadWeekSchedules()
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to copy from previous week')
    }
  }

  const handleClearWeek = async () => {
    if (!window.confirm('Remove all day configurations for this week?')) {
      return
    }
    try {
      await api.delete(`/weekly-overrides/delete-week?week_start=${weekStart}`)
      await loadWeekSchedules()
      showToast('success', 'Week cleared')
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to clear week')
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await api.put('/settings', settings)
      showToast('success', 'Settings saved!')
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveLocation = async () => {
    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, locationForm)
      } else {
        await api.post('/locations', locationForm)
      }
      setShowLocationModal(false)
      setEditingLocation(null)
      setLocationForm({ name: '', description: '' })
      loadData()
      showToast('success', 'Location saved!')
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to save location')
    }
  }

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this location? This will affect all related shifts and requirements.')) {
      try {
        await api.delete(`/locations/${id}`)
        loadData()
        showToast('success', 'Location deleted!')
      } catch (err: any) {
        showToast('danger', err.response?.data?.error || 'Failed to delete location')
      }
    }
  }

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location)
    setLocationForm({ name: location.name, description: location.description || '' })
    setShowLocationModal(true)
  }

  const handleSaveTimeSlot = async () => {
    try {
      if (editingTimeSlot) {
        await api.put(`/time-slots/${editingTimeSlot.id}`, timeSlotForm)
      } else {
        await api.post('/time-slots', timeSlotForm)
      }
      setShowTimeSlotModal(false)
      setEditingTimeSlot(null)
      setTimeSlotForm({ day_of_week: 0, start_time: '08:00', end_time: '17:00' })
      loadData()
      showToast('success', 'Time slot saved!')
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to save time slot')
    }
  }

  // Day Schedule handlers - always saves to this specific week
  const handleSaveDaySchedule = async () => {
    setSavingDaySchedule(true)
    try {
      if (editingDaySchedule) {
        await api.put(`/weekly-overrides/${editingDaySchedule.id}`, {
          ...dayScheduleForm,
          week_start_date: weekStart
        })
      } else {
        await api.post('/weekly-overrides', {
          ...dayScheduleForm,
          week_start_date: weekStart
        })
      }
      await loadWeekSchedules()
      showToast('success', `${DAY_NAMES[dayScheduleForm.day_of_week]} saved for ${formatWeekRange(weekStart)}`)
      setShowDayScheduleModal(false)
      setEditingDaySchedule(null)
      setDayScheduleForm({ day_of_week: 0, start_time: '08:00', end_time: '17:00', slot_duration_minutes: 30 })
    } catch (err: any) {
      showToast('danger', err.response?.data?.error || 'Failed to save day schedule')
    } finally {
      setSavingDaySchedule(false)
    }
  }

  const handleDeleteDaySchedule = async (id: number, dayName: string) => {
    if (window.confirm(`Remove ${dayName} from this week?`)) {
      try {
        await api.delete(`/weekly-overrides/${id}`)
        await loadWeekSchedules()
        showToast('success', `${dayName} removed`)
      } catch (err: any) {
        showToast('danger', err.response?.data?.error || 'Failed to remove')
      }
    }
  }

  const handleEditDaySchedule = (schedule: DaySchedule) => {
    setEditingDaySchedule(schedule)
    setDayScheduleForm({
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      slot_duration_minutes: schedule.slot_duration_minutes
    })
    setShowDayScheduleModal(true)
  }

  const handleAddDaySchedule = (dayOfWeek: number) => {
    setEditingDaySchedule(null)
    setDayScheduleForm({
      day_of_week: dayOfWeek,
      start_time: '08:00',
      end_time: '17:00',
      slot_duration_minutes: 30
    })
    setShowDayScheduleModal(true)
  }

  // Get configured days for this week
  const configuredDays = new Set(weekSchedules.map(s => s.day_of_week))
  
  // Calculate preview slot count
  const calculateSlotCount = (startTime: string, endTime: string, durationMinutes: number): number => {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    return Math.floor((endMinutes - startMinutes) / durationMinutes)
  }

  const _handleDeleteTimeSlot = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this time slot? This will affect all related shifts and requirements.')) {
      try {
        await api.delete(`/time-slots/${id}`)
        loadData()
        showToast('success', 'Time slot deleted!')
      } catch (err: any) {
        showToast('danger', err.response?.data?.error || 'Failed to delete time slot')
      }
    }
  }

  const _handleEditTimeSlot = (slot: TimeSlot) => {
    setEditingTimeSlot(slot)
    setTimeSlotForm({
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.substring(0, 5),
      end_time: slot.end_time.substring(0, 5)
    })
    setShowTimeSlotModal(true)
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[dayOfWeek]
  }

  const _formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Group time slots by day
  const timeSlotsByDay = new Map<number, TimeSlot[]>()
  timeSlots.forEach(ts => {
    if (!timeSlotsByDay.has(ts.day_of_week)) {
      timeSlotsByDay.set(ts.day_of_week, [])
    }
    timeSlotsByDay.get(ts.day_of_week)!.push(ts)
  })

  return (
    <div className="ms-animate-in">
      {/* Stats Row - Color-coded cards */}
      <Row className="g-4 mb-4">
        <Col xs={6} lg={3}>
          <div className="ms-stat-card mint">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{locations.length}</div>
              <div className="ms-stat-label">Locations</div>
              <div className="ms-stat-sublabel">Work areas</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card sky">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{timeSlots.length}</div>
              <div className="ms-stat-label">Time Slots</div>
              <div className="ms-stat-sublabel">Defined periods</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card lavender">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{settings.max_workers_per_shift}</div>
              <div className="ms-stat-label">Max per Shift</div>
              <div className="ms-stat-sublabel">Workers limit</div>
            </div>
          </div>
        </Col>
        <Col xs={6} lg={3}>
          <div className="ms-stat-card yellow">
            <div className="ms-stat-header">
              <div className="ms-stat-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div className="ms-stat-content">
              <div className="ms-stat-value">{settings.max_hours_per_user_per_week || '∞'}</div>
              <div className="ms-stat-label">Max Hours/Week</div>
              <div className="ms-stat-sublabel">Per worker</div>
            </div>
          </div>
        </Col>
      </Row>

        <Row className="g-4">
          {/* Scheduling Settings Card */}
          <Col lg={3}>
            <div className="ms-card h-100">
              <div className="ms-card-header">
                <h5 className="ms-section-title mb-0" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Icons.Sliders />
                  Scheduling
                </h5>
              </div>
              <div className="ms-card-body" style={{ padding: '16px' }}>
                {/* Workers per Shift */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--ms-text-secondary)' }}>
                      Workers/Shift
                    </span>
                    <div style={{ 
                      padding: '4px 12px',
                      borderRadius: '8px',
                      background: 'var(--ms-lavender-light)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--ms-lavender-dark)'
                    }}>
                      {settings.max_workers_per_shift}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                      value={settings.max_workers_per_shift}
                      onChange={(e) => setSettings({ ...settings, max_workers_per_shift: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: `linear-gradient(to right, var(--ms-lavender) 0%, var(--ms-lavender) ${(settings.max_workers_per_shift - 1) * 11.1}%, var(--ms-border) ${(settings.max_workers_per_shift - 1) * 11.1}%, var(--ms-border) 100%)`,
                      appearance: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--ms-text-muted)', marginTop: '2px' }}>
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
                
                {/* Max Hours Section */}
                <div style={{ 
                  padding: '10px 12px',
                  background: 'var(--ms-surface)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ms-text-secondary)' }}>
                    Hours/week
                  </span>
                    <Form.Control
                      type="number"
                      value={settings.max_hours_per_user_per_week || ''}
                      onChange={(e) => setSettings({ ...settings, max_hours_per_user_per_week: e.target.value ? parseInt(e.target.value) : null })}
                      min={1}
                    max={40}
                    placeholder="∞"
                    style={{ width: '50px', fontWeight: 600, fontSize: '0.8rem', padding: '4px', textAlign: 'center' }}
                  />
                </div>
                
                {/* Save Button */}
                  <Button 
                  className="ms-btn ms-btn-accent w-100 mt-3"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                  style={{ padding: '8px', fontSize: '0.8rem' }}
                  >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                  </Button>
              </div>
            </div>
          </Col>

          {/* Locations Card */}
          <Col lg={3}>
            <div className="ms-card h-100">
              <div className="ms-card-header d-flex justify-content-between align-items-center">
                <h5 className="ms-section-title mb-0" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Icons.MapPin />
                  Locations
                </h5>
                <Button 
                  className="ms-btn ms-btn-primary ms-btn-sm"
                  onClick={() => { setEditingLocation(null); setLocationForm({ name: '', description: '' }); setShowLocationModal(true) }}
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  + Add
                </Button>
              </div>
              <div className="ms-card-body" style={{ padding: locations.length === 0 ? '24px' : 0, overflow: 'visible' }}>
                {locations.length === 0 ? (
                <div className="text-center py-4">
                  <div style={{ marginBottom: '12px', opacity: 0.3 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <p className="mb-1" style={{ color: 'var(--ms-text-muted)', fontWeight: 500 }}>No locations configured</p>
                  <small style={{ color: 'var(--ms-text-muted)' }}>Add your first location to get started.</small>
                  </div>
                ) : (
                  <div className="list-group list-group-flush" style={{ overflow: 'visible' }}>
                  {locations.map((loc, index) => (
                      <div 
                        key={loc.id} 
                        className="list-group-item"
                        style={{ 
                          padding: '16px 20px', 
                          border: 'none', 
                          borderBottom: '1px solid var(--ms-border)'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <span className={`ms-location-badge loc-${(index % 6) + 1}`} style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              padding: '8px 14px',
                              fontSize: '0.85rem',
                              fontWeight: 600
                            }}>
                          <Icons.MapPin /> {loc.name}
                        </span>
                          {loc.description && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--ms-text-muted)', lineHeight: 1.4, textAlign: 'center' }}>
                              {loc.description}
                            </div>
                          )}
                        </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="ms-btn ms-btn-secondary ms-btn-sm"
                            onClick={() => handleEditLocation(loc)}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            className="ms-btn ms-btn-danger ms-btn-sm"
                            onClick={() => handleDeleteLocation(loc.id)}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Col>

        {/* Day Schedules Card */}
          <Col lg={6}>
            <div className="ms-card h-100">
              <div className="ms-card-header">
                <h5 className="ms-section-title mb-0" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Icons.Calendar />
                  Day Schedules
                  <Tip text="Configure work hours for each week. Copy from previous week for quick setup." />
                </h5>
              </div>
              {/* Week Toolbar */}
              <div style={{ 
                padding: '12px 20px', 
                borderBottom: '1px solid var(--ms-border)', 
                background: 'var(--ms-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div className="ms-week-picker" style={{ margin: 0 }}>
                  <button
                    className="ms-icon-btn"
                    onClick={() => handleWeekChange('prev')}
                    title="Previous week"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"/>
                    </svg>
                  </button>
                  <div className="ms-week-picker-label" style={{ fontSize: '0.85rem' }}>
                    {formatWeekRange(weekStart)}
                  </div>
                  <button
                    className="ms-icon-btn"
                    onClick={() => handleWeekChange('next')}
                    title="Next week"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                  <button
                    className="ms-week-picker-today"
                    onClick={() => handleWeekChange('today')}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Today
                  </button>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <Button
                    className="ms-btn ms-btn-primary ms-btn-sm"
                    onClick={handleCopyFromPreviousWeek}
                    style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                    title="Copy schedule from previous week"
                    disabled={weekSchedules.length > 0}
                  >
                    Copy From Prev Week
                  </Button>
                  {weekSchedules.length > 0 && (
                    <Button
                      className="ms-btn ms-btn-danger ms-btn-sm"
                      onClick={handleClearWeek}
                      style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                      title="Clear all days for this week"
                    >
                      Clear Week
                    </Button>
                  )}
                </div>
              </div>
            <div className="ms-card-body" style={{ padding: 0 }}>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {DAY_NAMES.map((dayName, dayIndex) => {
                  const schedule = weekSchedules.find(s => s.day_of_week === dayIndex)
                  return (
                            <div 
                      key={dayIndex}
                              className="d-flex justify-content-between align-items-center"
                              style={{ 
                        padding: '14px 24px', 
                        borderBottom: '1px solid var(--ms-border)',
                        background: schedule ? 'transparent' : 'var(--ms-surface)'
                              }}
                            >
                      <div className="d-flex align-items-center gap-3">
                        <span style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '8px',
                          background: schedule ? 'var(--ms-mint-light)' : 'var(--ms-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          color: schedule ? 'var(--ms-mint-dark)' : 'var(--ms-text-muted)'
                        }}>
                          {dayName.slice(0, 2)}
                                </span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ms-text-primary)', fontSize: '0.9rem' }}>
                            {dayName}
                          </div>
                          {schedule ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--ms-text-muted)' }}>
                              {schedule.start_time} – {schedule.end_time} • {schedule.slot_count || calculateSlotCount(schedule.start_time, schedule.end_time, schedule.slot_duration_minutes || 30)} slots
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--ms-text-muted)', fontStyle: 'italic' }}>
                              Not configured (students see 8am-5pm default)
                            </div>
                          )}
                        </div>
                              </div>
                              <div className="d-flex gap-2">
                        {schedule ? (
                          <>
                                <button 
                                  className="ms-btn ms-btn-secondary ms-btn-sm"
                              onClick={() => handleEditDaySchedule(schedule)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="ms-btn ms-btn-danger ms-btn-sm"
                              onClick={() => handleDeleteDaySchedule(schedule.id, dayName)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                >
                                  ×
                                </button>
                          </>
                        ) : (
                          <button 
                            className="ms-btn ms-btn-primary ms-btn-sm"
                            onClick={() => handleAddDaySchedule(dayIndex)}
                            style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                          >
                            + Add
                          </button>
                        )}
                              </div>
                            </div>
                  )
                })}
                        </div>
              {/* Summary */}
              <div style={{ 
                padding: '12px 24px', 
                background: 'var(--ms-surface)', 
                borderTop: '1px solid var(--ms-border)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--ms-text-muted)' }}>
                  {weekSchedules.length > 0 
                    ? `${weekSchedules.length} days configured for this week`
                    : 'No days configured – click "Copy From Prev Week" or add days manually'}
                </span>
                  </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Location Modal */}
        <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)} centered>
          <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingLocation ? <><Icons.Edit /> Edit Location</> : <><Icons.Plus /> Add Location</>}
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
              <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.MapPin /> Name
              </Form.Label>
                <Form.Control
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder="e.g., Davis Mail Room"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="ms-label">Description (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={locationForm.description}
                  onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  placeholder="Brief description of this location..."
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
          <Button className="ms-btn ms-btn-secondary" onClick={() => setShowLocationModal(false)}>
              Cancel
            </Button>
          <Button className="ms-btn ms-btn-accent" onClick={handleSaveLocation}>
              {editingLocation ? 'Save Changes' : 'Add Location'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Time Slot Modal */}
        <Modal show={showTimeSlotModal} onHide={() => setShowTimeSlotModal(false)} centered>
          <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingTimeSlot ? <><Icons.Edit /> Edit Time Slot</> : <><Icons.Plus /> Add Time Slot</>}
          </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
              <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Calendar /> Day of Week
              </Form.Label>
                <Form.Select
                  value={timeSlotForm.day_of_week}
                  onChange={(e) => setTimeSlotForm({ ...timeSlotForm, day_of_week: parseInt(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(day => (
                    <option key={day} value={day}>{getDayName(day)}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                  <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Clock /> Start Time
                  </Form.Label>
                    <Form.Control
                      type="time"
                      value={timeSlotForm.start_time}
                      onChange={(e) => setTimeSlotForm({ ...timeSlotForm, start_time: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                  <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Clock /> End Time
                  </Form.Label>
                    <Form.Control
                      type="time"
                      value={timeSlotForm.end_time}
                      onChange={(e) => setTimeSlotForm({ ...timeSlotForm, end_time: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
          <Button className="ms-btn ms-btn-secondary" onClick={() => setShowTimeSlotModal(false)}>
              Cancel
            </Button>
          <Button className="ms-btn ms-btn-accent" onClick={handleSaveTimeSlot}>
              {editingTimeSlot ? 'Save Changes' : 'Add Time Slot'}
            </Button>
          </Modal.Footer>
        </Modal>

      {/* Day Schedule Modal */}
      <Modal show={showDayScheduleModal} onHide={() => setShowDayScheduleModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingDaySchedule ? (
              <><Icons.Edit /> Edit {DAY_NAMES[dayScheduleForm.day_of_week]}</>
            ) : (
              <><Icons.Plus /> Add Day</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--ms-text-muted)', 
            marginBottom: '16px',
            padding: '8px 12px',
            background: 'var(--ms-surface)',
            borderRadius: '6px'
          }}>
            Week: <strong>{formatWeekRange(weekStart)}</strong>
          </div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.Calendar /> Day of Week
              </Form.Label>
              <Form.Select
                value={dayScheduleForm.day_of_week}
                onChange={(e) => setDayScheduleForm({ ...dayScheduleForm, day_of_week: parseInt(e.target.value) })}
                disabled={!!editingDaySchedule}
              >
                {DAY_NAMES.map((day, index) => (
                  <option 
                    key={index} 
                    value={index}
                    disabled={!editingDaySchedule && configuredDays.has(index)}
                  >
                    {day} {!editingDaySchedule && configuredDays.has(index) ? '(already configured)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Clock /> Start Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={dayScheduleForm.start_time}
                    onChange={(e) => setDayScheduleForm({ ...dayScheduleForm, start_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label className="ms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icons.Clock /> End Time
                  </Form.Label>
                  <Form.Control
                    type="time"
                    value={dayScheduleForm.end_time}
                    onChange={(e) => setDayScheduleForm({ ...dayScheduleForm, end_time: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label className="ms-label">Slot Duration</Form.Label>
              <Form.Select
                value={dayScheduleForm.slot_duration_minutes}
                onChange={(e) => setDayScheduleForm({ ...dayScheduleForm, slot_duration_minutes: parseInt(e.target.value) })}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes (recommended)</option>
                <option value={60}>1 hour</option>
              </Form.Select>
            </Form.Group>
            
            {/* Preview */}
            {dayScheduleForm.start_time && dayScheduleForm.end_time && (
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--ms-mint-light)', 
                borderRadius: '8px',
                border: '1px solid var(--ms-mint)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--ms-mint-dark)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  Preview
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--ms-text-primary)' }}>
                  This will create <strong>{calculateSlotCount(dayScheduleForm.start_time, dayScheduleForm.end_time, dayScheduleForm.slot_duration_minutes)}</strong> time slots
                  for <strong>{DAY_NAMES[dayScheduleForm.day_of_week]}</strong>
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button className="ms-btn ms-btn-secondary" onClick={() => setShowDayScheduleModal(false)}>
            Cancel
          </Button>
          <Button 
            className="ms-btn ms-btn-accent" 
            onClick={handleSaveDaySchedule}
            disabled={savingDaySchedule}
          >
            {savingDaySchedule ? 'Saving...' : (editingDaySchedule ? 'Save Changes' : 'Add Day')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AdminSettingsPage

import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Alert, Table } from 'react-bootstrap'
import api from '../services/api'

interface Location {
  id: number
  name: string
}

interface TimeSlot {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
}

interface ShiftRequirement {
  id: number
  location_id: number
  time_slot_id: number
  required_workers: number
}

function AdminShiftRequirementsPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    return monday.toISOString().split('T')[0]
  })
  
  const [locations, setLocations] = useState<Location[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [requirements, setRequirements] = useState<Map<string, ShiftRequirement>>(new Map())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [weekStart])

  const loadData = async () => {
    try {
      const [locationsRes, timeSlotsRes, requirementsRes] = await Promise.all([
        api.get('/locations'),
        api.get('/time-slots'),
        api.get(`/shift-requirements?week_start=${weekStart}`)
      ])

      setLocations(locationsRes.data)
      setTimeSlots(timeSlotsRes.data)
      
      // Convert requirements array to map
      const reqMap = new Map<string, ShiftRequirement>()
      requirementsRes.data.forEach((req: any) => {
        const key = `${req.location_id}-${req.time_slot_id}`
        reqMap.set(key, req)
      })
      setRequirements(reqMap)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const handleRequirementChange = (locationId: number, timeSlotId: number, value: number) => {
    const key = `${locationId}-${timeSlotId}`
    const newRequirements = new Map(requirements)
    
    if (value > 0) {
      const existing = newRequirements.get(key)
      if (existing) {
        newRequirements.set(key, { ...existing, required_workers: value })
      } else {
        newRequirements.set(key, {
          id: 0,
          location_id: locationId,
          time_slot_id: timeSlotId,
          required_workers: value
        })
      }
    } else {
      newRequirements.delete(key)
    }
    
    setRequirements(newRequirements)
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const promises = Array.from(requirements.values()).map(req => {
        if (req.id) {
          return api.put(`/shift-requirements/${req.id}`, {
            ...req,
            week_start_date: weekStart
          })
        } else {
          return api.post('/shift-requirements', {
            location_id: req.location_id,
            time_slot_id: req.time_slot_id,
            week_start_date: weekStart,
            required_workers: req.required_workers
          })
        }
      })

      await Promise.all(promises)
      setMessage({ type: 'success', text: 'Shift requirements saved successfully!' })
      loadData()
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save requirements' })
    } finally {
      setLoading(false)
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[dayOfWeek]
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h3>Shift Requirements</h3>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Week Starting</Form.Label>
            <Form.Control
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </Form.Group>

          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {timeSlots.length === 0 || locations.length === 0 ? (
            <Alert variant="info">No time slots or locations configured. Please configure them in Settings first.</Alert>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table responsive bordered>
                <thead>
                  <tr>
                    <th>Time Slot</th>
                    {locations.map(loc => (
                      <th key={loc.id} className="text-center">
                        {loc.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(slot => (
                    <tr key={slot.id}>
                      <td>
                        <strong>{getDayName(slot.day_of_week)}</strong><br />
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </td>
                      {locations.map(loc => {
                        const key = `${loc.id}-${slot.id}`
                        const requirement = requirements.get(key)
                        const value = requirement?.required_workers || 0
                        
                        return (
                          <td key={loc.id} className="text-center">
                            <Form.Control
                              type="number"
                              min="0"
                              value={value}
                              onChange={(e) => handleRequirementChange(loc.id, slot.id, parseInt(e.target.value) || 0)}
                              style={{ width: '80px', margin: '0 auto' }}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <div className="mt-3">
            <Button variant="primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Requirements'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default AdminShiftRequirementsPage


import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Alert, Row, Col, Table } from 'react-bootstrap'
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

interface Availability {
  id?: number
  location_id: number
  time_slot_id: number
  preference_level: number
}

function StudentAvailabilityPage() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    return monday.toISOString().split('T')[0]
  })
  
  const [locations, setLocations] = useState<Location[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [availabilities, setAvailabilities] = useState<Map<string, Availability>>(new Map())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [weekStart])

  const loadData = async () => {
    try {
      const [locationsRes, timeSlotsRes, availabilityRes] = await Promise.all([
        api.get('/locations'),
        api.get('/time-slots'),
        api.get(`/availability?week_start=${weekStart}`)
      ])

      setLocations(locationsRes.data)
      setTimeSlots(timeSlotsRes.data)
      
      // Convert availability array to map
      const availMap = new Map<string, Availability>()
      availabilityRes.data.forEach((av: any) => {
        const key = `${av.location_id}-${av.time_slot_id}`
        availMap.set(key, av)
      })
      setAvailabilities(availMap)
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const handleAvailabilityChange = (locationId: number, timeSlotId: number, available: boolean, preference: number = 1) => {
    const key = `${locationId}-${timeSlotId}`
    const newAvailabilities = new Map(availabilities)
    
    if (available) {
      newAvailabilities.set(key, {
        location_id: locationId,
        time_slot_id: timeSlotId,
        preference_level: preference
      })
    } else {
      newAvailabilities.delete(key)
    }
    
    setAvailabilities(newAvailabilities)
  }

  const handlePreferenceChange = (locationId: number, timeSlotId: number, preference: number) => {
    const key = `${locationId}-${timeSlotId}`
    const existing = availabilities.get(key)
    if (existing) {
      const newAvailabilities = new Map(availabilities)
      newAvailabilities.set(key, { ...existing, preference_level: preference })
      setAvailabilities(newAvailabilities)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const entries = Array.from(availabilities.values()).map(av => ({
        location_id: av.location_id,
        time_slot_id: av.time_slot_id,
        preference_level: av.preference_level
      }))

      await api.post('/availability/batch', {
        week_start_date: weekStart,
        entries
      })

      setMessage({ type: 'success', text: 'Availability saved successfully!' })
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save availability' })
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
          <h3>Set Availability</h3>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Week Starting</Form.Label>
                <Form.Control
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {timeSlots.length === 0 || locations.length === 0 ? (
            <Alert variant="info">No time slots or locations configured. Please contact an admin.</Alert>
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
                        const availability = availabilities.get(key)
                        const isAvailable = availability !== undefined
                        
                        return (
                          <td key={loc.id} className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={isAvailable}
                              onChange={(e) => handleAvailabilityChange(loc.id, slot.id, e.target.checked)}
                              label="Available"
                            />
                            {isAvailable && (
                              <Form.Select
                                size="sm"
                                value={availability.preference_level}
                                onChange={(e) => handlePreferenceChange(loc.id, slot.id, parseInt(e.target.value))}
                                className="mt-2"
                              >
                                <option value={1}>Neutral</option>
                                <option value={2}>Preferred</option>
                              </Form.Select>
                            )}
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
              {loading ? 'Saving...' : 'Save Availability'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default StudentAvailabilityPage


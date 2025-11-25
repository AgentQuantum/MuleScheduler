import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Alert, Table, Modal } from 'react-bootstrap'
import api from '../services/api'

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

interface Settings {
  max_workers_per_shift: number
  max_hours_per_user_per_week: number | null
}

function AdminSettingsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [settings, setSettings] = useState<Settings>({ max_workers_per_shift: 3, max_hours_per_user_per_week: null })
  
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null)
  
  const [locationForm, setLocationForm] = useState({ name: '', description: '' })
  const [timeSlotForm, setTimeSlotForm] = useState({ day_of_week: 0, start_time: '09:00', end_time: '17:00' })
  
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

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

  const handleSaveSettings = async () => {
    try {
      await api.put('/settings', settings)
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save settings' })
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
      setMessage({ type: 'success', text: 'Location saved successfully!' })
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save location' })
    }
  }

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await api.delete(`/locations/${id}`)
        loadData()
        setMessage({ type: 'success', text: 'Location deleted successfully!' })
      } catch (err: any) {
        setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to delete location' })
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
      setTimeSlotForm({ day_of_week: 0, start_time: '09:00', end_time: '17:00' })
      loadData()
      setMessage({ type: 'success', text: 'Time slot saved successfully!' })
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to save time slot' })
    }
  }

  const handleDeleteTimeSlot = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        await api.delete(`/time-slots/${id}`)
        loadData()
        setMessage({ type: 'success', text: 'Time slot deleted successfully!' })
      } catch (err: any) {
        setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to delete time slot' })
      }
    }
  }

  const handleEditTimeSlot = (slot: TimeSlot) => {
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

  return (
    <Container className="my-4">
      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="mb-3">
          {message.text}
        </Alert>
      )}

      {/* Global Settings */}
      <Card className="mb-4">
        <Card.Header>
          <h3>Global Settings</h3>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Max Workers Per Shift</Form.Label>
              <Form.Control
                type="number"
                value={settings.max_workers_per_shift}
                onChange={(e) => setSettings({ ...settings, max_workers_per_shift: parseInt(e.target.value) })}
                min={1}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Max Hours Per User Per Week (optional)</Form.Label>
              <Form.Control
                type="number"
                value={settings.max_hours_per_user_per_week || ''}
                onChange={(e) => setSettings({ ...settings, max_hours_per_user_per_week: e.target.value ? parseInt(e.target.value) : null })}
                min={1}
                placeholder="Leave empty for no limit"
              />
            </Form.Group>
            <Button variant="primary" onClick={handleSaveSettings}>Save Settings</Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Locations */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3>Locations</h3>
          <Button variant="primary" onClick={() => { setEditingLocation(null); setLocationForm({ name: '', description: '' }); setShowLocationModal(true) }}>
            Add Location
          </Button>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(loc => (
                <tr key={loc.id}>
                  <td>{loc.name}</td>
                  <td>{loc.description || '-'}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => handleEditLocation(loc)} className="me-2">
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteLocation(loc.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Time Slots */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h3>Time Slots</h3>
          <Button variant="primary" onClick={() => { setEditingTimeSlot(null); setTimeSlotForm({ day_of_week: 0, start_time: '09:00', end_time: '17:00' }); setShowTimeSlotModal(true) }}>
            Add Time Slot
          </Button>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Day</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot.id}>
                  <td>{getDayName(slot.day_of_week)}</td>
                  <td>{slot.start_time.substring(0, 5)}</td>
                  <td>{slot.end_time.substring(0, 5)}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" onClick={() => handleEditTimeSlot(slot)} className="me-2">
                      Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTimeSlot(slot.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Location Modal */}
      <Modal show={showLocationModal} onHide={() => setShowLocationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingLocation ? 'Edit Location' : 'Add Location'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={locationForm.description}
                onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLocationModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveLocation}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Time Slot Modal */}
      <Modal show={showTimeSlotModal} onHide={() => setShowTimeSlotModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingTimeSlot ? 'Edit Time Slot' : 'Add Time Slot'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Day of Week</Form.Label>
              <Form.Select
                value={timeSlotForm.day_of_week}
                onChange={(e) => setTimeSlotForm({ ...timeSlotForm, day_of_week: parseInt(e.target.value) })}
              >
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <option key={day} value={day}>{getDayName(day)}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={timeSlotForm.start_time}
                onChange={(e) => setTimeSlotForm({ ...timeSlotForm, start_time: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                value={timeSlotForm.end_time}
                onChange={(e) => setTimeSlotForm({ ...timeSlotForm, end_time: e.target.value })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTimeSlotModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveTimeSlot}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default AdminSettingsPage


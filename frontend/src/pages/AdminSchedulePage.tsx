import { useState, useEffect } from 'react'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import WeeklyScheduleCalendar from '../components/WeeklyScheduleCalendar'

interface Location {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
}

function AdminSchedulePage() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    return monday.toISOString().split('T')[0]
  })
  
  const [locations, setLocations] = useState<Location[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [locationFilter, setLocationFilter] = useState<number | null>(null)
  const [userFilter, setUserFilter] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null)
  const [schedulerLoading, setSchedulerLoading] = useState(false)

  // Load locations and users for filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [locationsRes, usersRes] = await Promise.all([
          api.get('/locations'),
          api.get('/users')
        ])
        setLocations(locationsRes.data)
        setUsers(usersRes.data)
      } catch (err) {
        console.error('Failed to load filters:', err)
      }
    }
    loadFilters()
  }, [])

  const handleWeekChange = (direction: 'prev' | 'next' | 'today') => {
    const current = new Date(weekStart)
    if (direction === 'prev') {
      current.setDate(current.getDate() - 7)
    } else if (direction === 'next') {
      current.setDate(current.getDate() + 7)
    } else {
      // Today
      const today = new Date()
      current.setTime(today.getTime())
      current.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    }
    setWeekStart(current.toISOString().split('T')[0])
  }

  const handleRunScheduler = async () => {
    setSchedulerLoading(true)
    setMessage(null)

    try {
      const response = await api.post('/assignments/run-scheduler', {
        week_start_date: weekStart
      })
      setMessage({ type: 'success', text: response.data.message || 'Scheduler completed successfully!' })
      // Calendar will auto-refresh via useEffect
    } catch (err: any) {
      setMessage({ type: 'danger', text: err.response?.data?.error || 'Failed to run scheduler' })
    } finally {
      setSchedulerLoading(false)
    }
  }

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h3>Schedule Management</h3>
            </Col>
            <Col md="auto">
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <Button 
                  variant="primary" 
                  onClick={handleRunScheduler} 
                  disabled={schedulerLoading}
                  className="me-2"
                >
                  {schedulerLoading ? 'Running...' : 'Run Auto-Scheduler'}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => handleWeekChange('prev')}
                >
                  ← Previous
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => handleWeekChange('today')}
                >
                  Today
                </Button>
                <Form.Control
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  style={{ width: 'auto', minWidth: '150px' }}
                />
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => handleWeekChange('next')}
                >
                  Next →
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)} className="mb-3">
              {message.text}
            </Alert>
          )}

          {/* Filters */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Location</Form.Label>
                <Form.Select
                  value={locationFilter || ''}
                  onChange={(e) => setLocationFilter(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filter by Worker</Form.Label>
                <Form.Select
                  value={userFilter || ''}
                  onChange={(e) => setUserFilter(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">All Workers</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="mb-3">
            <small className="text-muted">
              <strong>Tip:</strong> Drag and drop shifts to move them to different time slots. 
              The system will validate conflicts automatically.
            </small>
          </div>

          <WeeklyScheduleCalendar
            role="admin"
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            locationFilter={locationFilter}
            userFilter={userFilter}
          />
        </Card.Body>
      </Card>
    </Container>
  )
}

export default AdminSchedulePage

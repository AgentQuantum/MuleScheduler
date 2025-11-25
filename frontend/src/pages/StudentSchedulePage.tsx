import { useState } from 'react'
import { Container, Card, Form, Row, Col, Button } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import WeeklyScheduleCalendar from '../components/WeeklyScheduleCalendar'

function StudentSchedulePage() {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    return monday.toISOString().split('T')[0]
  })

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

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h3>My Schedule</h3>
            </Col>
            <Col md="auto">
              <div className="d-flex gap-2 align-items-center flex-wrap">
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
          <WeeklyScheduleCalendar
            role="user"
            weekStart={weekStart}
            onWeekChange={setWeekStart}
          />
        </Card.Body>
      </Card>
    </Container>
  )
}

export default StudentSchedulePage

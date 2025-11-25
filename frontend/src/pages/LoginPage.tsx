import { useState } from 'react'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, role)
      navigate(role === 'admin' ? '/admin/schedule' : '/student/schedule')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container fluid className="p-0" style={{ minHeight: '100vh' }}>
      <Row className="g-0" style={{ minHeight: '100vh' }}>
        {/* Left Side - Colby Image/Background */}
        <Col md={7} className="d-none d-md-flex align-items-center justify-content-center" 
             style={{ 
               backgroundColor: 'var(--bs-secondary)', 
               backgroundImage: 'url(/colby-campus.jpg)',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               position: 'relative'
             }}>
          {/* Overlay for better text readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 33, 105, 0.75)'
          }}></div>
          
          {/* Content on left side */}
          <div className="text-white p-5" style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
            <h1 className="display-4 fw-bold mb-4">MuleScheduler</h1>
            <p className="lead mb-4">
              Streamline your student worker scheduling with intelligent automation and easy-to-use tools.
            </p>
            <p className="mb-0" style={{ fontSize: '1.1rem' }}>
              Designed for Colby College's shift-based work, our scheduler helps power smarter decisions to improve efficiency and drive productivity.
            </p>
          </div>
        </Col>

        {/* Right Side - Login Form */}
        <Col md={5} className="d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#ffffff' }}>
          <Card style={{ width: '100%', maxWidth: '420px', border: 'none', boxShadow: 'var(--bs-box-shadow-lg)' }}>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2" style={{ color: 'var(--color-primary-darker)' }}>Welcome Back</h2>
                <p className="text-muted">Sign in to your account</p>
              </div>
              
              {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '0.75rem' }}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Role</Form.Label>
                  <Form.Select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    style={{ padding: '0.75rem' }}
                  >
                    <option value="user">Student Worker</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 mb-3" 
                  disabled={loading}
                  style={{ padding: '0.75rem', fontSize: '1rem', fontWeight: '500' }}
                >
                  {loading ? 'Logging in...' : 'Log in'}
                </Button>
                
                <div className="text-center">
                  <small className="text-muted">
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--bs-primary)', textDecoration: 'none', fontWeight: '500' }}>
                      Sign up here
                    </Link>
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default LoginPage

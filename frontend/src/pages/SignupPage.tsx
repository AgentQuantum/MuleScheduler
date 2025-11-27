import { useState } from 'react'
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/scheduler.css'

function SignupPage() {
  const [name, setName] = useState('')
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
      // Create account by logging in (current stub system)
      await login(email, role)
      
      navigate(role === 'admin' ? '/admin/schedule' : '/student/schedule')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--ms-bg)',
      display: 'flex',
      alignItems: 'center'
    }}>
      <Container fluid className="p-0">
        <Row className="g-0 justify-content-center">
          {/* Left Side - Branding */}
          <Col lg={6} className="d-none d-lg-flex align-items-center justify-content-center" 
             style={{ 
                 background: 'linear-gradient(135deg, #002169 0%, #1E40AF 50%, #3B82F6 100%)',
                 minHeight: '100vh',
                 position: 'relative',
                 overflow: 'hidden'
             }}>
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              top: '-100px',
              right: '-100px'
            }} />
          <div style={{
            position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.03)',
              bottom: '-50px',
              left: '-50px'
            }} />
          
          {/* Content on left side */}
          <div className="text-white p-5" style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                fontFamily: 'var(--ms-font-display)',
                marginBottom: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}>
                MS
              </div>
              <h1 style={{ 
                fontFamily: 'var(--ms-font-display)', 
                fontSize: '3rem', 
                fontWeight: 800,
                marginBottom: '24px',
                letterSpacing: '-0.02em'
              }}>
                Join MuleScheduler
              </h1>
              <p style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '32px', lineHeight: 1.6 }}>
              Get started with intelligent scheduling designed specifically for Colby College student workers.
            </p>
              
              {/* Feature chips */}
              <div className="d-flex flex-wrap gap-2">
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}>
                  📅 View Schedule
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}>
                  ⏰ Set Availability
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}>
                  🔔 Get Notified
                </span>
              </div>
          </div>
        </Col>

        {/* Right Side - Signup Form */}
          <Col lg={6} className="d-flex align-items-center justify-content-center p-4" style={{ minHeight: '100vh' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
              {/* Mobile logo */}
              <div className="d-lg-none text-center mb-4">
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: 'linear-gradient(135deg, #002169 0%, #1E40AF 100%)',
                  borderRadius: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'white',
                  fontFamily: 'var(--ms-font-display)',
                  marginBottom: '16px',
                  boxShadow: '0 4px 12px rgba(0,33,105,0.3)'
                }}>
                  MS
                </div>
                <h1 style={{ 
                  fontFamily: 'var(--ms-font-display)', 
                  fontSize: '1.75rem', 
                  fontWeight: 700,
                  color: 'var(--ms-text-primary)'
                }}>
                  MuleScheduler
                </h1>
              </div>
              
              <Card className="ms-card" style={{ boxShadow: 'var(--ms-shadow-lg)' }}>
                <Card.Body style={{ padding: '40px' }}>
                  <div className="text-center mb-4">
                    <h2 style={{ 
                      fontFamily: 'var(--ms-font-display)',
                      fontWeight: 700, 
                      color: 'var(--ms-text-primary)',
                      fontSize: '1.5rem',
                      marginBottom: '8px'
                    }}>
                      Create Account ✨
                    </h2>
                    <p style={{ color: 'var(--ms-text-muted)', fontSize: '0.95rem' }}>
                      Sign up to get started
                    </p>
                  </div>
                  
                  {error && (
                    <Alert variant="danger" className="mb-4">
                      {error}
                    </Alert>
                  )}
              
              <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label className="ms-label">Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                        style={{ padding: '14px 16px', fontSize: '1rem' }}
                  />
                </Form.Group>
                
                    <Form.Group className="mb-4">
                      <Form.Label className="ms-label">Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                        style={{ padding: '14px 16px', fontSize: '1rem' }}
                  />
                      <Form.Text style={{ color: 'var(--ms-text-muted)', fontSize: '0.8rem' }}>
                    Use your @colby.edu email address
                  </Form.Text>
                </Form.Group>
                
                    <Form.Group className="mb-4">
                      <Form.Label className="ms-label">Role</Form.Label>
                  <Form.Select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                        style={{ padding: '14px 16px', fontSize: '1rem' }}
                  >
                        <option value="user">Student Worker</option>
                        <option value="admin">Administrator</option>
                  </Form.Select>
                </Form.Group>
                
                <Button 
                      className="ms-btn ms-btn-primary w-100" 
                  type="submit" 
                  disabled={loading}
                      style={{ 
                        padding: '14px', 
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #002169 0%, #1E40AF 100%)',
                        borderColor: '#002169'
                      }}
                >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                </Button>
                
                    <div className="text-center mt-4">
                      <span style={{ color: 'var(--ms-text-muted)', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                        <Link 
                          to="/login" 
                          style={{ 
                            color: 'var(--ms-colby-blue)', 
                            textDecoration: 'none', 
                            fontWeight: 600 
                          }}
                        >
                          Sign in here
                    </Link>
                      </span>
                </div>
              </Form>
            </Card.Body>
          </Card>

              <p className="text-center mt-4" style={{ color: 'var(--ms-text-muted)', fontSize: '0.8rem' }}>
                Designed for Colby College 🐴
              </p>
            </div>
        </Col>
      </Row>
    </Container>
    </div>
  )
}

export default SignupPage

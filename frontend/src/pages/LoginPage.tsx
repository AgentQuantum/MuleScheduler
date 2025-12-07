import { useState } from 'react';
import { Container, Card, Button, Row, Col, Collapse } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { isDemoMode } from '../utils/env';
import '../styles/scheduler.css';

// Demo mode is enabled via environment variable
const DEMO_MODE = isDemoMode();

function LoginPage() {
  const { login, demoLogin } = useAuth();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [showDemoOptions, setShowDemoOptions] = useState(false);

  const handleLogin = () => {
    login();
  };

  const handleDemoLogin = async (email: string) => {
    setDemoLoading(email);
    try {
      await demoLogin(email);
    } catch (error) {
      console.error('Demo login failed:', error);
      setDemoLoading(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--ms-bg)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container fluid className="p-0">
        <Row className="g-0 justify-content-center">
          {/* Left Side - Branding */}
          <Col
            lg={6}
            className="d-none d-lg-flex align-items-center justify-content-center"
            style={{
              background: 'linear-gradient(135deg, #002169 0%, #1E40AF 50%, #3B82F6 100%)',
              minHeight: '100vh',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative elements */}
            <div
              style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                top: '-100px',
                right: '-100px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                bottom: '-50px',
                left: '-50px',
              }}
            />

            {/* Content on left side */}
            <div
              className="text-white p-5"
              style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}
            >
              <div
                style={{
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
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                MS
              </div>
              <h1
                style={{
                  fontFamily: 'var(--ms-font-display)',
                  fontSize: '3rem',
                  fontWeight: 800,
                  marginBottom: '24px',
                  letterSpacing: '-0.02em',
                }}
              >
                MuleScheduler
              </h1>
              <p
                style={{ fontSize: '1.2rem', opacity: 0.9, marginBottom: '32px', lineHeight: 1.6 }}
              >
                Streamline your student worker scheduling with intelligent automation and
                easy-to-use tools.
              </p>

              {/* Feature chips */}
              <div className="d-flex flex-wrap gap-2">
                <span
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  📅 Smart Scheduling
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  🔄 Drag & Drop
                </span>
                <span
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  ✨ Auto-Assign
                </span>
              </div>
            </div>
          </Col>

          {/* Right Side - Login Form */}
          <Col
            lg={6}
            className="d-flex align-items-center justify-content-center p-4"
            style={{ minHeight: '100vh' }}
          >
            <div style={{ width: '100%', maxWidth: '440px' }}>
              {/* Mobile logo */}
              <div className="d-lg-none text-center mb-4">
                <div
                  style={{
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
                    boxShadow: '0 4px 12px rgba(0,33,105,0.3)',
                  }}
                >
                  MS
                </div>
                <h1
                  style={{
                    fontFamily: 'var(--ms-font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: 'var(--ms-text-primary)',
                  }}
                >
                  MuleScheduler
                </h1>
              </div>

              <Card className="ms-card" style={{ boxShadow: 'var(--ms-shadow-lg)' }}>
                <Card.Body style={{ padding: '40px' }}>
                  <div className="text-center mb-4">
                    <h2
                      style={{
                        fontFamily: 'var(--ms-font-display)',
                        fontWeight: 700,
                        color: 'var(--ms-text-primary)',
                        fontSize: '1.5rem',
                        marginBottom: '8px',
                      }}
                    >
                      Login
                    </h2>
                    <p style={{ color: 'var(--ms-text-muted)', fontSize: '0.95rem' }}>
                      Use your Colby College credentials
                    </p>
                  </div>

                  <div className="text-center">
                    <Button
                      className="ms-btn ms-btn-primary w-100"
                      onClick={handleLogin}
                      style={{
                        padding: '14px',
                        fontSize: '1rem',
                        background: 'linear-gradient(135deg, #002169 0%, #1E40AF 100%)',
                        borderColor: '#002169',
                      }}
                    >
                      Login with Colby
                    </Button>

                    <p
                      className="mt-4"
                      style={{ color: 'var(--ms-text-muted)', fontSize: '0.85rem' }}
                    >
                      You will be redirected to Colby's secure login page
                    </p>
                  </div>

                  {/* Demo Mode Toggle */}
                  {DEMO_MODE && (
                    <div style={{ marginTop: '24px' }}>
                      <button
                        onClick={() => setShowDemoOptions(!showDemoOptions)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--ms-text-muted)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: '0 auto',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <span
                          style={{
                            background: '#FEF3C7',
                            color: '#92400E',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                          }}
                        >
                          DEMO
                        </span>
                        Demo Mode {showDemoOptions ? '▲' : '▼'}
                      </button>

                      <Collapse in={showDemoOptions}>
                        <div
                          style={{
                            marginTop: '16px',
                            padding: '16px',
                            background: '#FAFAFA',
                            borderRadius: '12px',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          {/* Admin Demo */}
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="w-100 mb-3"
                            onClick={() => handleDemoLogin('admin@colby.edu')}
                            disabled={demoLoading !== null}
                            style={{
                              borderRadius: '8px',
                              padding: '10px',
                              fontWeight: 500,
                            }}
                          >
                            {demoLoading === 'admin@colby.edu' ? 'Logging in...' : 'Demo as Admin'}
                          </Button>

                          {/* Student Demo */}
                          <div>
                            <p
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--ms-text-muted)',
                                marginBottom: '8px',
                                textAlign: 'center',
                              }}
                            >
                              Demo as Student
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                              {[1, 2, 3].map((num) => (
                                <Button
                                  key={num}
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={() =>
                                    handleDemoLogin(
                                      `student.${['one', 'two', 'three'][num - 1]}@colby.edu`
                                    )
                                  }
                                  disabled={demoLoading !== null}
                                  style={{
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    minWidth: '50px',
                                  }}
                                >
                                  {demoLoading ===
                                  `student.${['one', 'two', 'three'][num - 1]}@colby.edu`
                                    ? '...'
                                    : num}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <p
                className="text-center mt-4"
                style={{ color: 'var(--ms-text-muted)', fontSize: '0.8rem' }}
              >
                Designed for Colby College
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default LoginPage;

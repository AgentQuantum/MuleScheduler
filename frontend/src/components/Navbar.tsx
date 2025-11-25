import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <BootstrapNavbar expand="lg" style={{ backgroundColor: 'white' }}>
      <Container>
        <BootstrapNavbar.Brand href="#" onClick={() => navigate('/')} style={{ color: 'var(--color-primary-darker)', fontWeight: '700' }}>
          MuleScheduler
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user?.role === 'admin' ? (
              <>
                <Nav.Link onClick={() => navigate('/admin/schedule')} style={{ color: 'var(--bs-body-color)' }}>Schedule</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/requirements')} style={{ color: 'var(--bs-body-color)' }}>Requirements</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/settings')} style={{ color: 'var(--bs-body-color)' }}>Settings</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link onClick={() => navigate('/student/schedule')} style={{ color: 'var(--bs-body-color)' }}>My Schedule</Nav.Link>
                <Nav.Link onClick={() => navigate('/student/preferences')} style={{ color: 'var(--bs-body-color)' }}>Availability</Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            <NavDropdown title={user?.name || 'User'} id="user-nav-dropdown" style={{ color: 'var(--bs-body-color)' }}>
              <NavDropdown.Item disabled>{user?.email}</NavDropdown.Item>
              <NavDropdown.Item disabled>Role: {user?.role}</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  )
}

export default Navbar


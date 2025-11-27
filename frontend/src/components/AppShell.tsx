import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dropdown } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import UserAvatar from './UserAvatar'

interface AppShellProps {
  children: React.ReactNode
  pageTitle?: string
}

// SVG Icons as components
const Icons = {
  Dashboard: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <rect x="7" y="14" width="3" height="3" rx="0.5"/>
    </svg>
  ),
  CheckSquare: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  Settings: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Users: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Clock: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Help: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

// Simple MS Logo
const MSLogo = () => (
  <div style={{
    width: 42,
    height: 42,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #002169 0%, #1E40AF 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0, 33, 105, 0.3)',
  }}>
    <span style={{
      color: 'white',
      fontWeight: 800,
      fontSize: '1rem',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      letterSpacing: '-0.02em'
    }}>MS</span>
  </div>
)

const AppShell: React.FC<AppShellProps> = ({ children, pageTitle }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const adminNavItems = [
    { path: '/admin/schedule', icon: Icons.Calendar, label: 'Schedule', description: 'Manage shifts' },
    { path: '/admin/settings', icon: Icons.Settings, label: 'Settings', description: 'Configure app' },
  ]

  const studentNavItems = [
    { path: '/student/schedule', icon: Icons.Calendar, label: 'My Schedule', description: 'View your shifts' },
    { path: '/me/availability', icon: Icons.Clock, label: 'Availability', description: 'Set your hours' },
  ]

  const navItems = isAdmin ? adminNavItems : studentNavItems

  return (
    <div className="ms-app-shell">
      {/* Left Sidebar - Expanded with labels */}
      <nav className="ms-sidebar-expanded">
        {/* Logo & Brand */}
        <div 
          className="ms-sidebar-brand"
          onClick={() => navigate('/')}
        >
          <div className="ms-sidebar-logo-icon">
            <MSLogo />
          </div>
          <div className="ms-sidebar-brand-text">
            <span className="ms-sidebar-brand-name">MuleScheduler</span>
            <span className="ms-sidebar-brand-tagline">Colby College</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="ms-sidebar-section">
          <div className="ms-sidebar-section-label">Navigation</div>
          <div className="ms-sidebar-nav-expanded">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`ms-sidebar-nav-item-expanded ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="ms-sidebar-nav-icon">
                  <item.icon />
                </span>
                <span className="ms-sidebar-nav-text">
                  <span className="ms-sidebar-nav-label">{item.label}</span>
                  <span className="ms-sidebar-nav-desc">{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats for Admin */}
        {isAdmin && (
          <div className="ms-sidebar-section">
            <div className="ms-sidebar-section-label">Quick Info</div>
            <div className="ms-sidebar-quick-stats">
              <div className="ms-sidebar-stat">
                <span className="ms-sidebar-stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="10"/>
                    <line x1="18" y1="20" x2="18" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="16"/>
                  </svg>
                </span>
                <span className="ms-sidebar-stat-text">Dashboard</span>
              </div>
              <div className="ms-sidebar-stat">
                <span className="ms-sidebar-stat-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <span className="ms-sidebar-stat-text">Team</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Items */}
        <div className="ms-sidebar-bottom-expanded">
          <button className="ms-sidebar-nav-item-expanded help">
            <span className="ms-sidebar-nav-icon">
              <Icons.Help />
            </span>
            <span className="ms-sidebar-nav-text">
              <span className="ms-sidebar-nav-label">Help Center</span>
              <span className="ms-sidebar-nav-desc">Get support</span>
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="ms-main-wrapper-expanded">
        {/* Top Bar */}
        <header className="ms-topbar">
          <div className="ms-topbar-left">
            {pageTitle && <h1 className="ms-topbar-title">{pageTitle}</h1>}
          </div>

          {/* Search Bar */}
          <div className="ms-topbar-search">
            <span className="ms-topbar-search-icon">
              <Icons.Search />
            </span>
            <input
              type="text"
              className="ms-topbar-search-input"
              placeholder="Search workers or shifts..."
            />
          </div>

          {/* User Menu */}
          <div className="ms-topbar-right">
            <Dropdown align="end">
              <Dropdown.Toggle
                as="div"
                className="ms-topbar-user"
                style={{ cursor: 'pointer' }}
                id="user-dropdown"
              >
                <div className="ms-topbar-user-info">
                  <div className="ms-topbar-user-name">{user?.name || 'User'}</div>
                  <div className="ms-topbar-user-email">{user?.email}</div>
                </div>
                <UserAvatar 
                  name={user?.name || 'User'} 
                  email={user?.email}
                  size="md"
                />
              </Dropdown.Toggle>

              <Dropdown.Menu style={{ 
                borderRadius: '14px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                border: '1px solid #E5E7EB',
                padding: '8px'
              }}>
                <div style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid #E5E7EB',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontWeight: 600, color: '#000' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{user?.email}</div>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`ms-chip ms-chip-${isAdmin ? 'open' : 'assigned'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                      {isAdmin ? '👑 Administrator' : '👤 Student'}
                    </span>
                  </div>
                </div>
                <Dropdown.Item 
                  onClick={handleLogout}
                  style={{ 
                    borderRadius: '8px',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px'
                  }}
                >
                  <Icons.LogOut />
                  Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        {/* Page Content */}
        <main className="ms-main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell

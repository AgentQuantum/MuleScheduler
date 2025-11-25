import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import StudentAvailabilityPage from './pages/StudentAvailabilityPage'
import StudentSchedulePage from './pages/StudentSchedulePage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminShiftRequirementsPage from './pages/AdminShiftRequirementsPage'
import AdminSchedulePage from './pages/AdminSchedulePage'
import Navbar from './components/Navbar'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="text-center p-5">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/student/schedule" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'admin' ? '/admin/schedule' : '/student/schedule'} replace />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to={user.role === 'admin' ? '/admin/schedule' : '/student/schedule'} replace />} />
        <Route path="/student/preferences" element={<ProtectedRoute><StudentAvailabilityPage /></ProtectedRoute>} />
        <Route path="/student/schedule" element={<ProtectedRoute><StudentSchedulePage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettingsPage /></ProtectedRoute>} />
        <Route path="/admin/requirements" element={<ProtectedRoute requireAdmin><AdminShiftRequirementsPage /></ProtectedRoute>} />
        <Route path="/admin/schedule" element={<ProtectedRoute requireAdmin><AdminSchedulePage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/schedule' : '/student/schedule') : '/login'} replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App


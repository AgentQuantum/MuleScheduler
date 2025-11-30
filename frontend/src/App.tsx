import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentAvailabilityPage from './pages/StudentAvailabilityPage';
import StudentSchedulePage from './pages/StudentSchedulePage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminSchedulePage from './pages/AdminSchedulePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AppShell from './components/AppShell';

function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--ms-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="ms-loading">
          <div className="ms-spinner"></div>
          <p className="ms-loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/student/schedule" replace />;
  }

  return <>{children}</>;
}

// Page titles for the shell
const pageTitles: Record<string, string> = {
  '/admin/schedule': 'Schedule',
  '/admin/settings': 'Settings',
  '/admin/users': 'Manage Users',
  '/student/schedule': 'My Schedule',
  '/me/availability': 'Set Availability',
  '/student/preferences': 'Set Availability',
};

function AppContent({ children, path }: { children: React.ReactNode; path: string }) {
  const pageTitle = pageTitles[path] || '';
  return <AppShell pageTitle={pageTitle}>{children}</AppShell>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          !user ? (
            <LoginPage />
          ) : (
            <Navigate to={user.role === 'admin' ? '/admin/schedule' : '/me/availability'} replace />
          )
        }
      />
      <Route
        path="/signup"
        element={
          !user ? (
            <SignupPage />
          ) : (
            <Navigate to={user.role === 'admin' ? '/admin/schedule' : '/me/availability'} replace />
          )
        }
      />

      {/* Student routes */}
      <Route
        path="/me/availability"
        element={
          <ProtectedRoute>
            <AppContent path="/me/availability">
              <StudentAvailabilityPage />
            </AppContent>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/preferences"
        element={
          <ProtectedRoute>
            <AppContent path="/student/preferences">
              <StudentAvailabilityPage />
            </AppContent>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/schedule"
        element={
          <ProtectedRoute>
            <AppContent path="/student/schedule">
              <StudentSchedulePage />
            </AppContent>
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <AppContent path="/admin/users">
              <AdminUsersPage />
            </AppContent>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requireAdmin>
            <AppContent path="/admin/settings">
              <AdminSettingsPage />
            </AppContent>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedule"
        element={
          <ProtectedRoute requireAdmin>
            <AppContent path="/admin/schedule">
              <AdminSchedulePage />
            </AppContent>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={user ? (user.role === 'admin' ? '/admin/schedule' : '/me/availability') : '/login'}
            replace
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider duration={5000}>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

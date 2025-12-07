import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import api from '../services/api';
import { User } from '../types/scheduler';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
  setUser: (user: User | null) => void;
  // Demo login (bypasses OAuth for demo accounts)
  demoLogin: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      // Check for token in URL (after Google callback redirect)
      const url = new URL(window.location.href);
      const tokenFromUrl = url.searchParams.get('token');

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        setToken(tokenFromUrl);
        api.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;
        // Clean the URL
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
      }

      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          setUser(null);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = () => {
    // Start Google OAuth flow (backend handles redirect)
    window.location.href = '/api/auth/google/login';
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  // Demo login - bypasses OAuth for demo accounts
  const demoLogin = async (email: string) => {
    try {
      const response = await api.post('/auth/test-token', { email });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Navigate to appropriate page based on role
      if (newUser.role === 'admin') {
        window.location.href = '/admin/schedule';
      } else {
        window.location.href = '/me/availability';
      }
    } catch (error) {
      console.error('Demo login failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        setUser,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

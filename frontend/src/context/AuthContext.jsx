// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { authService, paymentsService } from '../services/api';

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimeoutRef = useRef(null);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    toast('Logged out due to inactivity', { icon: '🔒' });
  }, [navigate]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    inactivityTimeoutRef.current = window.setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    const expiry = getTokenExpiry(token);
    if (expiry && Date.now() > expiry) {
      logout();
      setLoading(false);
      return;
    }

    authService.getProfile()
      .then((userData) => {
        setUser(userData);
        resetInactivityTimer();
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, [logout, resetInactivityTimer]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
    };
  }, [resetInactivityTimer, user]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.access_token);
    const userData = await authService.getProfile();
    setUser(userData);
    resetInactivityTimer();
    const sub = await paymentsService.getSubscriptionStatus();
    navigate(sub?.is_active ? '/dashboard' : '/payments');
    return userData;
  };

  const loginWithGoogle = async (token, profile) => {
    const data = await authService.googleAuth({
      email: profile.email,
      google_id: profile.sub,
      full_name: profile.name,
      access_token: token,
    });
    localStorage.setItem('token', data.access_token);
    const userData = await authService.getProfile();
    setUser(userData);
    resetInactivityTimer();
    const sub = await paymentsService.getSubscriptionStatus();
    navigate(sub?.is_active ? '/dashboard' : '/payments');
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
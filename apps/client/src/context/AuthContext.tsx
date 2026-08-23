import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  isJwtExpired,
  IDLE_TIMEOUT_MS,
  WARN_BEFORE_TIMEOUT_MS,
  MAX_SESSION_MS,
  getTokenRemainingTime,
  isSessionExpired,
} from '@drinkhub/shared';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());

  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('accessToken');
    if (savedToken && isJwtExpired(savedToken)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      return null;
    }
    return savedToken;
  });

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIdleWarning(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  }, []);

  const login = (newToken: string, newUser: User) => {
    lastActivityRef.current = Date.now();
    setToken(newToken);
    setUser(newUser);
    setIdleWarning(false);
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('loginTime', Date.now().toString());
  };

  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleWarning(false);
  }, []);

  // 1. User activity tracker
  useEffect(() => {
    if (!token) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleWarning(false);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown', 'focus', 'wheel'];
    events.forEach((evt) => {
      window.addEventListener(evt, updateActivity, { passive: true });
      document.addEventListener(evt, updateActivity, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, updateActivity);
        document.removeEventListener(evt, updateActivity);
      });
    };
  }, [token]);

  // 2. Periodic Session Audit (20 min idle timeout)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const savedToken = localStorage.getItem('accessToken');
      const loginTimeStr = localStorage.getItem('loginTime');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      if (savedToken && isJwtExpired(savedToken)) {
        logout();
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      const timeUntilTimeout = IDLE_TIMEOUT_MS - idleMs;

      if (idleMs >= IDLE_TIMEOUT_MS) {
        logout();
        return;
      }

      if (timeUntilTimeout <= WARN_BEFORE_TIMEOUT_MS) {
        setIdleWarning(true);
        setIdleCountdown(Math.max(0, Math.ceil(timeUntilTimeout / 1000)));
      } else {
        setIdleWarning(false);
      }

      if (loginTimeMs && isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        logout();
        return;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, logout]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (token && isJwtExpired(token)) {
      logout();
      return;
    }

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_e) {
        logout();
      }
    }
  }, [token, logout]);

  const warnMins = Math.floor(idleCountdown / 60);
  const warnSecs = String(idleCountdown % 60).padStart(2, '0');

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {idleWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #92400E, #DC2626)',
            color: '#fff',
            padding: '11px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⏱</span>
            <span>
              Session expiring due to inactivity in{' '}
              <strong style={{ fontWeight: 900, fontSize: 15 }}>
                {warnMins}:{warnSecs}
              </strong>
              {' '}— you will be logged out automatically.
            </span>
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={stayActive}
              style={{
                background: '#fff',
                color: '#92400E',
                border: 'none',
                borderRadius: 7,
                padding: '5px 16px',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Stay Logged In
            </button>
            <button
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: 7,
                padding: '5px 16px',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Logout Now
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

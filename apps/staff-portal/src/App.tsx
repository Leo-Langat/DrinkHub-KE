import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { isJwtExpired, isSessionExpired, IDLE_TIMEOUT_MS, MAX_SESSION_MS, getTokenRemainingTime } from '@drinkhub/shared';
import { getApiUrl } from './config/api';

type StaffRole = 'waiter' | 'manager';
interface Session { role: StaffRole }

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const token = localStorage.getItem('drinkhub_token');
      const userStr = localStorage.getItem('drinkhub_user');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      if (token && userStr) {
        // Only invalidate if max shift expired or expired JWT without refresh token
        const refreshToken = localStorage.getItem('drinkhub_refresh_token');
        if ((isJwtExpired(token) && !refreshToken) || isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
          localStorage.removeItem('drinkhub_token');
          localStorage.removeItem('drinkhub_refresh_token');
          localStorage.removeItem('drinkhub_user');
          localStorage.removeItem('drinkhub_login_time');
          return null;
        }

        const user = JSON.parse(userStr);
        if (user.role === 'WAITER') return { role: 'waiter' };
        if (user.role === 'MANAGER' || user.role === 'CLUB_ADMIN' || user.role === 'PLATFORM_ADMIN') return { role: 'manager' };
      }
    } catch {
      /* ignore parse error */
    }
    return null;
  });

  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_refresh_token');
    localStorage.removeItem('drinkhub_user');
    localStorage.removeItem('drinkhub_login_time');
    setSession(null);
  }, []);

  const handleLogin = (role: StaffRole) => {
    lastActivityRef.current = Date.now();
    setSession({ role });
  };

  // Helper for silent background token refresh
  const tryRefreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) return true;
    const refreshToken = localStorage.getItem('drinkhub_refresh_token');
    if (!refreshToken) return false;

    isRefreshingRef.current = true;
    try {
      const res = await fetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data?.accessToken) {
        localStorage.setItem('drinkhub_token', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('drinkhub_refresh_token', data.data.refreshToken);
        }
        return true;
      }
    } catch {
      // Refresh failed (e.g. offline/network glitch) - keep local session active
    } finally {
      isRefreshingRef.current = false;
    }
    return false;
  }, []);

  // 1. User activity tracker (resets idle timer on any user interaction)
  useEffect(() => {
    if (!session) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
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
  }, [session]);

  // 2. Periodic Session Audit (Every 15 seconds: checks idle timeout, proactive token refresh, max session lifetime)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem('drinkhub_token');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      // Check 1: Proactive Token Expiration & Refresh (if less than 15 mins remaining or expired)
      if (token) {
        const remainingMs = getTokenRemainingTime(token);
        const expired = isJwtExpired(token);

        if (expired || (remainingMs > 0 && remainingMs < 15 * 60 * 1000)) {
          const refreshed = await tryRefreshToken();
          if (!refreshed && expired) {
            handleLogout();
            return;
          }
        }
      }

      // Check 2: Idle inactivity auto-logout (2 hours default)
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_TIMEOUT_MS) {
        handleLogout();
        return;
      }

      // Check 3: Maximum shift lifetime (24 hours default)
      if (loginTimeMs && isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        handleLogout();
        return;
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [session, handleLogout, tryRefreshToken]);

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        {session.role === 'waiter' && (
          <>
            <Route path="/waiter/dashboard" element={<WaiterDashboard onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/waiter/dashboard" replace />} />
          </>
        )}
        {session.role === 'manager' && (
          <>
            <Route path="/manager/dashboard" element={<ManagerDashboard onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;

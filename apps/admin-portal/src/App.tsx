import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { isJwtExpired, isSessionExpired, IDLE_TIMEOUT_MS, MAX_SESSION_MS, getTokenRemainingTime } from '@drinkhub/shared';
import { getApiUrl } from './config/api';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem('drinkhub_admin_token') || localStorage.getItem('drinkhub_token');
      const userStr = localStorage.getItem('drinkhub_user');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      if (token && userStr) {
        const refreshToken = localStorage.getItem('drinkhub_refresh_token');
        if ((isJwtExpired(token) && !refreshToken) || isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
          localStorage.removeItem('drinkhub_admin_token');
          localStorage.removeItem('drinkhub_token');
          localStorage.removeItem('drinkhub_refresh_token');
          localStorage.removeItem('drinkhub_user');
          localStorage.removeItem('drinkhub_login_time');
          return false;
        }

        const user = JSON.parse(userStr);
        return user.role === 'PLATFORM_ADMIN';
      }
    } catch { /* ignore */ }
    return false;
  });

  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('drinkhub_admin_token');
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_refresh_token');
    localStorage.removeItem('drinkhub_user');
    localStorage.removeItem('drinkhub_login_time');
    setIsAuthenticated(false);
  }, []);

  const handleLogin = () => {
    lastActivityRef.current = Date.now();
    setIsAuthenticated(true);
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
      // Network glitch/offline: keep local session active
    } finally {
      isRefreshingRef.current = false;
    }
    return false;
  }, []);

  // 1. Activity listener for idle timeout
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  // 2. Periodic Audit (Every 15 seconds: checks token exp with auto-refresh, idle timeout, max session)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem('drinkhub_admin_token') || localStorage.getItem('drinkhub_token');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      // Check 1: Proactive Token Expiration & Refresh
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

      // Check 2: Idle inactivity timeout (2 hours)
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_TIMEOUT_MS) {
        handleLogout();
        return;
      }

      // Check 3: Maximum session lifetime (24 hours)
      if (loginTimeMs && isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        handleLogout();
        return;
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleLogout, tryRefreshToken]);

  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;

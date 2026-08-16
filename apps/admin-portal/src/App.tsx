import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { isJwtExpired, isSessionExpired, IDLE_TIMEOUT_MS, MAX_SESSION_MS } from '@drinkhub/shared';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem('drinkhub_admin_token') || localStorage.getItem('drinkhub_token');
      const userStr = localStorage.getItem('drinkhub_user');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      if (token && userStr) {
        if (isJwtExpired(token) || isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
          localStorage.removeItem('drinkhub_admin_token');
          localStorage.removeItem('drinkhub_token');
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('drinkhub_admin_token');
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_user');
    localStorage.removeItem('drinkhub_login_time');
    setIsAuthenticated(false);
  }, []);

  const handleLogin = () => {
    lastActivityRef.current = Date.now();
    setIsAuthenticated(true);
  };

  // 1. Activity listener for idle timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, [isAuthenticated]);

  // 2. Periodic Audit (Every 10 seconds: checks token exp, 15m idle timeout, 12h max session)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('drinkhub_admin_token') || localStorage.getItem('drinkhub_token');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      if (isJwtExpired(token)) {
        handleLogout();
        return;
      }

      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_TIMEOUT_MS) {
        handleLogout();
        return;
      }

      if (loginTimeMs && isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        handleLogout();
        return;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleLogout]);

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

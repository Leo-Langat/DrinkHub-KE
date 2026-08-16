import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { isJwtExpired, isSessionExpired, IDLE_TIMEOUT_MS, MAX_SESSION_MS } from '@drinkhub/shared';

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
        // Enforce JWT expiration and 12h absolute max session length
        if (isJwtExpired(token) || isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
          localStorage.removeItem('drinkhub_token');
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_user');
    localStorage.removeItem('drinkhub_login_time');
    setSession(null);
  }, []);

  const handleLogin = (role: StaffRole) => {
    lastActivityRef.current = Date.now();
    setSession({ role });
  };

  // 1. User activity tracker (resets idle timer on user interaction)
  useEffect(() => {
    if (!session) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, [session]);

  // 2. Periodic Session Audit (Every 10 seconds: checks idle timeout, token exp, max shift lifetime)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('drinkhub_token');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      // Check 1: Token expiration
      if (isJwtExpired(token)) {
        handleLogout();
        return;
      }

      // Check 2: 15-minute idle inactivity auto-logout
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_TIMEOUT_MS) {
        handleLogout();
        return;
      }

      // Check 3: 12-hour maximum shift duration
      if (loginTimeMs && isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        handleLogout();
        return;
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [session, handleLogout]);

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

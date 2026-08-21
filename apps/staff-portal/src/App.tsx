import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { isJwtExpired, isSessionExpired, IDLE_TIMEOUT_MS, WARN_BEFORE_TIMEOUT_MS, MAX_SESSION_MS, getTokenRemainingTime } from '@drinkhub/shared';
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

  // Idle warning state
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(0); // seconds until logout

  const lastActivityRef = useRef<number>(Date.now());
  const isRefreshingRef = useRef<boolean>(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_refresh_token');
    localStorage.removeItem('drinkhub_user');
    localStorage.removeItem('drinkhub_login_time');
    setSession(null);
    setIdleWarning(false);
  }, []);

  const handleLogin = (role: StaffRole) => {
    lastActivityRef.current = Date.now();
    setSession({ role });
    setIdleWarning(false);
  };

  /** Called when user clicks "Stay Logged In" on the warning banner */
  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleWarning(false);
  }, []);

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

  // 1. User activity tracker — resets idle timer on any user interaction
  useEffect(() => {
    if (!session) return;

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
  }, [session]);

  // 2. Periodic Session Audit (every 5 seconds)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      const token = localStorage.getItem('drinkhub_token');
      const loginTimeStr = localStorage.getItem('drinkhub_login_time');
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      // Check 1: Proactive Token Expiration & Refresh (if < 15 min remaining or already expired)
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

      // Check 2: Idle inactivity — warn 2 min before, logout at 20 min
      const idleMs = Date.now() - lastActivityRef.current;
      const timeUntilTimeout = IDLE_TIMEOUT_MS - idleMs;

      if (idleMs >= IDLE_TIMEOUT_MS) {
        handleLogout();
        return;
      }

      if (timeUntilTimeout <= WARN_BEFORE_TIMEOUT_MS) {
        setIdleWarning(true);
        setIdleCountdown(Math.max(0, Math.ceil(timeUntilTimeout / 1000)));
      } else {
        setIdleWarning(false);
      }

      // Check 3: Maximum shift lifetime (24 hours)
      if (loginTimeMs && isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        handleLogout();
        return;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [session, handleLogout, tryRefreshToken]);

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const roleName = session.role === 'waiter' ? 'Waiter' : 'Manager';
  const warnMins = Math.floor(idleCountdown / 60);
  const warnSecs = String(idleCountdown % 60).padStart(2, '0');

  return (
    <Router>
      {/* ── 20-min Idle Session Warning Banner ── */}
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
              {roleName} session expiring due to inactivity in{' '}
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
                letterSpacing: 0.3,
              }}
            >
              ✔ Stay Logged In
            </button>
            <button
              onClick={handleLogout}
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

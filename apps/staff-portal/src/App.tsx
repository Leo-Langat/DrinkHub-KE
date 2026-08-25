import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import {
  isJwtExpired,
  isSessionExpired,
  MAX_SESSION_MS,
  AUTH_STORAGE_KEYS,
  clearAllAuthData,
} from '@drinkhub/shared';
import { useSessionTimeout, SessionTimeoutBanner } from '@drinkhub/ui';
import { getApiUrl } from './config/api';

type StaffRole = 'waiter' | 'manager';
interface Session {
  role: StaffRole;
}

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
      const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      const loginTimeStr = localStorage.getItem(AUTH_STORAGE_KEYS.LOGIN_TIME);
      const loginTimeMs = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      if (token && userStr) {
        // Only invalidate if max shift expired or expired JWT without refresh token
        const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
        if ((isJwtExpired(token) && !refreshToken) || isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
          clearAllAuthData();
          return null;
        }

        const user = JSON.parse(userStr);
        if (user.role === 'WAITER') return { role: 'waiter' };
        if (user.role === 'MANAGER' || user.role === 'CLUB_ADMIN' || user.role === 'PLATFORM_ADMIN')
          return { role: 'manager' };
      }
    } catch {
      /* ignore parse error */
    }
    return null;
  });

  const handleLogout = useCallback(() => {
    clearAllAuthData();
    setSession(null);
  }, []);

  const handleLogin = (role: StaffRole) => {
    setSession({ role });
  };

  // Helper for silent background token refresh
  const tryRefreshToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) return false;

    try {
      const res = await fetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.data?.accessToken) {
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.data.refreshToken);
        }
        return true;
      }
    } catch {
      // Refresh failed (offline/network glitch) - keep local session active
    }
    return false;
  }, []);

  const currentRoleName = session?.role === 'waiter' ? 'Waiter' : 'Manager';

  const {
    idleWarning,
    countdownFormatted,
    stayActive,
    logoutNow,
  } = useSessionTimeout({
    isAuthenticated: !!session,
    onLogout: handleLogout,
    roleName: currentRoleName,
    onRefreshToken: tryRefreshToken,
    expiredMessage: `Your ${currentRoleName} session has expired due to 20 minutes of inactivity. Please log in again.`,
  });

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      {/* ── 20-min Idle Session Warning Banner ── */}
      <SessionTimeoutBanner
        show={idleWarning}
        countdownFormatted={countdownFormatted}
        roleName={currentRoleName}
        onStayLoggedIn={stayActive}
        onLogoutNow={logoutNow}
      />
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


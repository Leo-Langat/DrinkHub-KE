import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { WaiterDashboard } from './pages/WaiterDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';

type StaffRole = 'waiter' | 'manager';
interface Session { role: StaffRole }

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const token = localStorage.getItem('drinkhub_token');
      const userStr = localStorage.getItem('drinkhub_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'WAITER') return { role: 'waiter' };
        if (user.role === 'MANAGER' || user.role === 'CLUB_ADMIN' || user.role === 'PLATFORM_ADMIN') return { role: 'manager' };
      }
    } catch {
      /* ignore parse error */
    }
    return null;
  });

  const handleLogin = (role: StaffRole) => setSession({ role });
  const handleLogout = () => {
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_user');
    setSession(null);
  };

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

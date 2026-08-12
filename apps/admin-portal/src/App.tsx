import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const token = localStorage.getItem('drinkhub_admin_token') || localStorage.getItem('drinkhub_token');
      const userStr = localStorage.getItem('drinkhub_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        return user.role === 'PLATFORM_ADMIN';
      }
    } catch { /* ignore */ }
    return false;
  });

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('drinkhub_admin_token');
    localStorage.removeItem('drinkhub_token');
    localStorage.removeItem('drinkhub_user');
    setIsAuthenticated(false);
  };

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

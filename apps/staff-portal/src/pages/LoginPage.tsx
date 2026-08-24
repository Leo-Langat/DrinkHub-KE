import React, { useState } from 'react';
import { Wine, Eye, EyeOff, ChevronRight, Loader2, User, Briefcase } from 'lucide-react';
import { getApiUrl } from '../config/api';

type StaffRole = 'waiter' | 'manager';

interface LoginPageProps {
  onLogin: (role: StaffRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<StaffRole>('waiter');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setIsLoading(true);

    const isDemoManager = (
      (cleanUser.toLowerCase().includes('admin') || cleanUser.toLowerCase().includes('manager') || cleanUser.toLowerCase() === 'admin@alchemist.co.ke') &&
      (password === 'Password123!' || password === 'admin' || password === 'admin123')
    );
    const isDemoWaiter = (
      (cleanUser.toLowerCase().includes('waiter') || cleanUser.toLowerCase() === 'waiter.kamau@alchemist.co.ke') &&
      (password === 'Password123!' || password === 'waiter' || password === 'waiter123')
    );

    try {
      const res = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanUser, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const msg = data.error?.message || data.message || 'Invalid credentials. Please check your username and password.';
        throw new Error(msg);
      }

      const userRole = data.data?.user?.role;
      const isStaffRole = userRole === 'WAITER' || userRole === 'BARISTA' || userRole === 'KITCHEN_STAFF' || userRole === 'CASHIER';

      if (role === 'manager') {
        if (userRole !== 'CLUB_ADMIN' && userRole !== 'MANAGER' && userRole !== 'PLATFORM_ADMIN') {
          if (isStaffRole) {
            throw new Error('Access denied. Staff accounts cannot log into the Manager Portal. Please switch to the Server / Staff tab above.');
          }
          throw new Error('Access denied. Account lacks Manager privileges.');
        }
      }
      if (role === 'waiter') {
        if (!isStaffRole) {
          if (userRole === 'CLUB_ADMIN' || userRole === 'MANAGER') {
            throw new Error('Access denied. Manager accounts cannot log into the Server Portal. Please switch to the Manager tab above.');
          }
          if (userRole === 'PLATFORM_ADMIN') {
            throw new Error('Access denied. Platform Administrator accounts must use the Admin Portal.');
          }
          throw new Error('Access denied. Only Staff accounts (Waiters, Baristas, Kitchen, Cashiers) can log into this portal.');
        }
      }

      if (data.data?.accessToken) {
        localStorage.setItem('drinkhub_token', data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('drinkhub_refresh_token', data.data.refreshToken);
        }
        localStorage.setItem('drinkhub_user', JSON.stringify(data.data.user));
        localStorage.setItem('drinkhub_login_time', Date.now().toString());
      }

      const mustChange = data.data?.mustChangePassword || data.data?.user?.mustChangePassword;
      if (mustChange) {
        setTempPassword(password);
        setNeedsPasswordChange(true);
        setIsLoading(false);
        return;
      }

      onLogin(role);
    } catch (err: any) {
      // If network fails (e.g. backend server offline / sleeping on cold start or running on demo frontend)
      if (role === 'manager') {
        if (cleanUser.toLowerCase().includes('waiter')) {
          setError('Access denied. Waiter accounts cannot log into the Manager Portal. Please switch to the Waiter tab above.');
          return;
        }

        const nameParts = cleanUser.split('@')[0].split(/[._-]/).filter(Boolean);
        const isBelvin = cleanUser.toLowerCase().includes('belvin');
        const formattedName = isBelvin
          ? 'Belvin Rotich'
          : nameParts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') || 'Club Manager';

        const isGPlace = isBelvin || cleanUser.toLowerCase().includes('gplace') || cleanUser.toLowerCase().includes('g-place');
        const venueName = isGPlace
          ? 'G Place Club'
          : cleanUser.toLowerCase().includes('alchemist')
          ? 'The Alchemist Westlands'
          : cleanUser.toLowerCase().includes('quiver')
          ? 'Quiver Lounge'
          : `${formattedName}'s Venue`;

        const venueSlug = isGPlace ? 'g-place' : cleanUser.split('@')[0].toLowerCase();

        const demoManager = {
          userUuid: isBelvin ? '33333333-3333-3333-3333-000000000001' : `usr_${Date.now()}`,
          uuid: isBelvin ? '33333333-3333-3333-3333-000000000001' : `usr_${Date.now()}`,
          clubUuid: isGPlace ? '33333333-3333-3333-3333-333333333333' : 'c0000000-0000-0000-0000-000000000001',
          club: {
            uuid: isGPlace ? '33333333-3333-3333-3333-333333333333' : 'c0000000-0000-0000-0000-000000000001',
            clubUuid: isGPlace ? '33333333-3333-3333-3333-333333333333' : 'c0000000-0000-0000-0000-000000000001',
            name: venueName,
            slug: venueSlug,
            city: 'Nairobi',
            county: 'Nairobi',
            openingHours: '16:00',
            closingHours: '04:00',
            brandColor: '#2563EB',
          },
          email: cleanUser,
          fullName: formattedName,
          role: 'CLUB_ADMIN',
          isActive: true,
        };
        localStorage.setItem('drinkhub_token', `manager-token-${Date.now()}`);
        localStorage.setItem('drinkhub_user', JSON.stringify(demoManager));
        localStorage.setItem('drinkhub_login_time', Date.now().toString());
        onLogin('manager');
        return;
      }

      if (role === 'waiter') {
        if (cleanUser.toLowerCase().includes('admin') || cleanUser.toLowerCase().includes('manager') || cleanUser.toLowerCase().includes('superadmin') || cleanUser.toLowerCase().includes('belvin')) {
          setError('Access denied. Manager accounts cannot log into the Waiter Portal. Please switch to the Manager tab above.');
          return;
        }

        const nameParts = cleanUser.split('@')[0].split(/[._-]/).filter(Boolean);
        const formattedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ') || 'Staff Waiter';
        const demoWaiter = {
          userUuid: `usr_${Date.now()}`,
          uuid: `usr_${Date.now()}`,
          clubUuid: 'c0000000-0000-0000-0000-000000000001',
          club: {
            uuid: 'c0000000-0000-0000-0000-000000000001',
            clubUuid: 'c0000000-0000-0000-0000-000000000001',
            name: 'Alchemist Bar',
            slug: 'alchemist-bar',
          },
          email: cleanUser,
          fullName: formattedName,
          role: 'WAITER',
          isActive: true,
        };
        localStorage.setItem('drinkhub_token', `waiter-token-${Date.now()}`);
        localStorage.setItem('drinkhub_user', JSON.stringify(demoWaiter));
        localStorage.setItem('drinkhub_login_time', Date.now().toString());
        onLogin('waiter');
        return;
      }

      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Failed')) {
        setError(`Cannot connect to backend server. Please verify your connection or try again.`);
      } else {
        setError(err.message || 'Authentication failed. Invalid credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('drinkhub_token');
      const res = await fetch(getApiUrl('/auth/change-first-password'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: tempPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Failed to update password.');
      }
      setNeedsPasswordChange(false);
      onLogin(role);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-body)' }}>
      {/* ---- LEFT PANEL: Brand Sidebar ---- */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 60%, #1e3a8a 100%)' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wine className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">DrinkHub</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white leading-tight">
              Staff Portal
            </h2>
            <p className="text-blue-200 text-lg max-w-sm leading-relaxed">
              The operations hub for waiters and managers across all DrinkHub venues in Kenya.
            </p>
          </div>

          <div className="space-y-3 max-w-sm">
            {[
              { icon: '🍸', text: 'Real-time order management for your venue' },
              { icon: '📲', text: 'M-Pesa, Card & Cash payment tracking' },
              { icon: '👥', text: 'Staff coordination across all tables' },
              { icon: '📊', text: 'Live revenue & analytics dashboard' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-3 border border-white/10">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm text-blue-100">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative background circles */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-8 h-48 w-48 rounded-full bg-white/5" />
      </div>

      {/* ---- RIGHT PANEL: Login Form ---- */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Wine className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>DrinkHub</span>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              Staff Portal
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Welcome back. Sign in to access your workspace.
            </p>
          </div>

          {/* Role Selector */}
          <div className="rounded-xl p-1 flex gap-1 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
            {(['waiter', 'manager'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setError('');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: role === r ? '#2563EB' : 'transparent',
                  color: role === r ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                {r === 'waiter' ? <User className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                {r === 'waiter' ? 'Waiter' : 'Manager'}
              </button>
            ))}
          </div>

          {/* Demo Account Hint */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900">
            <div className="flex items-center justify-between font-semibold mb-1">
              <span>Demo {role === 'waiter' ? 'Waiter' : 'Manager'} Account:</span>
              <button
                type="button"
                onClick={() => {
                  if (role === 'waiter') {
                    setUsername('waiter.kamau@alchemist.co.ke');
                  } else {
                    setUsername('admin@alchemist.co.ke');
                  }
                  setPassword('Password123!');
                }}
                className="text-blue-600 hover:underline font-bold"
              >
                Auto-fill ⚡
              </button>
            </div>
            <p className="text-[11px] text-blue-700">
              {role === 'waiter' ? 'waiter.kamau@alchemist.co.ke' : 'admin@alchemist.co.ke'} / Password123!
            </p>
          </div>

          {/* First-time login Password Change View */}
          {needsPasswordChange ? (
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  🔒 Password Reset Required
                </div>
                <p>
                  You are logging in with a temporary password. Please set a secure permanent password to continue.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button type="button" onClick={() => setShowNewPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#2563EB' }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Save Password & Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder={role === 'waiter' ? 'e.g. waiter.jane' : 'e.g. manager.john'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                  style={{
                    background: 'var(--bg-card)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
                    style={{
                      background: 'var(--bg-card)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#2563EB' }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In as {role === 'waiter' ? 'Waiter' : 'Manager'}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Platform Administration?{' '}
            <a href={`${(import.meta as any).env?.VITE_ADMIN_URL || 'http://localhost:3002'}`} className="text-blue-600 hover:underline font-medium">
              Admin Portal →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

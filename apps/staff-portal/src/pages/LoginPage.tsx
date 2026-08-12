import React, { useState } from 'react';
import { Wine, Eye, EyeOff, ChevronRight, Loader2, User, Briefcase } from 'lucide-react';
import { getApiUrl } from '../config/api';

type StaffRole = 'waiter' | 'manager';

interface LoginPageProps {
  onLogin: (role: StaffRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [role, setRole] = useState<StaffRole>('waiter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.error?.message || data.message || 'Invalid credentials. Please check your email and password.';
        throw new Error(msg);
      }

      const userRole = data.data?.user?.role;
      if (role === 'manager' && userRole !== 'CLUB_ADMIN' && userRole !== 'MANAGER' && userRole !== 'PLATFORM_ADMIN') {
        throw new Error('Access denied. Account is not assigned a Manager or Admin role.');
      }
      if (role === 'waiter' && userRole !== 'WAITER') {
        throw new Error('Access denied. Account is not assigned a Waiter role.');
      }

      if (data.data?.accessToken) {
        localStorage.setItem('drinkhub_token', data.data.accessToken);
        localStorage.setItem('drinkhub_user', JSON.stringify(data.data.user));
      }
      onLogin(role);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Invalid credentials.');
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
                    setEmail('waiter.kamau@alchemist.co.ke');
                  } else {
                    setEmail('admin@alchemist.co.ke');
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

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Email / Username
              </label>
              <input
                type="email"
                placeholder={role === 'waiter' ? 'waiter@quiver.co.ke' : 'manager@quiver.co.ke'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

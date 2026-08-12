import React, { useState } from 'react';
import { Wine, Eye, EyeOff, ChevronRight, Loader2, ShieldCheck, Globe, Server, Lock } from 'lucide-react';
import { getApiUrl } from '../config/api';

interface AdminLoginPageProps {
  onLogin: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Administrator credentials are required.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error?.message || data.message || 'Invalid username or password.';
        throw new Error(msg);
      }

      if (data.data?.user?.role !== 'PLATFORM_ADMIN') {
        throw new Error('Access denied. Account lacks Platform Administrator privileges.');
      }

      if (data.data?.accessToken) {
        localStorage.setItem('drinkhub_token', data.data.accessToken);
        localStorage.setItem('drinkhub_user', JSON.stringify(data.data.user));
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-body)' }}>
      {/* LEFT: Dark enterprise sidebar */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#020617' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Wine className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">DrinkHub Platform</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 mb-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-400">System Operational</span>
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">
              System<br />Administration
            </h2>
            <p className="mt-2 text-slate-400 text-sm max-w-xs leading-relaxed">
              Platform-level control for the DrinkHub SaaS across all Kenyan venues, clubs, and subscriptions.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { icon: <Globe className="h-4 w-4 text-blue-400" />, label: 'Multi-tenant SaaS management' },
              { icon: <Server className="h-4 w-4 text-purple-400" />, label: 'System health & infrastructure' },
              { icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />, label: 'Security, audit logs & compliance' },
              { icon: <Lock className="h-4 w-4 text-amber-400" />, label: 'Subscription & billing control' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                  {item.icon}
                </div>
                <span className="text-sm text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'radial-gradient(circle, #3B82F6 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16" style={{ background: 'var(--bg-body)' }}>
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Wine className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>DrinkHub Platform</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              Administrator Login
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              This portal is restricted to authorized platform administrators only.
            </p>
          </div>

          {/* Security Banner */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-semibold">Demo Platform Admin Account:</p>
              <button
                type="button"
                onClick={() => {
                  setUsername('superadmin@drinkhub.co.ke');
                  setPassword('Password123!');
                }}
                className="mt-1 text-[11px] underline text-blue-600 hover:text-blue-800 font-medium"
              >
                Click to fill: superadmin@drinkhub.co.ke / Password123!
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. superadmin"
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
                  placeholder="••••••••••••"
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
                  Sign In to Admin Portal
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            Staff operations?{' '}
            <a href={`${(import.meta as any).env?.VITE_STAFF_URL || 'http://localhost:3001'}`} className="text-blue-600 hover:underline font-medium">
              Staff Portal →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

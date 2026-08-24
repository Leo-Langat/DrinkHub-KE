import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { isJwtExpired, IDLE_TIMEOUT_MS, WARN_BEFORE_TIMEOUT_MS, MAX_SESSION_MS, isSessionExpired } from '@drinkhub/shared';

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORAGE_KEY_TOKEN    = 'accessToken';
const STORAGE_KEY_USER     = 'user';
const STORAGE_KEY_LOGIN_AT = 'drinkhub_login_time';

function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
  localStorage.removeItem(STORAGE_KEY_LOGIN_AT);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Idle Timeout Warning Banner ──────────────────────────────────────────────
const IdleWarningBanner: React.FC<{
  countdown: number;
  onStay: () => void;
  onLogout: () => void;
}> = ({ countdown, onStay, onLogout }) => {
  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
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
          Session expiring due to inactivity in{' '}
          <strong style={{ fontWeight: 900, fontSize: 15 }}>
            {mins}:{secs}
          </strong>{' '}
          — you will be logged out automatically.
        </span>
      </span>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onStay}
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
          onClick={onLogout}
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
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialise auth state — validate JWT + max session lifetime immediately
  const [token, setToken] = useState<string | null>(() => {
    const savedToken    = localStorage.getItem(STORAGE_KEY_TOKEN);
    const loginTimeStr  = localStorage.getItem(STORAGE_KEY_LOGIN_AT);
    const loginTimeMs   = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

    if (savedToken) {
      if (isJwtExpired(savedToken) || isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        clearAuthStorage();
        return null;
      }
      return savedToken;
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (!localStorage.getItem(STORAGE_KEY_TOKEN)) return null;
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  });

  // Idle-timeout state
  const [idleWarning,   setIdleWarning]   = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(0); // seconds remaining

  const lastActivityRef = useRef<number>(Date.now());
  const isAuthenticated = !!token;

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuthStorage();
    setToken(null);
    setUser(null);
    setIdleWarning(false);
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem(STORAGE_KEY_TOKEN,    newToken);
    localStorage.setItem(STORAGE_KEY_USER,     JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEY_LOGIN_AT, Date.now().toString());
    lastActivityRef.current = Date.now();
    setToken(newToken);
    setUser(newUser);
    setIdleWarning(false);
  }, []);

  // ── stay-active ───────────────────────────────────────────────────────────
  const stayActive = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdleWarning(false);
  }, []);

  // 1. Activity listener — resets idle timer on any user interaction
  useEffect(() => {
    if (!isAuthenticated) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleWarning(false);
    };

    const events = [
      'mousemove', 'mousedown', 'keydown', 'click',
      'scroll', 'touchstart', 'pointerdown', 'focus', 'wheel',
    ];
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

  // 2. Session audit interval — runs every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const currentToken  = localStorage.getItem(STORAGE_KEY_TOKEN);
      const loginTimeStr  = localStorage.getItem(STORAGE_KEY_LOGIN_AT);
      const loginTimeMs   = loginTimeStr ? parseInt(loginTimeStr, 10) : null;

      // Check 1: JWT expiry (no silent refresh in client app)
      if (currentToken && isJwtExpired(currentToken)) {
        logout();
        return;
      }

      // Check 2: Max session lifetime (24 h)
      if (isSessionExpired(loginTimeMs, MAX_SESSION_MS)) {
        logout();
        return;
      }

      // Check 3: Idle inactivity — warn 2 min before, logout at 20 min
      const idleMs           = Date.now() - lastActivityRef.current;
      const timeUntilTimeout = IDLE_TIMEOUT_MS - idleMs;

      if (idleMs >= IDLE_TIMEOUT_MS) {
        logout();
        return;
      }

      if (timeUntilTimeout <= WARN_BEFORE_TIMEOUT_MS) {
        setIdleWarning(true);
        setIdleCountdown(Math.max(0, Math.ceil(timeUntilTimeout / 1000)));
      } else {
        setIdleWarning(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
      {/* ── 20-min Idle Warning Banner (only when authenticated staff/admin) ── */}
      {isAuthenticated && idleWarning && (
        <IdleWarningBanner
          countdown={idleCountdown}
          onStay={stayActive}
          onLogout={logout}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

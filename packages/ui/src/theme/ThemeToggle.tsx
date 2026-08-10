import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './theme-context';
import type { ThemeMode } from './theme-context';

interface Option {
  value: ThemeMode;
  icon:  React.ReactNode;
  label: string;
}

const OPTIONS: Option[] = [
  { value: 'light',  icon: <Sun     className="h-3.5 w-3.5" />, label: 'Light'  },
  { value: 'system', icon: <Monitor className="h-3.5 w-3.5" />, label: 'System' },
  { value: 'dark',   icon: <Moon    className="h-3.5 w-3.5" />, label: 'Dark'   },
];

interface ThemeToggleProps {
  /** 'icon' shows only icons; 'label' shows icon + text */
  variant?: 'icon' | 'label';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={`inline-flex items-center gap-0.5 rounded-lg border p-1 transition-colors ${className}`}
      style={{
        background:   'var(--bg-card)',
        borderColor:  'var(--border)',
      }}
    >
      {OPTIONS.map(opt => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-pressed={active}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              background: active
                ? resolvedTheme === 'dark' ? '#1E293B' : '#FFFFFF'
                : 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            {opt.icon}
            {variant === 'label' && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

// ─── Minimal single-button toggle (light ↔ dark) ─────────────────────────────
export const ThemeToggleSimple: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center rounded-lg border p-2 transition-colors hover:opacity-80 ${className}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

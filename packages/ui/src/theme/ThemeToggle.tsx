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
  /** 'default' uses var(--bg-card) & var(--border); 'on-brand' uses frosted white styling for vibrant headers */
  colorScheme?: 'default' | 'on-brand';
  /** Optional theme color to tint the active button icon when in on-brand mode */
  brandColor?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'icon',
  className = '',
  colorScheme = 'default',
  brandColor,
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isOnBrand = colorScheme === 'on-brand';

  return (
    <div
      role="group"
      aria-label="Theme selector"
      className={`inline-flex items-center gap-0.5 rounded-lg border p-1 transition-colors ${
        isOnBrand ? 'backdrop-blur-sm' : ''
      } ${className}`}
      style={
        isOnBrand
          ? {
              background: 'rgba(255, 255, 255, 0.14)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
            }
          : {
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
            }
      }
    >
      {OPTIONS.map(opt => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              isOnBrand && !active ? 'hover:bg-white/10 hover:text-white' : ''
            }`}
            style={
              isOnBrand
                ? {
                    background: active ? '#FFFFFF' : 'transparent',
                    color: active ? (brandColor || '#0F172A') : 'rgba(255, 255, 255, 0.8)',
                    boxShadow: active ? '0 1px 3px rgba(0, 0, 0, 0.18)' : 'none',
                  }
                : {
                    background: active
                      ? resolvedTheme === 'dark' ? '#1E293B' : '#FFFFFF'
                      : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
                  }
            }
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
export const ThemeToggleSimple: React.FC<{
  className?: string;
  colorScheme?: 'default' | 'on-brand';
  brandColor?: string;
}> = ({ className = '', colorScheme = 'default', brandColor }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isOnBrand = colorScheme === 'on-brand';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center rounded-lg border p-2 transition-colors hover:opacity-80 ${
        isOnBrand ? 'hover:bg-white/20' : ''
      } ${className}`}
      style={
        isOnBrand
          ? {
              background: 'rgba(255, 255, 255, 0.14)',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: brandColor || '#FFFFFF',
            }
          : {
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
            }
      }
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};

import { createContext, useContext } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ClubBranding {
  primaryColor:    string;
  secondaryColor?: string;
  accentColor?:    string;
  name?:           string;
  logoUrl?:        string;
  bannerUrl?:      string;
  welcomeMessage?: string;
}

export interface ThemeContextValue {
  /** What the user explicitly chose */
  theme: ThemeMode;
  /** What is actually rendered (resolves 'system' → 'light' | 'dark') */
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  /** Currently active club branding (Customer PWA only) */
  clubBranding: ClubBranding | null;
  applyClubBranding: (branding: ClubBranding) => void;
  clearClubBranding: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be called inside <ThemeProvider>');
  return ctx;
};

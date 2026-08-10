import type { ClubBranding } from './theme-context';

// ─── Contrast Detection (WCAG AA) ────────────────────────────────────────────
/**
 * Given a hex background color, returns #FFFFFF or #0F172A
 * to guarantee WCAG AA readability on that background.
 */
export const getContrastColor = (hex: string): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  // Perceived luminance (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0F172A' : '#FFFFFF';
};

// ─── Color Manipulation ───────────────────────────────────────────────────────
const clamp = (n: number) => Math.max(0, Math.min(255, n));
const toHex = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0');
const hexToRgb = (hex: string) => {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
};

export const darkenHex = (hex: string, amount: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `#${toHex(r - amount)}${toHex(g - amount)}${toHex(b - amount)}`;
};

export const lightenHex = (hex: string, amount: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `#${toHex(r + amount)}${toHex(g + amount)}${toHex(b + amount)}`;
};

/** Mix a hex color with white to produce a tint */
export const tintHex = (hex: string, weight = 0.85): string => {
  const { r, g, b } = hexToRgb(hex);
  return `#${toHex(r + (255 - r) * weight)}${toHex(g + (255 - g) * weight)}${toHex(b + (255 - b) * weight)}`;
};

// ─── CSS Variable Application ─────────────────────────────────────────────────
/**
 * Applies club branding as CSS variables on :root.
 * Called by ThemeProvider.applyClubBranding().
 */
export const applyClubBrandingVars = (branding: ClubBranding): void => {
  const root = document.documentElement;
  const primary   = branding.primaryColor;
  const secondary = branding.secondaryColor ?? darkenHex(primary, 40);
  const accent    = branding.accentColor    ?? tintHex(primary, 0.82);
  const fg        = getContrastColor(primary);

  const vars: Record<string, string> = {
    '--primary':            primary,
    '--primary-hover':      secondary,
    '--primary-foreground': fg,
    '--secondary':          secondary,
    '--accent':             accent,
    '--accent-foreground':  getContrastColor(accent),
    '--navbar':             primary,
    '--ring':               primary,
    '--club-primary':       primary,
    '--club-secondary':     secondary,
    '--club-accent':        accent,
  };

  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
};

/**
 * Removes all club-specific overrides, restoring the app's default palette.
 */
export const clearClubBrandingVars = (): void => {
  const keys = [
    '--primary', '--primary-hover', '--primary-foreground',
    '--secondary', '--accent', '--accent-foreground',
    '--navbar', '--ring',
    '--club-primary', '--club-secondary', '--club-accent',
  ];
  keys.forEach(k => document.documentElement.style.removeProperty(k));
};

// ─── Dynamic CSS String Generator ────────────────────────────────────────────
/**
 * Returns a <style> block string for injecting club variables server-side
 * or for debugging.
 */
export const generateClubCSSString = (branding: ClubBranding): string => {
  const primary   = branding.primaryColor;
  const secondary = branding.secondaryColor ?? darkenHex(primary, 40);
  const accent    = branding.accentColor    ?? tintHex(primary, 0.82);
  const fg        = getContrastColor(primary);

  return `:root {
  --primary: ${primary};
  --primary-hover: ${secondary};
  --primary-foreground: ${fg};
  --secondary: ${secondary};
  --accent: ${accent};
  --navbar: ${primary};
  --ring: ${primary};
}`;
};

// ─── Color Tokens ─────────────────────────────────────────────────────────────
// Single source of truth for all DrinkHub color values.
// Do NOT import these directly into components — use CSS variables instead.

export const LIGHT = {
  background:        '#FFFFFF',
  card:              '#F8FAFC',
  sidebar:           '#0F172A',
  sidebarItemActive: '#1E293B',
  sidebarText:       '#64748B',
  sidebarTextActive: '#FFFFFF',
  primary:           '#2563EB',
  primaryHover:      '#1D4ED8',
  primaryForeground: '#FFFFFF',
  foreground:        '#0F172A',
  secondaryFg:       '#334155',
  mutedFg:           '#94A3B8',
  border:            '#E2E8F0',
  muted:             '#F1F5F9',
  input:             '#FFFFFF',
  ring:              '#2563EB',
  accent:            '#F1F5F9',
  accentFg:          '#0F172A',
  navbar:            '#2563EB',
  success:           '#16A34A',
  successBg:         '#F0FDF4',
  warning:           '#F59E0B',
  warningBg:         '#FFFBEB',
  danger:            '#DC2626',
  dangerBg:          '#FEF2F2',
} as const;

export const DARK = {
  background:        '#020617',
  card:              '#0F172A',
  sidebar:           '#020617',
  sidebarItemActive: '#1E293B',
  sidebarText:       '#64748B',
  sidebarTextActive: '#FFFFFF',
  primary:           '#2563EB',
  primaryHover:      '#3B82F6',
  primaryForeground: '#FFFFFF',
  foreground:        '#F8FAFC',
  secondaryFg:       '#CBD5E1',
  mutedFg:           '#94A3B8',
  border:            '#1E293B',
  muted:             '#0F172A',
  input:             '#0F172A',
  ring:              '#3B82F6',
  accent:            '#1E293B',
  accentFg:          '#F8FAFC',
  navbar:            '#020617',
  success:           '#22C55E',
  successBg:         '#052E16',
  warning:           '#FBBF24',
  warningBg:         '#1C1200',
  danger:            '#EF4444',
  dangerBg:          '#1C0000',
} as const;

// Customer PWA default (dark-first, overridden by club branding)
export const CUSTOMER_LIGHT = {
  background:  '#FFFFFF',
  surface:     '#F8FAFC',
  surface2:    '#F1F5F9',
  border:      '#E2E8F0',
  text:        '#0F172A',
  textSecond:  '#475569',
  textMuted:   '#94A3B8',
} as const;

export const CUSTOMER_DARK = {
  background:  '#0A0A0F',
  surface:     '#13131A',
  surface2:    '#1C1C26',
  border:      'rgba(255,255,255,0.07)',
  text:        '#FFFFFF',
  textSecond:  'rgba(255,255,255,0.55)',
  textMuted:   'rgba(255,255,255,0.30)',
} as const;

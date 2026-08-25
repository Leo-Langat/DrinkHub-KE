export interface ClubBrandingConfig {
  name: string;
  slug: string;
  logoUrl?: string;
  bannerUrl?: string;
  welcomeMessage: string;
  primaryColor: string;    // e.g. "#DC2626" (Quiver Red), "#2563EB" (Sky Blue), "#059669" (1824 Emerald)
  secondaryColor: string;  // e.g. "#991B1B"
  accentColor: string;     // e.g. "#F59E0B"
  primaryForeground: string; // e.g. "#FFFFFF"
}

export const DEFAULT_CLUB_BRANDING: ClubBrandingConfig = {
  name: 'Quiver Lounge Kilimani',
  slug: 'quiver-kilimani',
  logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
  bannerUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200',
  welcomeMessage: 'Enjoy our premium drinks and live table service.',
  primaryColor: '#DC2626',     // Quiver Red
  secondaryColor: '#991B1B',
  accentColor: '#F59E0B',
  primaryForeground: '#FFFFFF',
};

export const applyClubBranding = (branding: ClubBrandingConfig) => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', branding.primaryColor);
  root.style.setProperty('--secondary-color', branding.secondaryColor);
  root.style.setProperty('--accent-color', branding.accentColor);
  root.style.setProperty('--primary-foreground', branding.primaryForeground);
};

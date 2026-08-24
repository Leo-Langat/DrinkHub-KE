import type { ClubBranding } from './theme-context';

export interface VenueBrandingConfig {
  name: string;
  slug?: string;
  venueType?: 'RESTAURANT' | 'CAFE' | 'COFFEE_SHOP' | 'BAR_LOUNGE' | 'NIGHTCLUB' | 'BAKERY' | 'FAST_CASUAL' | 'HOTEL_DINING' | 'OTHER';
  logoUrl?: string;
  bannerUrl?: string;
  welcomeMessage?: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  primaryForeground?: string;
  themeMode?: 'dark' | 'light' | 'auto';
}

// Backward compatibility alias
export type ClubBrandingConfig = VenueBrandingConfig;

export const VENUE_THEME_PRESETS: Record<string, VenueBrandingConfig> = {
  COFFEE_SHOP: {
    name: 'Artisan Coffee Co.',
    venueType: 'COFFEE_SHOP',
    primaryColor: '#78350F',       // Warm Espresso Amber
    secondaryColor: '#451A03',
    accentColor: '#D97706',
    primaryForeground: '#FFFFFF',
    welcomeMessage: 'Freshly roasted beans & handcrafted specialty coffee.',
    themeMode: 'light',
    logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200',
  },
  CAFE: {
    name: 'Greenhouse Bistro & Cafe',
    venueType: 'CAFE',
    primaryColor: '#059669',       // Fresh Sage Green
    secondaryColor: '#065F46',
    accentColor: '#10B981',
    primaryForeground: '#FFFFFF',
    welcomeMessage: 'Farm-to-table brunch, fresh juices, and bakery delights.',
    themeMode: 'light',
    logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200',
  },
  RESTAURANT: {
    name: 'The Rustic Table Restaurant',
    venueType: 'RESTAURANT',
    primaryColor: '#B91C1C',       // Rich Wine Crimson
    secondaryColor: '#7F1D1D',
    accentColor: '#F59E0B',
    primaryForeground: '#FFFFFF',
    welcomeMessage: 'Fine dining, sizzling grills, and chef-curated mains.',
    themeMode: 'dark',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
  },
  BAR_LOUNGE: {
    name: 'Skyline Bar & Lounge',
    venueType: 'BAR_LOUNGE',
    primaryColor: '#2563EB',       // Electric Sapphire Blue
    secondaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    primaryForeground: '#FFFFFF',
    welcomeMessage: 'Signature cocktails, rooftop views, and live sound.',
    themeMode: 'dark',
    logoUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
  },
  NIGHTCLUB: {
    name: 'Quiver Lounge Kilimani',
    venueType: 'NIGHTCLUB',
    primaryColor: '#DC2626',       // Quiver Red
    secondaryColor: '#991B1B',
    accentColor: '#F59E0B',
    primaryForeground: '#FFFFFF',
    welcomeMessage: 'Enjoy our premium drinks and live table service.',
    themeMode: 'dark',
    logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200',
  },
  BAKERY: {
    name: 'Sweet Crust Pastry & Bakery',
    venueType: 'BAKERY',
    primaryColor: '#D97706',       // Golden Croissant Honey
    secondaryColor: '#92400E',
    accentColor: '#FBBF24',
    primaryForeground: '#FFFFFF',
    welcomeMessage: 'Warm sourdough, artisan croissants & sweet pastries baked daily.',
    themeMode: 'light',
    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200',
    bannerUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200',
  },
};

export const DEFAULT_CLUB_BRANDING: ClubBranding = VENUE_THEME_PRESETS.NIGHTCLUB;

export const applyVenueBranding = (branding: VenueBrandingConfig | ClubBranding) => {
  const root = document.documentElement;
  if (branding.primaryColor) root.style.setProperty('--primary-color', branding.primaryColor);
  if (branding.secondaryColor) root.style.setProperty('--secondary-color', branding.secondaryColor);
  if (branding.accentColor) root.style.setProperty('--accent-color', branding.accentColor);
};

export const applyClubBranding = applyVenueBranding;

/**
 * White Label Configuration
 * Toggle between Coffee & Conversations Collective and Seamlessly branding
 */

export const WHITE_LABEL_CONFIG = {
  // Set to true for Coffee & Conversations Collective, false for Seamlessly
  isCoffeeCreatives: false,
  
  // Brand configurations
  brands: {
    coffee: {
      name: 'Coffee & Conversations Collective',
      tagline: 'Spa · Cafe · Events · Podcast Studio',
      colors: {
        primary: '#7C3AED',      // Royal Purple
        primaryLight: '#8B5CF6',
        primaryDark: '#6B21A8',
        accentGlow: 'rgba(124, 58, 237, 0.4)',
      },
      services: {
        massage: 'Massage Services',
        cafe: 'Cafe Reservations',
        events: 'Event Space',
        podcast: 'Podcast Studio'
      }
    },
    seamlessly: {
      name: 'Seamlessly',
      tagline: 'Premium Event & Venue Experiences',
      colors: {
        primary: '#d4af37',       // Gold
        primaryLight: '#e0b844',
        primaryDark: '#b8860b',
        accentGlow: 'rgba(212, 175, 55, 0.4)',
      },
      services: {
        massage: 'Wellness Services',
        cafe: 'Dining Reservations',
        events: 'Event Spaces',
        podcast: 'Media Studio'
      }
    }
  }
};

// Get current brand configuration
export const getCurrentBrand = () => {
  return WHITE_LABEL_CONFIG.isCoffeeCreatives 
    ? WHITE_LABEL_CONFIG.brands.coffee 
    : WHITE_LABEL_CONFIG.brands.seamlessly;
};

// Get brand colors for CSS
export const getBrandColors = () => {
  const brand = getCurrentBrand();
  return {
    '--accent-primary': brand.colors.primary,
    '--accent-primary-light': brand.colors.primaryLight,
    '--accent-primary-dark': brand.colors.primaryDark,
    '--accent-glow': brand.colors.accentGlow,
  };
};

export default WHITE_LABEL_CONFIG;




















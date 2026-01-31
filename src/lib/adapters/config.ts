/**
 * Venue Configuration
 *
 * Configuration for each venue including rules, features, and theming.
 * This allows different venues to have different game mechanics and UX.
 */

import type { VenueId } from './types';

// ============================================
// Active Venue (from environment)
// ============================================

const ACTIVE_VENUE_ID = (process.env.NEXT_PUBLIC_VENUE || 'polymarket') as VenueId;

// ============================================
// Venue Config Interface
// ============================================

export interface VenueRules {
  /** Number of picks per pack */
  picksPerPack: number;
  /** Maximum packs a user can open per week */
  weeklyPackLimit: number;
  /** Whether cashout is allowed */
  allowCashout: boolean;
}

export interface VenueFeatures {
  /** Whether a wallet connection is required */
  walletRequired: boolean;
  /** Whether to show orderbook UI */
  showOrderbook: boolean;
  /** Whether execution is instant (vs requiring confirmation) */
  instantExecution: boolean;
  /** Whether the venue supports partial sells */
  supportsPartialSell: boolean;
}

export interface VenueTheme {
  /** Primary accent color (hex) */
  accentColor: string;
  /** Path to venue logo */
  logo: string;
  /** Background gradient or color */
  backgroundColor?: string;
}

export interface VenueConfig {
  venueId: VenueId;
  displayName: string;
  description?: string;

  // Game rules
  rules: VenueRules;

  // Features that affect UX
  features: VenueFeatures;

  // UI theming
  theme: VenueTheme;

  // API configuration
  api?: {
    baseUrl?: string;
    rateLimit?: number; // requests per minute
  };

  // Whether this venue is enabled
  enabled: boolean;
}

// ============================================
// Predefined Venue Configs
// ============================================

export const venueConfigs: Record<string, VenueConfig> = {
  polymarket: {
    venueId: 'polymarket',
    displayName: 'Polymarket',
    description: 'Leading prediction market on Polygon',

    rules: {
      picksPerPack: 5,
      weeklyPackLimit: 2,
      allowCashout: false,
    },

    features: {
      walletRequired: false,
      showOrderbook: true,
      instantExecution: false,
      supportsPartialSell: true,
    },

    theme: {
      accentColor: '#6366f1',
      logo: '/venues/polymarket.svg',
      backgroundColor: '#0f0f23',
    },

    api: {
      baseUrl: 'https://gamma-api.polymarket.com',
      rateLimit: 60,
    },

    enabled: true,
  },

  jupiter: {
    venueId: 'jupiter',
    displayName: 'Jupiter',
    description: 'Prediction markets powered by Kalshi',

    rules: {
      picksPerPack: 5,
      weeklyPackLimit: 2,
      allowCashout: true,
    },

    features: {
      walletRequired: false, // Using Kalshi API directly
      showOrderbook: false,
      instantExecution: true,
      supportsPartialSell: false,
    },

    theme: {
      accentColor: '#22c55e',
      logo: '/venues/jupiter.svg',
      backgroundColor: '#0a1628',
    },

    api: {
      baseUrl: 'https://api.elections.kalshi.com/trade-api/v2',
      rateLimit: 60,
    },

    enabled: true, // Enabled - using Kalshi API
  },
};

// ============================================
// Active Venue Helpers
// ============================================

/**
 * Get the active venue ID from environment
 */
export function getActiveVenueId(): VenueId {
  if (!venueConfigs[ACTIVE_VENUE_ID]) {
    console.warn(`Invalid NEXT_PUBLIC_VENUE: ${ACTIVE_VENUE_ID}, defaulting to polymarket`);
    return 'polymarket';
  }
  return ACTIVE_VENUE_ID;
}

/**
 * Get the active venue config
 */
export function getActiveVenue(): VenueConfig {
  return venueConfigs[getActiveVenueId()];
}

// ============================================
// Config Helpers
// ============================================

/**
 * Get venue config by ID
 */
export function getVenueConfig(venueId: VenueId): VenueConfig | null {
  return venueConfigs[venueId] ?? null;
}

/**
 * Get all enabled venue configs
 */
export function getEnabledVenues(): VenueConfig[] {
  return Object.values(venueConfigs).filter((config) => config.enabled);
}

/**
 * Check if a venue is enabled (only active venue is enabled)
 */
export function isVenueEnabled(venueId: VenueId): boolean {
  return venueId === getActiveVenueId();
}

/**
 * Get venue rules
 */
export function getVenueRules(venueId: VenueId): VenueRules {
  const config = venueConfigs[venueId];
  if (!config) {
    // Return default rules (Polymarket-style)
    return {
      picksPerPack: 5,
      weeklyPackLimit: 2,
      allowCashout: false,
    };
  }
  return config.rules;
}

/**
 * Get venue features
 */
export function getVenueFeatures(venueId: VenueId): VenueFeatures {
  const config = venueConfigs[venueId];
  if (!config) {
    // Return default features
    return {
      walletRequired: false,
      showOrderbook: false,
      instantExecution: false,
      supportsPartialSell: true,
    };
  }
  return config.features;
}

/**
 * Get venue theme
 */
export function getVenueTheme(venueId: VenueId): VenueTheme {
  const config = venueConfigs[venueId];
  if (!config) {
    // Return default theme
    return {
      accentColor: '#6366f1',
      logo: '/venues/default.svg',
    };
  }
  return config.theme;
}

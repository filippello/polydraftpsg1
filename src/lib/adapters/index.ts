/**
 * Venue Adapters
 *
 * Multi-venue adapter system for prediction markets.
 * Supports Polymarket, Jupiter, and future venues.
 */

// Types
export type {
  VenueId,
  VenueAdapter,
  VenueMarket,
  VenueOutcome,
  VenuePriceUpdate,
  VenueResolution,
  VenueEventInput,
  FetchMarketsParams,
} from './types';

// Registry
export { venueRegistry } from './registry';
export type { VenueAdapterRegistry } from './registry';

// Config
export {
  venueConfigs,
  getVenueConfig,
  getEnabledVenues,
  isVenueEnabled,
  getVenueRules,
  getVenueFeatures,
  getVenueTheme,
} from './config';
export type {
  VenueConfig,
  VenueRules,
  VenueFeatures,
  VenueTheme,
} from './config';

// ============================================
// Venue Adapters
// ============================================

// Polymarket (auto-registers)
import './polymarket';
export { polymarketAdapter } from './polymarket';

// Jupiter (conditionally registers based on config)
import './jupiter';
export { jupiterAdapter, registerJupiterAdapter } from './jupiter';

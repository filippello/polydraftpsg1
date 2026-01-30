/**
 * Polymarket Adapter
 *
 * Implements VenueAdapter for Polymarket prediction markets.
 * Uses Gamma API for market data and CLOB API for prices.
 */

import type { Event } from '@/types';
import type {
  VenueAdapter,
  VenueMarket,
  VenuePriceUpdate,
  VenueResolution,
  FetchMarketsParams,
} from '../types';
import { venueRegistry } from '../registry';
import {
  fetchGammaMarkets,
  fetchGammaMarket,
  searchGammaMarkets,
  fetchClobPrice,
  fetchClobPrices,
  type GammaMarket,
} from './api';
import {
  transformGammaToVenueMarket,
  transformVenueMarketToEvent,
  determineResolution,
  isValidPolymarketMarket,
} from './transform';

// ============================================
// Polymarket Adapter Implementation
// ============================================

export class PolymarketAdapter implements VenueAdapter {
  readonly venueId = 'polymarket' as const;
  readonly displayName = 'Polymarket';

  // =====================================
  // Market Discovery
  // =====================================

  async fetchMarkets(params: FetchMarketsParams): Promise<VenueMarket[]> {
    const markets = await fetchGammaMarkets(params);
    return markets
      .filter(isValidPolymarketMarket)
      .map(transformGammaToVenueMarket);
  }

  async fetchMarket(marketId: string): Promise<VenueMarket | null> {
    const market = await fetchGammaMarket(marketId);
    if (!market) return null;

    if (!isValidPolymarketMarket(market)) {
      return null;
    }

    return transformGammaToVenueMarket(market);
  }

  async searchMarkets(query: string, limit: number = 20): Promise<VenueMarket[]> {
    const markets = await searchGammaMarkets(query, limit);
    return markets
      .filter(isValidPolymarketMarket)
      .map(transformGammaToVenueMarket);
  }

  // =====================================
  // Prices
  // =====================================

  async fetchPrices(tokenIds: string[]): Promise<VenuePriceUpdate[]> {
    const results = await fetchClobPrices(tokenIds);

    // Group by market (we don't have market ID from just token IDs)
    // This method is primarily used when we already have tokens mapped to events
    const tokenPrices = results
      .filter((r) => r.price !== null)
      .map((r) => ({
        tokenId: r.tokenId,
        price: r.price!,
      }));

    // Return a single price update with all token prices
    // The caller is responsible for mapping these to events
    return [{
      venueMarketId: '', // Caller must map this
      outcomeAProbability: 0,
      outcomeBProbability: 0,
      tokenPrices,
      timestamp: new Date().toISOString(),
    }];
  }

  async fetchTokenPrice(tokenId: string): Promise<number | null> {
    return fetchClobPrice(tokenId);
  }

  // =====================================
  // Resolution
  // =====================================

  async checkResolution(marketId: string): Promise<VenueResolution> {
    const market = await fetchGammaMarket(marketId);

    if (!market) {
      return { resolved: false };
    }

    return determineResolution(market);
  }

  // =====================================
  // Transformation
  // =====================================

  toEvent(market: VenueMarket): Partial<Event> {
    return transformVenueMarketToEvent(market);
  }

  // =====================================
  // Validation
  // =====================================

  isValidMarket(market: VenueMarket): boolean {
    // Must have 2 or 3 outcomes
    if (market.outcomes.length < 2 || market.outcomes.length > 3) return false;

    // Must not be archived
    if (market.isArchived) return false;

    // Probabilities should sum to approximately 1
    const sum = market.outcomeAProbability +
      market.outcomeBProbability +
      (market.outcomeDrawProbability ?? 0);

    // Allow some tolerance for rounding
    if (sum < 0.9 || sum > 1.1) return false;

    return true;
  }
}

// ============================================
// Singleton Instance
// ============================================

export const polymarketAdapter = new PolymarketAdapter();

// ============================================
// Auto-register with registry
// ============================================

venueRegistry.register(polymarketAdapter);

// ============================================
// Re-exports for backward compatibility
// ============================================

// Re-export API functions for direct use (backward compat with client.ts)
export {
  fetchGammaMarkets as fetchMarkets,
  fetchGammaMarket as fetchMarket,
  searchGammaMarkets as searchMarkets,
  fetchClobPrice as fetchPrice,
  fetchClobPrices,
  parseOutcomePrices,
} from './api';

export type { GammaMarket } from './api';

// Re-export transform functions
export {
  transformGammaToVenueMarket,
  transformVenueMarketToEvent,
  determineResolution,
  categorizeMarket,
  isValidPolymarketMarket as isValidMarket,
  extractTokenMappings,
} from './transform';

// Legacy compatibility: checkResolution function
export async function checkResolution(marketId: string): Promise<VenueResolution> {
  return polymarketAdapter.checkResolution(marketId);
}

// Legacy compatibility: transformMarketToEvent function
export function transformMarketToEvent(market: GammaMarket) {
  const venueMarket = transformGammaToVenueMarket(market);
  return transformVenueMarketToEvent(venueMarket);
}

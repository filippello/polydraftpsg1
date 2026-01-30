/**
 * Jupiter Adapter
 *
 * Implements VenueAdapter for Jupiter prediction markets on Solana.
 * Note: This adapter is disabled by default until the Jupiter Predictions
 * API integration is complete.
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
import { isVenueEnabled } from '../config';
import {
  fetchJupiterMarkets,
  fetchJupiterMarket,
  searchJupiterMarkets,
  fetchJupiterTokenPrice,
} from './api';
import {
  transformJupiterToVenueMarket,
  transformVenueMarketToEvent,
  determineResolution,
  isValidJupiterMarket,
} from './transform';

// ============================================
// Jupiter Adapter Implementation
// ============================================

export class JupiterAdapter implements VenueAdapter {
  readonly venueId = 'jupiter' as const;
  readonly displayName = 'Jupiter';

  // =====================================
  // Market Discovery
  // =====================================

  async fetchMarkets(params: FetchMarketsParams): Promise<VenueMarket[]> {
    const markets = await fetchJupiterMarkets({
      status: params.active ? 'open' : undefined,
      category: params.category,
      limit: params.limit,
      offset: params.offset,
      search: params.search,
    });

    return markets
      .filter(isValidJupiterMarket)
      .map(transformJupiterToVenueMarket);
  }

  async fetchMarket(marketId: string): Promise<VenueMarket | null> {
    const market = await fetchJupiterMarket(marketId);
    if (!market) return null;

    if (!isValidJupiterMarket(market)) {
      return null;
    }

    return transformJupiterToVenueMarket(market);
  }

  async searchMarkets(query: string, limit: number = 20): Promise<VenueMarket[]> {
    const markets = await searchJupiterMarkets(query, limit);
    return markets
      .filter(isValidJupiterMarket)
      .map(transformJupiterToVenueMarket);
  }

  // =====================================
  // Prices
  // =====================================

  async fetchPrices(tokenIds: string[]): Promise<VenuePriceUpdate[]> {
    const prices = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const price = await fetchJupiterTokenPrice(tokenId);
        return { tokenId, price };
      })
    );

    const tokenPrices = prices
      .filter((p) => p.price !== null)
      .map((p) => ({
        tokenId: p.tokenId,
        price: p.price!,
      }));

    return [{
      venueMarketId: '',
      outcomeAProbability: 0,
      outcomeBProbability: 0,
      tokenPrices,
      timestamp: new Date().toISOString(),
    }];
  }

  async fetchTokenPrice(tokenId: string): Promise<number | null> {
    return fetchJupiterTokenPrice(tokenId);
  }

  // =====================================
  // Resolution
  // =====================================

  async checkResolution(marketId: string): Promise<VenueResolution> {
    const market = await fetchJupiterMarket(marketId);

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
    // Must have exactly 2 outcomes (binary)
    if (market.outcomes.length !== 2) return false;

    // Must not be archived
    if (market.isArchived) return false;

    // Probabilities should sum to approximately 1
    const sum = market.outcomeAProbability + market.outcomeBProbability;
    if (sum < 0.9 || sum > 1.1) return false;

    return true;
  }
}

// ============================================
// Singleton Instance
// ============================================

export const jupiterAdapter = new JupiterAdapter();

// ============================================
// Conditional Registration
// ============================================

// Only register if Jupiter is enabled in config
if (isVenueEnabled('jupiter')) {
  venueRegistry.register(jupiterAdapter);
  console.log('[Jupiter] Adapter registered');
} else {
  console.log('[Jupiter] Adapter not registered (disabled in config)');
}

// ============================================
// Manual Registration Function
// ============================================

/**
 * Manually register the Jupiter adapter.
 * Useful for testing or when enabling Jupiter at runtime.
 */
export function registerJupiterAdapter(): void {
  if (!venueRegistry.has('jupiter')) {
    venueRegistry.register(jupiterAdapter);
  }
}

// ============================================
// Re-exports
// ============================================

export type { JupiterMarket, JupiterEvent, JupiterOutcome } from './types';
export {
  fetchJupiterMarkets,
  fetchJupiterMarket,
  searchJupiterMarkets,
  fetchJupiterTokenPrice,
} from './api';
export {
  transformJupiterToVenueMarket,
  determineResolution as checkResolution,
  isValidJupiterMarket as isValidMarket,
} from './transform';

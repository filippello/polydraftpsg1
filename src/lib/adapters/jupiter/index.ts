/**
 * Jupiter Adapter
 *
 * Implements VenueAdapter for Jupiter Predictions (powered by Kalshi).
 * Uses the Kalshi Trade API v2 for market data.
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
  fetchKalshiMarkets,
  fetchKalshiMarket,
  searchKalshiMarkets,
  getYesProbability,
} from './api';
import {
  transformKalshiToVenueMarket,
  transformVenueMarketToEvent,
  determineResolution,
  isValidKalshiMarket,
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
    // Map our params to Kalshi params
    const kalshiParams: Parameters<typeof fetchKalshiMarkets>[0] = {
      limit: params.limit,
    };

    // Map active/closed to Kalshi status
    if (params.active === true) {
      kalshiParams.status = 'open';
    } else if (params.closed === true) {
      kalshiParams.status = 'settled';
    }

    const markets = await fetchKalshiMarkets(kalshiParams);

    return markets
      .filter(isValidKalshiMarket)
      .map(transformKalshiToVenueMarket);
  }

  async fetchMarket(marketId: string): Promise<VenueMarket | null> {
    const market = await fetchKalshiMarket(marketId);
    if (!market) return null;

    if (!isValidKalshiMarket(market)) {
      return null;
    }

    return transformKalshiToVenueMarket(market);
  }

  async searchMarkets(query: string, limit: number = 20): Promise<VenueMarket[]> {
    const markets = await searchKalshiMarkets(query, limit);
    return markets
      .filter(isValidKalshiMarket)
      .map(transformKalshiToVenueMarket);
  }

  // =====================================
  // Prices
  // =====================================

  async fetchPrices(tokenIds: string[]): Promise<VenuePriceUpdate[]> {
    // Kalshi doesn't have separate token prices - prices come from market data
    // Extract market ticker from token ID (format: "TICKER-yes" or "TICKER-no")
    const tickerSet = new Set<string>();
    for (const tokenId of tokenIds) {
      const ticker = tokenId.replace(/-yes$|-no$/, '');
      tickerSet.add(ticker);
    }

    const updates: VenuePriceUpdate[] = [];
    const tickers = Array.from(tickerSet);

    for (const ticker of tickers) {
      const market = await fetchKalshiMarket(ticker);
      if (market) {
        const probYes = getYesProbability(market);
        updates.push({
          venueMarketId: ticker,
          outcomeAProbability: probYes,
          outcomeBProbability: 1 - probYes,
          tokenPrices: [
            { tokenId: `${ticker}-yes`, price: probYes },
            { tokenId: `${ticker}-no`, price: 1 - probYes },
          ],
          timestamp: new Date().toISOString(),
        });
      }
    }

    return updates;
  }

  async fetchTokenPrice(tokenId: string): Promise<number | null> {
    // Extract ticker and side from token ID
    const isYes = tokenId.endsWith('-yes');
    const ticker = tokenId.replace(/-yes$|-no$/, '');

    const market = await fetchKalshiMarket(ticker);
    if (!market) return null;

    const probYes = getYesProbability(market);
    return isYes ? probYes : 1 - probYes;
  }

  // =====================================
  // Resolution
  // =====================================

  async checkResolution(marketId: string): Promise<VenueResolution> {
    const market = await fetchKalshiMarket(marketId);

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

export type { KalshiMarket, KalshiEvent, KalshiMarketStatus } from './types';
export {
  fetchKalshiMarkets,
  fetchKalshiMarket,
  searchKalshiMarkets,
  getYesProbability,
  getNoProbability,
  isMarketOpen,
  isMarketResolved,
} from './api';
export {
  transformKalshiToVenueMarket,
  determineResolution as checkResolution,
  isValidKalshiMarket as isValidMarket,
  categorizeKalshiMarket,
} from './transform';

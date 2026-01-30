/**
 * Jupiter Predictions API Client
 *
 * Low-level API functions for Jupiter's prediction market API on Solana.
 * Note: API endpoints are placeholders and should be updated with actual
 * Jupiter Predictions API when available.
 */

import type {
  JupiterMarket,
  JupiterEvent,
  JupiterPriceQuote,
  JupiterMarketsResponse,
  JupiterEventsResponse,
  JupiterFetchMarketsParams,
} from './types';

// ============================================
// API Configuration
// ============================================

// Jupiter Predictions API base URL (placeholder - update when available)
const JUPITER_API_BASE = process.env.JUPITER_API_BASE ?? 'https://predictions.jup.ag/api/v1';

// ============================================
// Events API
// ============================================

/**
 * Fetch all events from Jupiter
 */
export async function fetchJupiterEvents(params: {
  status?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<JupiterEvent[]> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.category) searchParams.set('category', params.category);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

  try {
    const response = await fetch(`${JUPITER_API_BASE}/events?${searchParams}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const data: JupiterEventsResponse = await response.json();
    return data.events ?? [];
  } catch (error) {
    console.error('[Jupiter] Error fetching events:', error);
    return [];
  }
}

/**
 * Fetch a single event by ID
 */
export async function fetchJupiterEvent(eventId: string): Promise<JupiterEvent | null> {
  try {
    const response = await fetch(`${JUPITER_API_BASE}/events/${eventId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Jupiter] Error fetching event:', error);
    return null;
  }
}

// ============================================
// Markets API
// ============================================

/**
 * Fetch markets from Jupiter
 */
export async function fetchJupiterMarkets(params: JupiterFetchMarketsParams): Promise<JupiterMarket[]> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.category) searchParams.set('category', params.category);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  if (params.search) searchParams.set('search', params.search);

  try {
    const response = await fetch(`${JUPITER_API_BASE}/markets?${searchParams}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const data: JupiterMarketsResponse = await response.json();
    return data.markets ?? [];
  } catch (error) {
    console.error('[Jupiter] Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ID
 */
export async function fetchJupiterMarket(marketId: string): Promise<JupiterMarket | null> {
  try {
    const response = await fetch(`${JUPITER_API_BASE}/markets/${marketId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Jupiter] Error fetching market:', error);
    return null;
  }
}

/**
 * Search markets by query
 */
export async function searchJupiterMarkets(
  query: string,
  limit: number = 20
): Promise<JupiterMarket[]> {
  return fetchJupiterMarkets({ search: query, limit });
}

// ============================================
// Prices API
// ============================================

/**
 * Fetch current prices for a market
 */
export async function fetchJupiterPrices(marketId: string): Promise<JupiterPriceQuote | null> {
  try {
    const response = await fetch(`${JUPITER_API_BASE}/markets/${marketId}/prices`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Jupiter] Error fetching prices:', error);
    return null;
  }
}

/**
 * Fetch price for a specific token mint
 */
export async function fetchJupiterTokenPrice(tokenMint: string): Promise<number | null> {
  try {
    const response = await fetch(`${JUPITER_API_BASE}/tokens/${tokenMint}/price`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('[Jupiter] Error fetching token price:', error);
    return null;
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Parse Jupiter status to our status format
 */
export function parseJupiterStatus(status: JupiterMarket['status']): string {
  switch (status) {
    case 'open':
      return 'active';
    case 'locked':
      return 'active';
    case 'resolved':
      return 'resolved';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'upcoming';
  }
}

/**
 * Check if a Jupiter market is resolved
 */
export function isJupiterMarketResolved(market: JupiterMarket): boolean {
  return market.status === 'resolved' && market.resolution !== null;
}

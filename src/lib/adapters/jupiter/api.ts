/**
 * Jupiter/Kalshi Predictions API Client
 *
 * Jupiter Predictions uses Kalshi for liquidity and market data.
 * This client interfaces with the Kalshi Trade API v2.
 *
 * API Docs: https://docs.kalshi.com/welcome
 */

import type {
  KalshiMarket,
  KalshiMarketsResponse,
  KalshiMarketResponse,
  KalshiFetchMarketsParams,
  KalshiMarketStatus,
} from './types';

// ============================================
// API Configuration
// ============================================

// Kalshi API base URL (used by Jupiter Predictions)
const KALSHI_API_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

// ============================================
// Markets API
// ============================================

/**
 * Fetch markets from Kalshi API
 */
export async function fetchKalshiMarkets(
  params: KalshiFetchMarketsParams = {}
): Promise<KalshiMarket[]> {
  const searchParams = new URLSearchParams();

  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.cursor) searchParams.set('cursor', params.cursor);
  if (params.event_ticker) searchParams.set('event_ticker', params.event_ticker);
  if (params.series_ticker) searchParams.set('series_ticker', params.series_ticker);
  if (params.status) searchParams.set('status', params.status);
  if (params.tickers) searchParams.set('tickers', params.tickers);
  if (params.min_close_ts) searchParams.set('min_close_ts', String(params.min_close_ts));
  if (params.max_close_ts) searchParams.set('max_close_ts', String(params.max_close_ts));

  try {
    const url = `${KALSHI_API_BASE}/markets?${searchParams}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data: KalshiMarketsResponse = await response.json();
    return data.markets ?? [];
  } catch (error) {
    console.error('[Jupiter/Kalshi] Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ticker
 */
export async function fetchKalshiMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const response = await fetch(`${KALSHI_API_BASE}/markets/${ticker}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data: KalshiMarketResponse = await response.json();
    return data.market ?? null;
  } catch (error) {
    console.error('[Jupiter/Kalshi] Error fetching market:', error);
    return null;
  }
}

/**
 * Search markets by fetching and filtering
 * Note: Kalshi doesn't have a search endpoint, so we fetch and filter client-side
 */
export async function searchKalshiMarkets(
  query: string,
  limit: number = 20
): Promise<KalshiMarket[]> {
  // Fetch open markets
  const markets = await fetchKalshiMarkets({ status: 'open', limit: 200 });

  // Filter by query (case-insensitive search in title/subtitle)
  const queryLower = query.toLowerCase();
  const filtered = markets.filter((m) => {
    const title = (m.title ?? '').toLowerCase();
    const subtitle = (m.subtitle ?? '').toLowerCase();
    const ticker = m.ticker.toLowerCase();
    return title.includes(queryLower) || subtitle.includes(queryLower) || ticker.includes(queryLower);
  });

  return filtered.slice(0, limit);
}

/**
 * Fetch all markets for pagination
 */
export async function fetchAllKalshiMarkets(
  params: KalshiFetchMarketsParams = {},
  maxPages: number = 5
): Promise<KalshiMarket[]> {
  const allMarkets: KalshiMarket[] = [];
  let cursor: string | undefined = params.cursor;
  let pages = 0;

  while (pages < maxPages) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit ?? 100));
    if (cursor) searchParams.set('cursor', cursor);
    if (params.status) searchParams.set('status', params.status);

    try {
      const response = await fetch(`${KALSHI_API_BASE}/markets?${searchParams}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      });

      if (!response.ok) break;

      const data: KalshiMarketsResponse = await response.json();
      allMarkets.push(...(data.markets ?? []));

      if (!data.cursor) break;
      cursor = data.cursor;
      pages++;
    } catch {
      break;
    }
  }

  return allMarkets;
}

// ============================================
// Price Utilities
// ============================================

/**
 * Convert Kalshi price (in cents, 0-100) to probability (0-1)
 * Kalshi API returns prices in cents, e.g., 65 = 65 cents = 65%
 */
export function kalshiPriceToProbability(priceCents: number | undefined): number {
  if (priceCents === undefined || priceCents === null) return 0.5;
  // Convert cents (0-100) to probability (0-1)
  const prob = priceCents / 100;
  return Math.min(Math.max(prob, 0), 1);
}

/**
 * Get YES probability from market
 */
export function getYesProbability(market: KalshiMarket): number {
  // Use last_price if available and non-zero, otherwise midpoint of bid/ask
  if (market.last_price !== undefined && market.last_price > 0) {
    return kalshiPriceToProbability(market.last_price);
  }

  // Use midpoint of bid/ask
  const yesBid = market.yes_bid ?? 0;
  const yesAsk = market.yes_ask ?? 100;

  // If no liquidity, use 50%
  if (yesBid === 0 && yesAsk >= 100) {
    return 0.5;
  }

  const midpoint = (yesBid + yesAsk) / 2;
  return kalshiPriceToProbability(midpoint);
}

/**
 * Get NO probability from market
 */
export function getNoProbability(market: KalshiMarket): number {
  return 1 - getYesProbability(market);
}

// ============================================
// Status Utilities
// ============================================

/**
 * Check if market is open for trading
 */
export function isMarketOpen(market: KalshiMarket): boolean {
  return market.status === 'open' || market.status === 'active';
}

/**
 * Check if market is resolved
 */
export function isMarketResolved(market: KalshiMarket): boolean {
  return (
    market.status === 'determined' ||
    market.status === 'settled' ||
    market.status === 'finalized'
  );
}

/**
 * Check if market is closed (no longer trading but not resolved)
 */
export function isMarketClosed(market: KalshiMarket): boolean {
  return market.status === 'closed' || market.status === 'paused';
}

/**
 * Map Kalshi status to our EventStatus
 */
export function mapKalshiStatus(status: KalshiMarketStatus): string {
  switch (status) {
    case 'initialized':
    case 'inactive':
      return 'upcoming';
    case 'open':
    case 'active':
      return 'active';
    case 'paused':
    case 'closed':
      return 'pending_resolution';
    case 'determined':
    case 'disputed':
    case 'amended':
    case 'finalized':
    case 'settled':
      return 'resolved';
    default:
      return 'upcoming';
  }
}

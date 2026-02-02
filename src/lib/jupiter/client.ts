/**
 * Jupiter/Explore Mode API Client
 *
 * Fetches market data for Explore mode.
 * Uses mock data for testing, API for production.
 */

import type {
  ExploreMarket,
  ExploreOutcome,
  FetchExploreMarketsParams,
} from './types';
import { getMockMarkets, getMockMarketById } from './mock-data';

// Toggle this to switch between mock and API
const USE_MOCK_DATA = true;

// ============================================
// Cache Configuration
// ============================================

const CACHE_TTL = 30 * 1000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================
// Public API
// ============================================

/**
 * Fetch explore markets
 */
export async function getExploreMarkets(
  params: FetchExploreMarketsParams = {}
): Promise<ExploreMarket[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 200));

    let markets = getMockMarkets();

    // Apply filters
    if (params.category) {
      markets = markets.filter(
        (m) => m.category.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      markets = markets.filter(
        (m) =>
          m.title.toLowerCase().includes(searchLower) ||
          m.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    return markets.slice(offset, offset + limit);
  }

  // Production: fetch from API
  const cacheKey = `markets-${JSON.stringify(params)}`;
  const cached = getCached<ExploreMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('/api/explore/markets');
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const markets: ExploreMarket[] = data.markets || [];
    setCache(cacheKey, markets);
    return markets;
  } catch (error) {
    console.error('Error fetching explore markets:', error);
    return [];
  }
}

/**
 * Get a single market by ID
 */
export async function getEventPrices(eventId: string): Promise<ExploreMarket | null> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 100));
    return getMockMarketById(eventId);
  }

  const cacheKey = `event-${eventId}`;
  const cached = getCached<ExploreMarket>(cacheKey);
  if (cached) return cached;

  try {
    const markets = await getExploreMarkets();
    const market = markets.find((m) => m.id === eventId);
    if (market) setCache(cacheKey, market);
    return market || null;
  } catch (error) {
    console.error('Error fetching event prices:', error);
    return null;
  }
}

/**
 * Get all outcomes for a market
 */
export async function getMarketOutcomes(marketId: string): Promise<ExploreOutcome[]> {
  const market = await getEventPrices(marketId);
  if (!market) return [];
  return market.outcomes;
}

/**
 * Refresh prices (bypasses cache)
 */
export async function refreshEventPrices(eventId: string): Promise<ExploreMarket | null> {
  cache.delete(`event-${eventId}`);
  cache.clear();
  return getEventPrices(eventId);
}

/**
 * Get featured markets for the grid
 */
export async function getFeaturedMarkets(limit: number = 20): Promise<ExploreMarket[]> {
  if (USE_MOCK_DATA) {
    await new Promise((r) => setTimeout(r, 300));
    const markets = getMockMarkets();
    // Sort by volume (descending)
    return [...markets].sort((a, b) => b.volume - a.volume).slice(0, limit);
  }

  const cacheKey = `featured-${limit}`;
  const cached = getCached<ExploreMarket[]>(cacheKey);
  if (cached) return cached;

  try {
    const markets = await getExploreMarkets({ limit });
    const sorted = [...markets].sort((a, b) => b.volume - a.volume);
    setCache(cacheKey, sorted);
    return sorted;
  } catch (error) {
    console.error('Error fetching featured markets:', error);
    return [];
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

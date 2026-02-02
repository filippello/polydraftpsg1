/**
 * Jupiter/Kalshi Explore Mode API Client
 *
 * Fetches real-time prices and market data for Explore mode.
 * Uses mock data for development, Kalshi API for production.
 */

import type {
  ExploreMarket,
  ExploreOutcome,
  FetchExploreMarketsParams,
} from './types';
import { getMockMarkets, getMockMarketById } from './mock-data';

// Set to true to use mock data instead of real API
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
 * Fetch explore markets with pagination
 */
export async function getExploreMarkets(
  params: FetchExploreMarketsParams = {}
): Promise<ExploreMarket[]> {
  // Use mock data
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 300));

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

    // Apply limit
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    return markets.slice(offset, offset + limit);
  }

  // Real API implementation would go here
  const cacheKey = `markets-${JSON.stringify(params)}`;
  const cached = getCached<ExploreMarket[]>(cacheKey);
  if (cached) return cached;

  // Fallback to mock if API not configured
  return getMockMarkets();
}

/**
 * Get a single market by ID with real-time prices
 */
export async function getEventPrices(eventId: string): Promise<ExploreMarket | null> {
  // Use mock data
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 200));
    return getMockMarketById(eventId);
  }

  const cacheKey = `event-${eventId}`;
  const cached = getCached<ExploreMarket>(cacheKey);
  if (cached) return cached;

  // Fallback to mock
  return getMockMarketById(eventId);
}

/**
 * Get all outcomes for a market (for multi-outcome events)
 */
export async function getMarketOutcomes(
  marketId: string
): Promise<ExploreOutcome[]> {
  const market = await getEventPrices(marketId);
  if (!market) return [];
  return market.outcomes;
}

/**
 * Refresh prices for a market (bypasses cache)
 */
export async function refreshEventPrices(eventId: string): Promise<ExploreMarket | null> {
  cache.delete(`event-${eventId}`);
  cache.delete(`outcomes-${eventId}`);
  return getEventPrices(eventId);
}

/**
 * Get featured/popular markets for the explore grid
 */
export async function getFeaturedMarkets(limit: number = 20): Promise<ExploreMarket[]> {
  // Use mock data
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400));

    const markets = getMockMarkets();
    // Sort by volume (descending)
    const sorted = [...markets].sort((a, b) => b.volume - a.volume);
    return sorted.slice(0, limit);
  }

  const cacheKey = `featured-${limit}`;
  const cached = getCached<ExploreMarket[]>(cacheKey);
  if (cached) return cached;

  // Fallback to mock
  return getMockMarkets().slice(0, limit);
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

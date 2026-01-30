/**
 * Polymarket API Client
 *
 * Low-level API functions for Polymarket's Gamma and CLOB APIs.
 * These functions handle direct API communication.
 */

// ============================================
// API Configuration
// ============================================

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

// ============================================
// Types (Polymarket-specific)
// ============================================

export interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: string[];
  outcomePrices: string[] | string; // Can be array or JSON string
  volume: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  resolutionSource?: string;
  endDate?: string;
  description?: string;
  image?: string;
  category?: string;
  tags?: string[];
  clobTokenIds?: string;
}

export interface ClobPrice {
  token_id: string;
  price: string;
}

export interface ClobMidpoint {
  mid: string;
}

// ============================================
// Gamma API (Market Metadata)
// ============================================

export interface FetchMarketsParams {
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
}

/**
 * Fetch markets from Gamma API
 */
export async function fetchGammaMarkets(params: FetchMarketsParams): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();

  if (params.active !== undefined) searchParams.set('active', String(params.active));
  if (params.closed !== undefined) searchParams.set('closed', String(params.closed));
  if (params.archived !== undefined) searchParams.set('archived', String(params.archived));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  if (params.search) searchParams.set('search', params.search);

  try {
    const response = await fetch(`${GAMMA_API_BASE}/markets?${searchParams}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.markets ?? [];
  } catch (error) {
    console.error('[Polymarket] Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ID from Gamma API
 */
export async function fetchGammaMarket(marketId: string): Promise<GammaMarket | null> {
  try {
    const response = await fetch(`${GAMMA_API_BASE}/markets/${marketId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Gamma API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('[Polymarket] Error fetching market:', error);
    return null;
  }
}

/**
 * Search markets by query
 */
export async function searchGammaMarkets(query: string, limit: number = 20): Promise<GammaMarket[]> {
  return fetchGammaMarkets({ search: query, limit });
}

// ============================================
// CLOB API (Prices)
// ============================================

/**
 * Fetch current price for a token from CLOB API
 */
export async function fetchClobPrice(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/price?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 }, // Cache for 10 seconds
    });

    if (!response.ok) {
      throw new Error(`CLOB API error: ${response.status}`);
    }

    const data: ClobPrice = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('[Polymarket] Error fetching price:', error);
    return null;
  }
}

/**
 * Fetch midpoint price for a token from CLOB API
 */
export async function fetchClobMidpoint(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/midpoint?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`CLOB API error: ${response.status}`);
    }

    const data: ClobMidpoint = await response.json();
    return parseFloat(data.mid);
  } catch (error) {
    console.error('[Polymarket] Error fetching midpoint:', error);
    return null;
  }
}

/**
 * Fetch prices for multiple tokens in parallel
 */
export async function fetchClobPrices(
  tokenIds: string[]
): Promise<Array<{ tokenId: string; price: number | null }>> {
  const results = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const price = await fetchClobPrice(tokenId);
      return { tokenId, price };
    })
  );
  return results;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Parse outcomePrices which can be an array or a JSON string
 */
export function parseOutcomePrices(outcomePrices: string[] | string | undefined): number[] {
  if (!outcomePrices) return [0.5, 0.5];

  let parsed = outcomePrices;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [0.5, 0.5];
    }
  }

  if (!Array.isArray(parsed)) return [0.5, 0.5];

  return parsed.map((p) => parseFloat(String(p)));
}

/**
 * Parse CLOB token IDs from market data
 */
export function parseClobTokenIds(clobTokenIds: string | undefined): string[] {
  if (!clobTokenIds) return [];

  try {
    const parsed = JSON.parse(clobTokenIds);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, try comma-separated
    return clobTokenIds.split(',').map((id) => id.trim());
  }

  return [];
}

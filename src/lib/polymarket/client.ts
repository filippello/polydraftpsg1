/**
 * Polymarket API Client
 *
 * Integrates with Polymarket's Gamma API and CLOB API
 * to fetch market data, prices, and resolution status.
 *
 * NOTE: This file is kept for backward compatibility.
 * New code should import from '@/lib/adapters/polymarket' instead.
 */

// Re-export everything from the new adapter location
export {
  fetchMarkets,
  fetchMarket,
  searchMarkets,
  fetchPrice,
  parseOutcomePrices,
  checkResolution,
  transformMarketToEvent,
  isValidMarket,
  categorizeMarket,
  type GammaMarket,
} from '@/lib/adapters/polymarket';

// Re-export types for backward compatibility
export type { VenueResolution as ResolutionResult } from '@/lib/adapters/types';

// Legacy type re-exports
export interface GammaMarketsResponse {
  markets: import('@/lib/adapters/polymarket').GammaMarket[];
  next_cursor?: string;
}

export interface ClobPrice {
  token_id: string;
  price: string;
}

// ============================================
// Legacy Midpoint Function (not in adapter)
// ============================================

const CLOB_API_BASE = 'https://clob.polymarket.com';

/**
 * Fetch midpoint price for a token
 * (Kept here for backward compatibility - not in the adapter)
 */
export async function fetchMidpoint(tokenId: string): Promise<number | null> {
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

    const data = await response.json();
    return parseFloat(data.mid);
  } catch (error) {
    console.error('Error fetching midpoint:', error);
    return null;
  }
}

/**
 * Jupiter Predictions API Types
 *
 * Types for Jupiter's prediction market API on Solana.
 * Note: These types are based on expected API structure and may need
 * adjustment once the actual API is integrated.
 */

// ============================================
// Jupiter API Response Types
// ============================================

/**
 * Jupiter Event (top-level container for markets)
 */
export interface JupiterEvent {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  status: 'active' | 'settled' | 'cancelled';
  startTime?: string;
  endTime?: string;
  markets: JupiterMarket[];
}

/**
 * Jupiter Market (individual prediction market within an event)
 */
export interface JupiterMarket {
  id: string;
  eventId: string;
  question: string;
  description?: string;
  imageUrl?: string;

  // Market status
  status: 'open' | 'locked' | 'resolved' | 'cancelled';
  resolution?: 'yes' | 'no' | null;

  // Outcomes (typically YES/NO for binary markets)
  outcomes: JupiterOutcome[];

  // Liquidity and volume
  liquidity: string;
  volume: string;

  // Timestamps
  createdAt: string;
  lockedAt?: string;
  resolvedAt?: string;

  // Solana-specific
  marketPubkey: string;
  ammPubkey?: string;
}

/**
 * Jupiter Outcome (YES/NO position in a market)
 */
export interface JupiterOutcome {
  id: string;
  marketId: string;
  name: string;
  price: string; // 0-1 as string
  tokenMint: string; // Solana token mint address
}

/**
 * Jupiter Price Quote Response
 */
export interface JupiterPriceQuote {
  marketId: string;
  outcomes: Array<{
    name: string;
    price: string;
    tokenMint: string;
  }>;
  timestamp: string;
}

/**
 * Jupiter Markets List Response
 */
export interface JupiterMarketsResponse {
  markets: JupiterMarket[];
  pagination?: {
    total: number;
    offset: number;
    limit: number;
  };
}

/**
 * Jupiter Events List Response
 */
export interface JupiterEventsResponse {
  events: JupiterEvent[];
  pagination?: {
    total: number;
    offset: number;
    limit: number;
  };
}

// ============================================
// Fetch Parameters
// ============================================

export interface JupiterFetchMarketsParams {
  status?: 'open' | 'locked' | 'resolved' | 'cancelled';
  category?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

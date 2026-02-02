/**
 * Jupiter/Kalshi Explore Mode Types
 *
 * Types for the Explore mode that supports multi-outcome markets.
 */

// ============================================
// Explore Market Types (Multi-Outcome Support)
// ============================================

/**
 * An outcome within an Explore market
 * Supports 2+ outcomes per market (binary or multi-outcome)
 */
export interface ExploreOutcome {
  id: string;
  label: string;
  probability: number;
  image_url?: string;      // Logo, photo, etc.
  clob_id: string;         // For executing bets
  ticker?: string;         // Market ticker for this outcome
}

/**
 * An Explore market (event with multiple outcomes)
 */
export interface ExploreMarket {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  category: string;
  subcategory?: string;
  volume: number;
  end_date: string;
  event_ticker?: string;
  outcomes: ExploreOutcome[];
  is_binary: boolean;      // true if only 2 outcomes (Yes/No)
  status: 'active' | 'closed' | 'resolved';
  created_at?: string;
}

/**
 * Pending bet selection (for future betting implementation)
 */
export interface PendingBet {
  marketId: string;
  outcomeId: string;
  outcomeLabel: string;
  probability: number;
  direction: 'yes' | 'no';  // Betting YES or NO on this outcome
  amount?: number;
}

// ============================================
// API Response Types
// ============================================

export interface ExploreMarketsResponse {
  markets: ExploreMarket[];
  cursor?: string;
  total?: number;
}

export interface ExploreMarketResponse {
  market: ExploreMarket;
}

// ============================================
// Fetch Parameters
// ============================================

export interface FetchExploreMarketsParams {
  limit?: number;
  offset?: number;
  cursor?: string;
  category?: string;
  status?: 'active' | 'closed' | 'all';
  search?: string;
}

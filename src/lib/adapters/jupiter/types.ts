/**
 * Jupiter/Kalshi Predictions API Types
 *
 * Jupiter Predictions uses Kalshi for liquidity and market data.
 * These types map to the Kalshi Trade API v2.
 */

// ============================================
// Kalshi API Response Types
// ============================================

/**
 * Kalshi Market status values
 */
export type KalshiMarketStatus =
  | 'initialized'
  | 'inactive'
  | 'active'
  | 'open'
  | 'paused'
  | 'closed'
  | 'determined'
  | 'disputed'
  | 'amended'
  | 'finalized'
  | 'settled';

/**
 * Kalshi Market from API
 * Based on https://docs.kalshi.com/api-reference/market/get-market
 */
export interface KalshiMarket {
  // Identifiers
  ticker: string;
  event_ticker: string;
  series_ticker?: string;

  // Market info
  market_type: 'binary' | 'scalar';
  title?: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;

  // Status
  status: KalshiMarketStatus;
  result?: 'yes' | 'no' | 'void';

  // Pricing (in dollars, fixed-point with 4 decimals)
  // e.g., "0.6500" means $0.65 or 65% probability
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  last_price?: number;

  // Volume & Liquidity
  volume?: number;
  volume_24h?: number;
  open_interest?: number;
  liquidity?: number;

  // Notional value (payout per contract)
  notional_value?: number;

  // Timestamps (ISO 8601)
  created_time?: string;
  updated_time?: string;
  open_time?: string;
  close_time?: string;
  expiration_time?: string;
  latest_expiration_time?: string;
  settlement_time?: string;

  // Rules
  rules_primary?: string;
  rules_secondary?: string;

  // Category/tags
  category?: string;
  tags?: string[];

  // Floor/cap for pricing
  floor_strike?: number;
  cap_strike?: number;
}

/**
 * Kalshi Event (container for related markets)
 */
export interface KalshiEvent {
  event_ticker: string;
  series_ticker?: string;
  title: string;
  subtitle?: string;
  category?: string;
  mutually_exclusive: boolean;
  markets: KalshiMarket[];
}

/**
 * Kalshi Markets List Response
 */
export interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

/**
 * Kalshi Events List Response
 */
export interface KalshiEventsResponse {
  events: KalshiEvent[];
  cursor?: string;
}

/**
 * Kalshi Single Market Response
 */
export interface KalshiMarketResponse {
  market: KalshiMarket;
}

// ============================================
// Fetch Parameters
// ============================================

export interface KalshiFetchMarketsParams {
  limit?: number;
  cursor?: string;
  event_ticker?: string;
  series_ticker?: string;
  status?: 'unopened' | 'open' | 'paused' | 'closed' | 'settled';
  tickers?: string;
  min_close_ts?: number;
  max_close_ts?: number;
}

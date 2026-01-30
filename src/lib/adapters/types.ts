/**
 * Venue Adapter Types
 *
 * Core interfaces for the venue-agnostic adapter system.
 * Adapters transform venue-specific data into a common format.
 */

import type { Event, EventCategory, Outcome } from '@/types';

// ============================================
// Venue Identification
// ============================================

export type VenueId = 'polymarket' | 'jupiter' | string;

// ============================================
// Venue Market Types (Common Format)
// ============================================

/**
 * Normalized market data from any venue
 */
export interface VenueMarket {
  // Venue identification
  venueId: VenueId;
  venueMarketId: string;
  venueSlug?: string;
  venueConditionId?: string;

  // Market metadata
  title: string;
  description?: string;
  imageUrl?: string;

  // Outcomes
  outcomes: VenueOutcome[];
  supportsDraw: boolean;

  // Prices (0-1)
  outcomeAProbability: number;
  outcomeBProbability: number;
  outcomeDrawProbability?: number;

  // Status
  isActive: boolean;
  isClosed: boolean;
  isArchived: boolean;

  // Dates
  startDate?: string;
  endDate?: string;

  // Volume/liquidity
  volume?: number;

  // Categorization
  category?: EventCategory;
  subcategory?: string;
  tags?: string[];
}

export interface VenueOutcome {
  label: string;
  tokenId?: string;
  price: number;
  position: 'a' | 'b' | 'draw';
}

// ============================================
// Price Updates
// ============================================

export interface VenuePriceUpdate {
  venueMarketId: string;
  outcomeAProbability: number;
  outcomeBProbability: number;
  outcomeDrawProbability?: number;
  tokenPrices?: Array<{
    tokenId: string;
    price: number;
  }>;
  timestamp: string;
}

// ============================================
// Resolution
// ============================================

export interface VenueResolution {
  resolved: boolean;
  winningOutcome?: Outcome;
  winningPrice?: number;
  resolvedAt?: string;
}

// ============================================
// Fetch Parameters
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

// ============================================
// Venue Adapter Interface
// ============================================

/**
 * Interface that all venue adapters must implement.
 * Each adapter transforms venue-specific data into the common VenueMarket format.
 */
export interface VenueAdapter {
  /** Unique identifier for this venue */
  readonly venueId: VenueId;

  /** Display name for UI */
  readonly displayName: string;

  // =====================================
  // Market Discovery
  // =====================================

  /**
   * Fetch multiple markets from the venue
   */
  fetchMarkets(params: FetchMarketsParams): Promise<VenueMarket[]>;

  /**
   * Fetch a single market by its venue-specific ID
   */
  fetchMarket(marketId: string): Promise<VenueMarket | null>;

  /**
   * Search markets by query
   */
  searchMarkets?(query: string, limit?: number): Promise<VenueMarket[]>;

  // =====================================
  // Prices
  // =====================================

  /**
   * Fetch current prices for outcome tokens
   */
  fetchPrices(tokenIds: string[]): Promise<VenuePriceUpdate[]>;

  /**
   * Fetch price for a single token
   */
  fetchTokenPrice?(tokenId: string): Promise<number | null>;

  // =====================================
  // Resolution
  // =====================================

  /**
   * Check if a market is resolved and get the winning outcome
   */
  checkResolution(marketId: string): Promise<VenueResolution>;

  // =====================================
  // Transformation
  // =====================================

  /**
   * Transform a VenueMarket to our Event format
   * This allows venues to customize the transformation logic
   */
  toEvent(market: VenueMarket): Partial<Event>;

  // =====================================
  // Validation
  // =====================================

  /**
   * Check if a market is valid for our game
   */
  isValidMarket(market: VenueMarket): boolean;
}

// ============================================
// Venue Event Input (for upsert operations)
// ============================================

/**
 * Input format for creating/updating events from any venue
 */
export interface VenueEventInput {
  // Venue identification
  venue: VenueId;
  venueMarketId: string;
  venueSlug: string;
  venueInternalId?: string;

  // Event data
  title: string;
  description?: string;
  imageUrl?: string;

  // Outcomes
  outcomeALabel: string;
  outcomeBLabel: string;
  outcomeAProbability: number;
  outcomeBProbability: number;

  // Draw support
  supportsDraw: boolean;
  outcomeDrawLabel?: string | null;
  outcomeDrawProbability?: number | null;

  // Tokens for price fetching
  tokens: Array<{
    outcome: Outcome;
    outcomeLabel: string;
    tokenId: string;
  }>;

  // Metadata
  volume?: number;
  category?: EventCategory;
  subcategory?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
}

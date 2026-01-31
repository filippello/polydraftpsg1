/**
 * Jupiter/Kalshi Transformers
 *
 * Functions to transform Kalshi-specific data formats
 * into the common VenueMarket format.
 */

import type { Event, EventCategory, Outcome } from '@/types';
import type { VenueMarket, VenueOutcome, VenueResolution } from '../types';
import type { KalshiMarket } from './types';
import {
  getYesProbability,
  getNoProbability,
  isMarketOpen,
  isMarketResolved,
} from './api';

// ============================================
// Market Transformation
// ============================================

/**
 * Transform a KalshiMarket to VenueMarket format
 */
export function transformKalshiToVenueMarket(market: KalshiMarket): VenueMarket {
  const probYes = getYesProbability(market);
  const probNo = getNoProbability(market);

  // For Kalshi, yes_sub_title is the "Yes" outcome label
  // The "No" outcome is the opposite (not the same label)
  const yesLabel = market.yes_sub_title ?? 'Yes';
  // If no_sub_title is the same as yes_sub_title, use "No" instead
  const noLabel = (market.no_sub_title && market.no_sub_title !== yesLabel)
    ? market.no_sub_title
    : 'No';

  // Build outcomes array (Kalshi markets are binary: YES/NO)
  const outcomes: VenueOutcome[] = [
    {
      label: yesLabel,
      tokenId: `${market.ticker}-yes`,
      price: probYes,
      position: 'a',
    },
    {
      label: noLabel,
      tokenId: `${market.ticker}-no`,
      price: probNo,
      position: 'b',
    },
  ];

  // Kalshi markets are always binary (no draw support)
  const supportsDraw = false;

  return {
    venueId: 'jupiter',
    venueMarketId: market.ticker,
    venueSlug: market.ticker.toLowerCase(),
    venueConditionId: market.event_ticker,

    title: market.title ?? market.subtitle ?? market.ticker,
    description: market.rules_primary,
    imageUrl: undefined, // Kalshi doesn't provide images in API

    outcomes,
    supportsDraw,

    outcomeAProbability: probYes,
    outcomeBProbability: probNo,

    isActive: isMarketOpen(market),
    isClosed: isMarketResolved(market) || market.status === 'closed',
    isArchived: market.status === 'settled',

    startDate: market.open_time,
    endDate: market.close_time ?? market.expiration_time,
    volume: market.volume,

    category: categorizeKalshiMarket(market),
    tags: market.tags,
  };
}

/**
 * Transform VenueMarket to Event format
 */
export function transformVenueMarketToEvent(market: VenueMarket): Partial<Event> {
  return {
    // Venue identification
    venue: 'jupiter',
    venue_event_id: market.venueMarketId,
    venue_slug: market.venueSlug,

    // No legacy Polymarket fields for Jupiter

    // Event data
    title: market.title,
    description: market.description,
    image_url: market.imageUrl,

    // Outcomes (YES/NO for Kalshi)
    outcome_a_label: market.outcomes[0]?.label ?? 'Yes',
    outcome_b_label: market.outcomes[1]?.label ?? 'No',
    outcome_a_probability: market.outcomeAProbability,
    outcome_b_probability: market.outcomeBProbability,

    // No draw support for Kalshi
    supports_draw: false,

    // Status
    status: market.isClosed
      ? 'resolved'
      : market.isActive
        ? 'active'
        : 'upcoming',

    // Metadata
    category: market.category,
    volume: market.volume,
    event_start_at: market.startDate,
    resolution_deadline_at: market.endDate,
  };
}

// ============================================
// Resolution Transformation
// ============================================

/**
 * Determine resolution from Kalshi market data
 */
export function determineResolution(market: KalshiMarket): VenueResolution {
  // Market not resolved
  if (!isMarketResolved(market)) {
    return { resolved: false };
  }

  // Check result field
  if (!market.result || market.result === 'void') {
    return { resolved: false };
  }

  // Determine winning outcome
  const winningOutcome: Outcome = market.result === 'yes' ? 'a' : 'b';

  return {
    resolved: true,
    winningOutcome,
    winningPrice: 1.0,
    resolvedAt: market.settlement_time,
  };
}

// ============================================
// Categorization
// ============================================

/**
 * Categorize a Kalshi market based on ticker/title
 */
export function categorizeKalshiMarket(market: KalshiMarket): EventCategory {
  const title = (market.title ?? '').toLowerCase();
  const ticker = market.ticker.toLowerCase();
  const eventTicker = (market.event_ticker ?? '').toLowerCase();
  const category = (market.category ?? '').toLowerCase();

  // Sports keywords
  const sportsKeywords = [
    'nba', 'nfl', 'mlb', 'nhl', 'soccer', 'football', 'basketball',
    'f1', 'formula', 'race', 'grand prix', 'championship', 'super bowl',
    'world series', 'playoffs', 'win', 'game', 'match', 'team',
  ];
  if (sportsKeywords.some((kw) => title.includes(kw) || ticker.includes(kw) || eventTicker.includes(kw))) {
    return 'sports';
  }
  if (category.includes('sport')) return 'sports';

  // Politics keywords
  const politicsKeywords = [
    'election', 'president', 'senate', 'congress', 'vote', 'poll',
    'democrat', 'republican', 'governor', 'mayor', 'biden', 'trump',
  ];
  if (politicsKeywords.some((kw) => title.includes(kw) || ticker.includes(kw))) {
    return 'politics';
  }
  if (category.includes('politic')) return 'politics';

  // Crypto keywords
  const cryptoKeywords = [
    'bitcoin', 'ethereum', 'crypto', 'btc', 'eth', 'sol', 'solana',
    'token', 'blockchain', 'defi',
  ];
  if (cryptoKeywords.some((kw) => title.includes(kw) || ticker.includes(kw))) {
    return 'crypto';
  }
  if (category.includes('crypto')) return 'crypto';

  // Economy keywords
  const economyKeywords = [
    'fed', 'interest rate', 'gdp', 'inflation', 'unemployment',
    'stock', 'index', 'dow', 'nasdaq', 's&p', 'fomc', 'recession',
    'cpi', 'jobs', 'economic',
  ];
  if (economyKeywords.some((kw) => title.includes(kw) || ticker.includes(kw))) {
    return 'economy';
  }
  if (category.includes('econom') || category.includes('financ')) return 'economy';

  // Default to entertainment
  return 'entertainment';
}

// ============================================
// Validation
// ============================================

/**
 * Check if a Kalshi market is valid for our game
 */
export function isValidKalshiMarket(market: KalshiMarket): boolean {
  // Must be a binary market
  if (market.market_type !== 'binary') return false;

  // Must have a ticker
  if (!market.ticker) return false;

  // Must not be void/cancelled
  if (market.result === 'void') return false;

  // Must have valid probabilities (implied from prices)
  const probYes = getYesProbability(market);
  if (isNaN(probYes) || probYes < 0 || probYes > 1) return false;

  return true;
}

/**
 * Check if a Kalshi market has real liquidity
 */
export function hasLiquidity(market: KalshiMarket): boolean {
  return (market.last_price ?? 0) > 0 ||
    ((market.yes_bid ?? 0) > 0 && (market.yes_ask ?? 100) < 100);
}

/**
 * Check if a market is a multivariate (MVE) parlay market
 */
export function isMVEMarket(market: KalshiMarket): boolean {
  return market.ticker.includes('MVE');
}

// ============================================
// Token Extraction
// ============================================

/**
 * Extract token mappings from a Kalshi market
 * Note: Kalshi doesn't have actual tokens, we create synthetic IDs
 */
export function extractTokenMappings(
  market: KalshiMarket
): Array<{ outcome: Outcome; outcomeLabel: string; tokenId: string }> {
  return [
    {
      outcome: 'a',
      outcomeLabel: market.yes_sub_title ?? 'Yes',
      tokenId: `${market.ticker}-yes`,
    },
    {
      outcome: 'b',
      outcomeLabel: market.no_sub_title ?? 'No',
      tokenId: `${market.ticker}-no`,
    },
  ];
}

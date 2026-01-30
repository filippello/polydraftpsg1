/**
 * Polymarket Transformers
 *
 * Functions to transform Polymarket-specific data formats
 * into the common VenueMarket format.
 */

import type { Event, EventCategory, Outcome } from '@/types';
import type { VenueMarket, VenueOutcome, VenueResolution } from '../types';
import { type GammaMarket, parseOutcomePrices, parseClobTokenIds } from './api';

// ============================================
// Market Transformation
// ============================================

/**
 * Transform a GammaMarket to VenueMarket format
 */
export function transformGammaToVenueMarket(market: GammaMarket): VenueMarket {
  const prices = parseOutcomePrices(market.outcomePrices);
  const probA = prices[0] ?? 0.5;
  const probB = prices[1] ?? 1 - probA;
  const probDraw = prices[2]; // May be undefined for binary markets

  // Check if this is a 3-outcome market (supports draw)
  const supportsDraw = market.outcomes.length === 3 && probDraw !== undefined;

  // Parse token IDs if available
  const tokenIds = parseClobTokenIds(market.clobTokenIds);

  // Build outcomes array
  const outcomes: VenueOutcome[] = [
    {
      label: market.outcomes[0] ?? 'Yes',
      tokenId: tokenIds[0],
      price: probA,
      position: 'a',
    },
    {
      label: market.outcomes[1] ?? 'No',
      tokenId: tokenIds[1],
      price: probB,
      position: 'b',
    },
  ];

  // Add draw outcome if supported
  if (supportsDraw) {
    outcomes.push({
      label: market.outcomes[2] ?? 'Draw',
      tokenId: tokenIds[2],
      price: probDraw!,
      position: 'draw',
    });
  }

  return {
    venueId: 'polymarket',
    venueMarketId: market.id,
    venueSlug: market.slug,
    venueConditionId: market.conditionId,

    title: market.question,
    description: market.description,
    imageUrl: market.image,

    outcomes,
    supportsDraw,

    outcomeAProbability: probA,
    outcomeBProbability: probB,
    outcomeDrawProbability: supportsDraw ? probDraw : undefined,

    isActive: market.active,
    isClosed: market.closed,
    isArchived: market.archived,

    endDate: market.endDate,
    volume: parseFloat(market.volume) || undefined,

    category: categorizeMarket(market),
    tags: market.tags,
  };
}

/**
 * Transform VenueMarket to Event format
 */
export function transformVenueMarketToEvent(market: VenueMarket): Partial<Event> {
  return {
    // Venue identification
    venue: market.venueId,
    venue_event_id: market.venueMarketId,
    venue_slug: market.venueSlug,

    // Legacy Polymarket fields (for backward compatibility)
    polymarket_market_id: market.venueMarketId,
    polymarket_condition_id: market.venueConditionId,
    polymarket_slug: market.venueSlug,

    // Event data
    title: market.title,
    description: market.description,
    image_url: market.imageUrl,

    // Outcomes
    outcome_a_label: market.outcomes[0]?.label ?? 'Yes',
    outcome_b_label: market.outcomes[1]?.label ?? 'No',
    outcome_a_probability: market.outcomeAProbability,
    outcome_b_probability: market.outcomeBProbability,

    // Draw support
    supports_draw: market.supportsDraw,
    outcome_draw_label: market.supportsDraw
      ? (market.outcomes[2]?.label ?? 'Draw')
      : undefined,
    outcome_draw_probability: market.outcomeDrawProbability,

    // Status
    status: market.isClosed
      ? 'resolved'
      : market.isActive
        ? 'active'
        : 'upcoming',

    // Metadata
    category: market.category,
    volume: market.volume,
    resolution_deadline_at: market.endDate,
  };
}

// ============================================
// Resolution Transformation
// ============================================

/**
 * Determine resolution from market data
 */
export function determineResolution(market: GammaMarket): VenueResolution {
  // Market not closed = not resolved
  if (!market.closed) {
    return { resolved: false };
  }

  // Parse outcome prices - winning outcome has price = 1 (or very close to it)
  const prices = parseOutcomePrices(market.outcomePrices);

  const outcomeAPrice = prices[0] ?? 0;
  const outcomeBPrice = prices[1] ?? 0;
  const outcomeDrawPrice = prices[2] ?? 0; // For 3-outcome markets

  // Threshold for "winning" (price close to 1)
  const WIN_THRESHOLD = 0.99;

  // If outcome A won (price ~= 1)
  if (outcomeAPrice >= WIN_THRESHOLD) {
    return {
      resolved: true,
      winningOutcome: 'a',
      winningPrice: outcomeAPrice,
    };
  }

  // If outcome B won (price ~= 1)
  if (outcomeBPrice >= WIN_THRESHOLD) {
    return {
      resolved: true,
      winningOutcome: 'b',
      winningPrice: outcomeBPrice,
    };
  }

  // If draw won (for 3-outcome markets like football)
  if (outcomeDrawPrice >= WIN_THRESHOLD) {
    return {
      resolved: true,
      winningOutcome: 'draw',
      winningPrice: outcomeDrawPrice,
    };
  }

  // Market is closed but no clear winner (edge case)
  // This might happen during settlement process
  return { resolved: false };
}

// ============================================
// Categorization
// ============================================

/**
 * Categorize a market based on tags/question
 */
export function categorizeMarket(market: GammaMarket): EventCategory {
  const question = market.question.toLowerCase();
  const tags = market.tags?.map((t) => t.toLowerCase()) ?? [];

  // Sports keywords
  const sportsKeywords = [
    'nba', 'nfl', 'mlb', 'nhl', 'soccer', 'football', 'basketball',
    'baseball', 'hockey', 'tennis', 'golf', 'f1', 'ufc', 'boxing',
    'win', 'championship', 'playoff', 'super bowl', 'world series',
    'premier league', 'champions league', 'la liga', 'serie a',
  ];

  if (sportsKeywords.some((kw) => question.includes(kw) || tags.includes(kw))) {
    return 'sports';
  }

  // Politics keywords
  const politicsKeywords = ['election', 'president', 'senate', 'congress', 'vote', 'poll'];
  if (politicsKeywords.some((kw) => question.includes(kw) || tags.includes(kw))) {
    return 'politics';
  }

  // Crypto keywords
  const cryptoKeywords = ['bitcoin', 'ethereum', 'crypto', 'btc', 'eth', 'price'];
  if (cryptoKeywords.some((kw) => question.includes(kw) || tags.includes(kw))) {
    return 'crypto';
  }

  // Default to entertainment
  return 'entertainment';
}

// ============================================
// Validation
// ============================================

/**
 * Check if a market is valid for our game
 */
export function isValidPolymarketMarket(market: GammaMarket): boolean {
  // Must have 2 or 3 outcomes (binary or with draw)
  if (market.outcomes.length < 2 || market.outcomes.length > 3) return false;

  // Must not be archived
  if (market.archived) return false;

  // Must have prices for all outcomes
  const prices = parseOutcomePrices(market.outcomePrices);
  if (prices.length < market.outcomes.length) return false;

  return true;
}

// ============================================
// Token Extraction
// ============================================

/**
 * Extract token mappings from a VenueMarket
 */
export function extractTokenMappings(
  market: VenueMarket
): Array<{ outcome: Outcome; outcomeLabel: string; tokenId: string }> {
  const mappings: Array<{ outcome: Outcome; outcomeLabel: string; tokenId: string }> = [];

  for (const outcome of market.outcomes) {
    if (outcome.tokenId) {
      mappings.push({
        outcome: outcome.position,
        outcomeLabel: outcome.label,
        tokenId: outcome.tokenId,
      });
    }
  }

  return mappings;
}

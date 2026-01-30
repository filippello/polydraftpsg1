/**
 * Jupiter Transformers
 *
 * Functions to transform Jupiter-specific data formats
 * into the common VenueMarket format.
 */

import type { Event, EventCategory, Outcome } from '@/types';
import type { VenueMarket, VenueOutcome, VenueResolution } from '../types';
import type { JupiterMarket, JupiterEvent } from './types';

// ============================================
// Market Transformation
// ============================================

/**
 * Transform a JupiterMarket to VenueMarket format
 */
export function transformJupiterToVenueMarket(market: JupiterMarket): VenueMarket {
  // Parse outcome prices
  const yesOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'yes');
  const noOutcome = market.outcomes.find((o) => o.name.toLowerCase() === 'no');

  const probYes = yesOutcome ? parseFloat(yesOutcome.price) : 0.5;
  const probNo = noOutcome ? parseFloat(noOutcome.price) : 1 - probYes;

  // Build outcomes array
  const outcomes: VenueOutcome[] = [
    {
      label: yesOutcome?.name ?? 'Yes',
      tokenId: yesOutcome?.tokenMint,
      price: probYes,
      position: 'a',
    },
    {
      label: noOutcome?.name ?? 'No',
      tokenId: noOutcome?.tokenMint,
      price: probNo,
      position: 'b',
    },
  ];

  // Jupiter markets are binary (no draw support)
  const supportsDraw = false;

  return {
    venueId: 'jupiter',
    venueMarketId: market.id,
    venueSlug: market.id, // Jupiter uses IDs, may need slug generation
    venueConditionId: market.marketPubkey,

    title: market.question,
    description: market.description,
    imageUrl: market.imageUrl,

    outcomes,
    supportsDraw,

    outcomeAProbability: probYes,
    outcomeBProbability: probNo,

    isActive: market.status === 'open' || market.status === 'locked',
    isClosed: market.status === 'resolved' || market.status === 'cancelled',
    isArchived: market.status === 'cancelled',

    endDate: market.lockedAt,
    volume: parseFloat(market.volume) || undefined,

    category: categorizeJupiterMarket(market),
  };
}

/**
 * Transform a JupiterEvent (with markets) to VenueMarkets
 */
export function transformJupiterEventToVenueMarkets(event: JupiterEvent): VenueMarket[] {
  return event.markets.map((market) => ({
    ...transformJupiterToVenueMarket(market),
    // Inherit event-level metadata
    imageUrl: market.imageUrl ?? event.imageUrl,
    category: categorizeJupiterMarket(market) ?? categorizeJupiterEvent(event),
  }));
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

    // Outcomes (map to Yes/No for Jupiter)
    outcome_a_label: market.outcomes[0]?.label ?? 'Yes',
    outcome_b_label: market.outcomes[1]?.label ?? 'No',
    outcome_a_probability: market.outcomeAProbability,
    outcome_b_probability: market.outcomeBProbability,

    // No draw support for Jupiter
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
    resolution_deadline_at: market.endDate,
  };
}

// ============================================
// Resolution Transformation
// ============================================

/**
 * Determine resolution from Jupiter market data
 */
export function determineResolution(market: JupiterMarket): VenueResolution {
  // Market not resolved
  if (market.status !== 'resolved') {
    return { resolved: false };
  }

  // No resolution value
  if (market.resolution === null || market.resolution === undefined) {
    return { resolved: false };
  }

  // Determine winning outcome
  const winningOutcome: Outcome = market.resolution === 'yes' ? 'a' : 'b';

  return {
    resolved: true,
    winningOutcome,
    winningPrice: 1.0,
    resolvedAt: market.resolvedAt,
  };
}

// ============================================
// Categorization
// ============================================

/**
 * Categorize a Jupiter market based on question/description
 */
export function categorizeJupiterMarket(market: JupiterMarket): EventCategory {
  const question = market.question.toLowerCase();

  // Crypto keywords (common on Jupiter/Solana)
  const cryptoKeywords = [
    'bitcoin', 'ethereum', 'solana', 'crypto', 'btc', 'eth', 'sol',
    'token', 'defi', 'nft', 'price', 'market cap', 'ath', 'atl',
  ];
  if (cryptoKeywords.some((kw) => question.includes(kw))) {
    return 'crypto';
  }

  // Sports keywords
  const sportsKeywords = [
    'nba', 'nfl', 'mlb', 'soccer', 'football', 'basketball',
    'win', 'championship', 'game', 'match', 'team',
  ];
  if (sportsKeywords.some((kw) => question.includes(kw))) {
    return 'sports';
  }

  // Politics keywords
  const politicsKeywords = [
    'election', 'president', 'senate', 'congress', 'vote', 'poll',
    'government', 'policy', 'bill', 'law',
  ];
  if (politicsKeywords.some((kw) => question.includes(kw))) {
    return 'politics';
  }

  // Economy keywords
  const economyKeywords = [
    'fed', 'interest rate', 'gdp', 'inflation', 'unemployment',
    'stock', 'index', 'dow', 'nasdaq', 's&p',
  ];
  if (economyKeywords.some((kw) => question.includes(kw))) {
    return 'economy';
  }

  // Default to entertainment
  return 'entertainment';
}

/**
 * Categorize a Jupiter event
 */
export function categorizeJupiterEvent(event: JupiterEvent): EventCategory {
  if (event.category) {
    const category = event.category.toLowerCase();
    if (category.includes('crypto') || category.includes('defi')) return 'crypto';
    if (category.includes('sport')) return 'sports';
    if (category.includes('politic')) return 'politics';
    if (category.includes('econom')) return 'economy';
  }

  // Use tags if available
  if (event.tags) {
    const tags = event.tags.map((t) => t.toLowerCase());
    if (tags.some((t) => t.includes('crypto'))) return 'crypto';
    if (tags.some((t) => t.includes('sport'))) return 'sports';
    if (tags.some((t) => t.includes('politic'))) return 'politics';
  }

  return 'entertainment';
}

// ============================================
// Validation
// ============================================

/**
 * Check if a Jupiter market is valid for our game
 */
export function isValidJupiterMarket(market: JupiterMarket): boolean {
  // Must have exactly 2 outcomes (binary market)
  if (market.outcomes.length !== 2) return false;

  // Must not be cancelled
  if (market.status === 'cancelled') return false;

  // Must have valid prices
  const prices = market.outcomes.map((o) => parseFloat(o.price));
  if (prices.some((p) => isNaN(p) || p < 0 || p > 1)) return false;

  // Prices should sum to approximately 1
  const sum = prices.reduce((a, b) => a + b, 0);
  if (sum < 0.9 || sum > 1.1) return false;

  return true;
}

// ============================================
// Token Extraction
// ============================================

/**
 * Extract token mappings from a Jupiter market
 */
export function extractTokenMappings(
  market: JupiterMarket
): Array<{ outcome: Outcome; outcomeLabel: string; tokenId: string }> {
  const mappings: Array<{ outcome: Outcome; outcomeLabel: string; tokenId: string }> = [];

  for (const outcome of market.outcomes) {
    const position: Outcome = outcome.name.toLowerCase() === 'yes' ? 'a' : 'b';
    mappings.push({
      outcome: position,
      outcomeLabel: outcome.name,
      tokenId: outcome.tokenMint,
    });
  }

  return mappings;
}

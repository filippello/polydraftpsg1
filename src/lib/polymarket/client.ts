/**
 * Polymarket API Client
 *
 * Integrates with Polymarket's Gamma API and CLOB API
 * to fetch market data, prices, and resolution status.
 */

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const CLOB_API_BASE = 'https://clob.polymarket.com';

// ============================================
// Types
// ============================================

export interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: string[];
  outcomePrices: string[];
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
}

export interface GammaMarketsResponse {
  markets: GammaMarket[];
  next_cursor?: string;
}

export interface ClobPrice {
  token_id: string;
  price: string;
}

export interface ResolutionResult {
  resolved: boolean;
  winningOutcome?: 'a' | 'b';
  winningPrice?: number;
}

// ============================================
// Gamma API (Market Metadata)
// ============================================

/**
 * Fetch markets from Gamma API
 */
export async function fetchMarkets(params: {
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<GammaMarket[]> {
  const searchParams = new URLSearchParams();

  if (params.active !== undefined) searchParams.set('active', String(params.active));
  if (params.closed !== undefined) searchParams.set('closed', String(params.closed));
  if (params.archived !== undefined) searchParams.set('archived', String(params.archived));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));

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
    console.error('Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ID
 */
export async function fetchMarket(marketId: string): Promise<GammaMarket | null> {
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
    console.error('Error fetching market:', error);
    return null;
  }
}

/**
 * Search markets by query
 */
export async function searchMarkets(query: string, limit: number = 20): Promise<GammaMarket[]> {
  try {
    const response = await fetch(
      `${GAMMA_API_BASE}/markets?search=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Gamma API error: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.markets ?? [];
  } catch (error) {
    console.error('Error searching markets:', error);
    return [];
  }
}

// ============================================
// CLOB API (Prices)
// ============================================

/**
 * Fetch current price for a token
 */
export async function fetchPrice(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(`${CLOB_API_BASE}/price?token_id=${tokenId}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 }, // Cache for 10 seconds (more real-time)
    });

    if (!response.ok) {
      throw new Error(`CLOB API error: ${response.status}`);
    }

    const data: ClobPrice = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching price:', error);
    return null;
  }
}

/**
 * Fetch midpoint price for a token
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

// ============================================
// Resolution Logic
// ============================================

/**
 * Check if a market is resolved and determine the winner
 */
export async function checkResolution(marketId: string): Promise<ResolutionResult> {
  const market = await fetchMarket(marketId);

  if (!market) {
    return { resolved: false };
  }

  // Market not closed = not resolved
  if (!market.closed) {
    return { resolved: false };
  }

  // Parse outcome prices - winning outcome has price = 1 (or very close to it)
  const prices = market.outcomePrices.map((p) => parseFloat(p));

  // Find the winning outcome (price closest to 1)
  const outcomeAPrice = prices[0] ?? 0;
  const outcomeBPrice = prices[1] ?? 0;

  // If outcome A won (price ~= 1)
  if (outcomeAPrice > 0.99) {
    return {
      resolved: true,
      winningOutcome: 'a',
      winningPrice: outcomeAPrice,
    };
  }

  // If outcome B won (price ~= 1)
  if (outcomeBPrice > 0.99) {
    return {
      resolved: true,
      winningOutcome: 'b',
      winningPrice: outcomeBPrice,
    };
  }

  // Market is closed but no clear winner (edge case)
  // This might happen during settlement process
  return { resolved: false };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Transform Polymarket market to our Event format
 */
export function transformMarketToEvent(market: GammaMarket) {
  const prices = market.outcomePrices.map((p) => parseFloat(p));
  const probA = prices[0] ?? 0.5;
  const probB = prices[1] ?? 1 - probA;

  return {
    polymarket_market_id: market.id,
    polymarket_condition_id: market.conditionId,
    polymarket_slug: market.slug,
    title: market.question,
    description: market.description,
    image_url: market.image,
    outcome_a_label: market.outcomes[0] ?? 'Yes',
    outcome_b_label: market.outcomes[1] ?? 'No',
    outcome_a_probability: probA,
    outcome_b_probability: probB,
    status: market.closed
      ? 'resolved'
      : market.active
        ? 'active'
        : 'upcoming',
    category: categorizeMarket(market),
  };
}

/**
 * Categorize a market based on tags/question
 */
function categorizeMarket(market: GammaMarket): string {
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

/**
 * Check if a market is valid for our game
 */
export function isValidMarket(market: GammaMarket): boolean {
  // Must have exactly 2 outcomes (binary)
  if (market.outcomes.length !== 2) return false;

  // Must not be archived
  if (market.archived) return false;

  // Must have prices
  if (!market.outcomePrices || market.outcomePrices.length < 2) return false;

  return true;
}

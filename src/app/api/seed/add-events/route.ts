/**
 * Seed API Route - Generalized Add Events
 *
 * POST /api/seed/add-events
 * Seeds the database with events from JSON files based on venue, period, and category
 *
 * Body: { venue: "polymarket" | "jupiter", period: "week4", category: "sports" }
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Venue alias mapping
const VENUE_ALIASES: Record<string, string> = {
  polymarket: 'poly',
  jupiter: 'jupi',
};

interface AddEventsRequest {
  venue: string;
  period: string;
  category: string;
  pool_slug?: string;
}

// Polymarket event format
interface PolymarketInputEvent {
  id: string;
  market_id: string;
  slug: string;
  title: string;
  sport: string;
  volume: number;
  start_time: string;
  end_date: string;
  has_draw: boolean;
  outcomes: string[];
  prices: number[];
  clob_ids: string[];
}

// Jupiter event format
interface JupiterInputEvent {
  id: string;
  title: string;
  sport: string;
  start_time: string;
  close_time: string;
  status: string;
  volume: number;
  has_draw: boolean;
  outcomes: string[]; // 2 or 3 (with Tie)
  prices: number[];   // 2 or 3
  market_ids: string[];
}

interface PolymarketInputData {
  generated_at: string;
  date_range: { start: string; end: string };
  sports: string[];
  events: PolymarketInputEvent[];
}

interface JupiterInputData {
  source: string;
  generated_at: string;
  date_range: { start: string; end: string };
  search_terms: string[];
  events: JupiterInputEvent[];
}

type InputData = PolymarketInputData | JupiterInputData;

/**
 * Load JSON from input directory
 * Pattern: input/{period}/{alias}_{period}_{category}.json
 */
function loadInputData(venue: string, period: string, category: string): InputData | null {
  const alias = VENUE_ALIASES[venue];
  if (!alias) return null;

  const filename = `${alias}_${period}_${category}.json`;
  const filePath = join(process.cwd(), 'input', period, filename);

  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as InputData;
  } catch {
    return null;
  }
}

/**
 * Map sport to subcategory
 */
function getSubcategoryFromSport(sport: string, slug: string): string {
  const slugPrefix = slug.split('-')[0]?.toLowerCase();

  const slugMap: Record<string, string> = {
    'epl': 'epl',
    'lal': 'laliga',
    'ucl': 'ucl',
    'nba': 'nba',
    'nhl': 'nhl',
    'nfl': 'nfl',
    'mlb': 'mlb',
  };

  if (slugMap[slugPrefix]) {
    return slugMap[slugPrefix];
  }

  // Direct sport mappings (for Jupiter format)
  const sportMap: Record<string, string> = {
    'laliga': 'laliga',
    'premier': 'epl',
    'nba': 'nba',
    'nhl': 'nhl',
    'nfl': 'nfl',
    'mlb': 'mlb',
    'ucl': 'ucl',
  };

  if (sportMap[sport.toLowerCase()]) {
    return sportMap[sport.toLowerCase()];
  }

  return sport.toLowerCase();
}

/**
 * Process Polymarket events
 */
async function processPolymarketEvents(
  data: PolymarketInputData,
  poolId: string,
  poolSlug: string,
  period: string,
  supabase: ReturnType<typeof createServiceClient>
) {

  const results: { success: string[]; failed: Array<{ slug: string; error: string }> } = {
    success: [],
    failed: [],
  };

  for (const event of data.events) {
    try {
      const subcategory = getSubcategoryFromSport(event.sport, event.slug);

      const outcomeALabel = event.outcomes[0];
      const outcomeBLabel = event.outcomes[1];

      const eventData = {
        polymarket_slug: event.slug,
        polymarket_market_id: event.market_id,
        polymarket_id: event.id,
        title: event.title,
        category: 'sports' as const,
        subcategory,
        outcome_a_label: outcomeALabel,
        outcome_b_label: outcomeBLabel,
        outcome_a_probability: event.prices[0],
        outcome_b_probability: event.prices[1],
        supports_draw: event.has_draw,
        volume: event.volume,
        event_start_at: event.start_time,
        resolution_deadline_at: event.end_date,
        status: 'upcoming',
        last_price_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pool_id: poolId,
        period: period,
      };

      const { data: upsertedEvent, error: eventError } = await supabase
        .from('events')
        .upsert(eventData, { onConflict: 'polymarket_slug' })
        .select('id')
        .single();

      if (eventError) {
        results.failed.push({ slug: event.slug, error: eventError.message });
        continue;
      }

      const tokens = [
        {
          event_id: upsertedEvent.id,
          outcome: 'a' as const,
          outcome_label: outcomeALabel,
          token_id: event.clob_ids[0],
        },
        {
          event_id: upsertedEvent.id,
          outcome: 'b' as const,
          outcome_label: outcomeBLabel,
          token_id: event.clob_ids[1],
        },
      ];

      const { error: tokensError } = await supabase
        .from('polymarket_tokens')
        .upsert(tokens, { onConflict: 'event_id,outcome' });

      if (tokensError) {
        console.error(`Token error for ${event.slug}:`, tokensError);
      }

      results.success.push(event.slug);
    } catch (err) {
      results.failed.push({
        slug: event.slug,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: 'Polymarket seed completed',
    venue: 'polymarket',
    pool_id: poolId,
    pool_slug: poolSlug,
    total: data.events.length,
    success: results.success.length,
    failed: results.failed.length,
    results,
  });
}

/**
 * Process Jupiter events
 */
async function processJupiterEvents(
  data: JupiterInputData,
  poolId: string,
  poolSlug: string,
  period: string,
  supabase: ReturnType<typeof createServiceClient>
) {
  const results: { success: string[]; failed: Array<{ id: string; error: string }> } = {
    success: [],
    failed: [],
  };

  for (const event of data.events) {
    try {
      const subcategory = getSubcategoryFromSport(event.sport, event.id);

      // Jupiter has 2 or 3 outcomes (3rd is Tie)
      const outcomeALabel = event.outcomes[0];
      const outcomeBLabel = event.outcomes[1];
      const outcomeDrawLabel = event.has_draw && event.outcomes[2] ? event.outcomes[2] : null;

      const outcomAProb = event.prices[0];
      const outcomeBProb = event.prices[1];
      const outcomeDrawProb = event.has_draw && event.prices[2] ? event.prices[2] : null;

      const eventData = {
        // Jupiter-specific fields
        venue: 'jupiter',
        venue_event_id: event.id,
        venue_slug: event.id, // Jupiter uses the same ID as slug

        // Common fields
        title: event.title,
        category: 'sports' as const,
        subcategory,
        outcome_a_label: outcomeALabel,
        outcome_b_label: outcomeBLabel,
        outcome_a_probability: outcomAProb,
        outcome_b_probability: outcomeBProb,
        outcome_draw_label: outcomeDrawLabel,
        outcome_draw_probability: outcomeDrawProb,
        supports_draw: event.has_draw,
        volume: event.volume,
        event_start_at: event.start_time,
        resolution_deadline_at: event.close_time,
        status: 'upcoming',
        last_price_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pool_id: poolId,
        period: period,
      };

      const { error: eventError } = await supabase
        .from('events')
        .upsert(eventData, { onConflict: 'venue,venue_event_id' })
        .select('id')
        .single();

      if (eventError) {
        results.failed.push({ id: event.id, error: eventError.message });
        continue;
      }

      results.success.push(event.id);
    } catch (err) {
      results.failed.push({
        id: event.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    message: 'Jupiter seed completed',
    venue: 'jupiter',
    pool_id: poolId,
    pool_slug: poolSlug,
    total: data.events.length,
    success: results.success.length,
    failed: results.failed.length,
    results,
  });
}

export async function POST(request: Request) {
  try {
    const body: AddEventsRequest = await request.json();
    const { venue, period, category, pool_slug } = body;

    // Validate required fields
    if (!venue || !period || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: venue, period, category' },
        { status: 400 }
      );
    }

    // Validate venue
    if (!VENUE_ALIASES[venue]) {
      return NextResponse.json(
        { error: `Unknown venue: ${venue}. Supported: ${Object.keys(VENUE_ALIASES).join(', ')}` },
        { status: 400 }
      );
    }

    // Load input data
    const data = loadInputData(venue, period, category);
    if (!data) {
      const alias = VENUE_ALIASES[venue];
      const expectedFile = `input/${period}/${alias}_${period}_${category}.json`;
      return NextResponse.json(
        { error: `Input file not found: ${expectedFile}` },
        { status: 404 }
      );
    }

    // Get or create pool
    const supabase = createServiceClient();

    // Generate pool slug from parameters if not provided
    const poolSlug = pool_slug || `${venue}-${period}-${category}`;
    const poolName = `${category.charAt(0).toUpperCase() + category.slice(1)} Pool - ${period}`;

    // Deactivate other pools for this venue/pack_type
    await supabase
      .from('pools')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('venue', venue)
      .eq('pack_type', category)
      .neq('slug', poolSlug);

    // Upsert pool (create if not exists, activate if exists)
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .upsert(
        {
          slug: poolSlug,
          name: poolName,
          venue,
          pack_type: category,
          period,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (poolError || !pool) {
      return NextResponse.json(
        { error: `Failed to create/get pool: ${poolError?.message}` },
        { status: 500 }
      );
    }

    const poolId = pool.id;

    // Process based on venue
    if (venue === 'polymarket') {
      return processPolymarketEvents(data as PolymarketInputData, poolId, poolSlug, period, supabase);
    } else if (venue === 'jupiter') {
      return processJupiterEvents(data as JupiterInputData, poolId, poolSlug, period, supabase);
    }

    return NextResponse.json({ error: 'Unknown venue' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to seed events',
    usage: {
      method: 'POST',
      body: {
        venue: 'polymarket | jupiter',
        period: 'week4',
        category: 'sports',
        pool_slug: 'week4-sports (optional, assigns events to a pool)',
      },
    },
    file_pattern: 'input/{period}/{venue_alias}_{period}_{category}.json',
    venue_aliases: VENUE_ALIASES,
  });
}

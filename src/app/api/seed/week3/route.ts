/**
 * Seed API Route - Week 3 Sports Events
 *
 * POST /api/seed/week3
 * Seeds the database with events from sports_week_3.json
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Load seed data at runtime using fs (not available in production)
function loadSeedData(): InputData | null {
  try {
    const filePath = join(process.cwd(), 'input', 'json', 'sports_week_3.json');
    if (!existsSync(filePath)) {
      return null;
    }
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as InputData;
  } catch {
    return null;
  }
}

interface InputEvent {
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

interface InputData {
  generated_at: string;
  date_range: { start: string; end: string };
  sports: string[];
  events: InputEvent[];
}

/**
 * Map sport to subcategory
 */
function getSubcategoryFromSport(sport: string, slug: string): string {
  // Check slug prefix first for more specific categorization
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

  // Fallback to sport name
  return sport.toLowerCase();
}

export async function POST() {
  const data = loadSeedData();

  if (!data) {
    return NextResponse.json(
      { error: 'Seed data not available in this environment' },
      { status: 404 }
    );
  }

  const supabase = createServiceClient();

  const results: { success: string[]; failed: Array<{ slug: string; error: string }> } = {
    success: [],
    failed: [],
  };

  for (const event of data.events) {
    try {
      const subcategory = getSubcategoryFromSport(event.sport, event.slug);

      // Determine outcome labels
      // For FOOTBALL with Yes/No, we use them as-is
      // For NBA/NHL, outcomes are team names
      const outcomeALabel = event.outcomes[0];
      const outcomeBLabel = event.outcomes[1];

      // Build event data for upsert
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
      };

      // Upsert event
      const { data: upsertedEvent, error: eventError } = await supabase
        .from('events')
        .upsert(eventData, { onConflict: 'polymarket_slug' })
        .select('id')
        .single();

      if (eventError) {
        results.failed.push({ slug: event.slug, error: eventError.message });
        continue;
      }

      // Insert tokens
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
        // Event was created, tokens failed - still count as partial success
      }

      results.success.push(event.slug);

    } catch (err) {
      results.failed.push({
        slug: event.slug,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    message: 'Seed completed',
    total: data.events.length,
    success: results.success.length,
    failed: results.failed.length,
    results,
  });
}

export async function GET() {
  const data = loadSeedData();

  if (!data) {
    return NextResponse.json({
      message: 'Seed data not available in this environment',
      available: false,
    });
  }

  return NextResponse.json({
    message: 'POST to this endpoint to seed week 3 events',
    events_count: data.events.length,
    available: true,
  });
}

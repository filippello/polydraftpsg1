/**
 * Explore Markets API Route
 *
 * GET /api/explore/markets
 * Returns events for the Explore mode, transformed to ExploreMarket format
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Event } from '@/types';
import type { ExploreMarket, ExploreOutcome } from '@/lib/jupiter/types';

// Hardcoded list of featured polymarket_ids for Explore mode
const FEATURED_POLYMARKET_IDS = [
  'POLY-31552',
  'POLY-33506',
  'POLY-34587',
  'POLY-67284',
  'POLY-16167',
  'POLY-42365',
  'POLY-31759',
  'POLY-86832',
];

/**
 * Transform a database Event to ExploreMarket format
 */
function transformEventToExploreMarket(event: Event): ExploreMarket {
  const outcomes: ExploreOutcome[] = [
    {
      id: `${event.id}-a`,
      label: event.outcome_a_label,
      probability: event.outcome_a_probability,
      clob_id: event.polymarket_market_id || event.venue_event_id || event.id,
    },
    {
      id: `${event.id}-b`,
      label: event.outcome_b_label,
      probability: event.outcome_b_probability,
      clob_id: event.polymarket_market_id || event.venue_event_id || event.id,
    },
  ];

  // Add draw outcome if supported
  if (event.supports_draw && event.outcome_draw_label && event.outcome_draw_probability) {
    outcomes.push({
      id: `${event.id}-draw`,
      label: event.outcome_draw_label,
      probability: event.outcome_draw_probability,
      clob_id: event.polymarket_market_id || event.venue_event_id || event.id,
    });
  }

  // Determine if binary (only Yes/No outcomes)
  const isBinary = outcomes.length === 2 &&
    (event.outcome_a_label === 'Yes' || event.outcome_b_label === 'No');

  // Map status
  let status: 'active' | 'closed' | 'resolved' = 'active';
  if (event.status === 'resolved') {
    status = 'resolved';
  } else if (event.status === 'pending_resolution') {
    status = 'closed';
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    image_url: event.image_url,
    category: event.category,
    subcategory: event.subcategory,
    volume: event.volume || 0,
    end_date: event.resolution_deadline_at || event.event_start_at || '',
    event_ticker: event.polymarket_slug || event.venue_slug,
    outcomes,
    is_binary: isBinary,
    status,
    created_at: event.created_at,
  };
}

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Fetch events by polymarket_id
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .in('polymarket_id', FEATURED_POLYMARKET_IDS)
      .order('volume', { ascending: false });

    if (error) {
      console.error('Error fetching explore markets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch markets' },
        { status: 500 }
      );
    }

    // Transform to ExploreMarket format
    const markets = (events || []).map(transformEventToExploreMarket);

    return NextResponse.json({
      markets,
      total: markets.length,
    });
  } catch (err) {
    console.error('Error in explore markets API:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

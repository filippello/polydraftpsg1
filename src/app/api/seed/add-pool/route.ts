/**
 * Seed API Route - Add Pool
 *
 * POST /api/seed/add-pool
 * Creates or updates a pool in the database
 *
 * Body: {
 *   venue: "polymarket" | "jupiter",
 *   slug: "week4-sports",
 *   name: "Sports Pool - Week 4",
 *   pack_type: "sports",
 *   min_events_required?: number,
 *   is_active?: boolean,
 *   starts_at?: string,
 *   ends_at?: string
 * }
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface AddPoolRequest {
  venue: string;
  slug: string;
  name: string;
  pack_type: string;
  min_events_required?: number;
  is_active?: boolean;
  starts_at?: string;
  ends_at?: string;
}

const SUPPORTED_VENUES = ['polymarket', 'jupiter'];

export async function POST(request: Request) {
  try {
    const body: AddPoolRequest = await request.json();
    const { venue, slug, name, pack_type, min_events_required, is_active, starts_at, ends_at } =
      body;

    // Validate required fields
    if (!venue || !slug || !name || !pack_type) {
      return NextResponse.json(
        { error: 'Missing required fields: venue, slug, name, pack_type' },
        { status: 400 }
      );
    }

    // Validate venue
    if (!SUPPORTED_VENUES.includes(venue)) {
      return NextResponse.json(
        { error: `Unknown venue: ${venue}. Supported: ${SUPPORTED_VENUES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const poolData = {
      slug,
      name,
      venue,
      pack_type,
      min_events_required: min_events_required ?? 5,
      is_active: is_active ?? true,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: pool, error } = await supabase
      .from('pools')
      .upsert(poolData, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Pool created/updated successfully',
      pool,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to create/update a pool',
    usage: {
      method: 'POST',
      body: {
        venue: 'polymarket | jupiter',
        slug: 'week4-sports (unique identifier)',
        name: 'Sports Pool - Week 4',
        pack_type: 'sports',
        min_events_required: '5 (optional, default: 5)',
        is_active: 'true (optional, default: true)',
        starts_at: 'ISO date string (optional)',
        ends_at: 'ISO date string (optional)',
      },
    },
    supported_venues: SUPPORTED_VENUES,
  });
}

/**
 * Supabase Events Functions
 *
 * Functions for fetching, updating, and syncing events from Supabase.
 */

import { createServiceClient } from './server';
import type { Event, PolymarketToken, PriceSyncResult, PolymarketEventInput, Outcome } from '@/types';

// ============================================
// Event Fetching
// ============================================

/**
 * Fetch all active events from the database
 */
export async function getActiveEvents(): Promise<Event[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'active'])
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Error fetching active events:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch events that need price sync (active with polymarket_market_id)
 */
export async function getEventsForPriceSync(): Promise<Event[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'active'])
    .not('polymarket_market_id', 'is', null)
    .order('last_price_sync_at', { ascending: true, nullsFirst: true })
    .limit(50);

  if (error) {
    console.error('Error fetching events for price sync:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Fetch a single event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data;
}

// ============================================
// Price Updates
// ============================================

/**
 * Update event probabilities from Polymarket
 */
export async function updateEventProbabilities(
  eventId: string,
  probA: number,
  probB: number,
  probDraw?: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {
    outcome_a_probability: probA,
    outcome_b_probability: probB,
    last_price_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (probDraw !== undefined) {
    updateData.outcome_draw_probability = probDraw;
  }

  const { error } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', eventId);

  if (error) {
    console.error('Error updating event probabilities:', error);
    return false;
  }

  return true;
}

/**
 * Batch update multiple event probabilities
 */
export async function batchUpdateEventProbabilities(
  updates: PriceSyncResult[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const update of updates) {
    const result = await updateEventProbabilities(
      update.event_id,
      update.outcome_a_probability,
      update.outcome_b_probability,
      update.outcome_draw_probability
    );

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// ============================================
// Polymarket Tokens
// ============================================

/**
 * Get tokens for an event
 */
export async function getEventTokens(eventId: string): Promise<PolymarketToken[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('polymarket_tokens')
    .select('*')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event tokens:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Upsert tokens for an event
 */
export async function upsertEventTokens(
  eventId: string,
  tokens: Array<{ outcome: 'a' | 'b' | 'draw'; token_id: string }>
): Promise<boolean> {
  const supabase = createServiceClient();

  const tokenRecords = tokens.map((t) => ({
    event_id: eventId,
    outcome: t.outcome,
    token_id: t.token_id,
  }));

  const { error } = await supabase
    .from('polymarket_tokens')
    .upsert(tokenRecords, { onConflict: 'event_id,outcome' });

  if (error) {
    console.error('Error upserting event tokens:', error);
    return false;
  }

  return true;
}

/**
 * Update token price
 */
export async function updateTokenPrice(
  tokenId: string,
  price: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('polymarket_tokens')
    .update({
      last_price: price,
      last_updated_at: new Date().toISOString(),
    })
    .eq('token_id', tokenId);

  if (error) {
    console.error('Error updating token price:', error);
    return false;
  }

  return true;
}

// ============================================
// Sync Logging
// ============================================

/**
 * Create a sync log entry
 */
export async function createSyncLog(syncType: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('polymarket_sync_log')
    .insert({
      sync_type: syncType,
      status: 'running',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating sync log:', error);
    return null;
  }

  return data.id;
}

/**
 * Complete a sync log entry
 */
export async function completeSyncLog(
  logId: string,
  eventsSynced: number,
  errors: unknown[] = []
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('polymarket_sync_log')
    .update({
      status: errors.length > 0 ? 'failed' : 'completed',
      completed_at: new Date().toISOString(),
      events_synced: eventsSynced,
      errors,
    })
    .eq('id', logId);

  if (error) {
    console.error('Error completing sync log:', error);
    return false;
  }

  return true;
}

// ============================================
// Resolution Queue
// ============================================

/**
 * Get events pending resolution check
 */
export async function getEventsToResolve(): Promise<Event[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('resolution_queue')
    .select('event_id, events(*)')
    .lte('next_check_at', new Date().toISOString())
    .order('priority', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching resolution queue:', error);
    return [];
  }

  return data?.map((row) => row.events as unknown as Event).filter(Boolean) ?? [];
}

/**
 * Update resolution queue entry after check
 */
export async function updateResolutionQueueEntry(
  eventId: string,
  resolved: boolean
): Promise<boolean> {
  const supabase = createServiceClient();

  if (resolved) {
    // Remove from queue if resolved
    const { error } = await supabase
      .from('resolution_queue')
      .delete()
      .eq('event_id', eventId);

    if (error) {
      console.error('Error removing from resolution queue:', error);
      return false;
    }
  } else {
    // Update check count and schedule next check (exponential backoff)
    const { data: current } = await supabase
      .from('resolution_queue')
      .select('check_count')
      .eq('event_id', eventId)
      .single();

    const checkCount = (current?.check_count ?? 0) + 1;
    const nextCheckMinutes = Math.min(60 * Math.pow(2, checkCount - 1), 1440); // Max 24 hours

    const { error } = await supabase
      .from('resolution_queue')
      .update({
        check_count: checkCount,
        last_check_at: new Date().toISOString(),
        next_check_at: new Date(Date.now() + nextCheckMinutes * 60 * 1000).toISOString(),
      })
      .eq('event_id', eventId);

    if (error) {
      console.error('Error updating resolution queue:', error);
      return false;
    }
  }

  return true;
}

// ============================================
// Polymarket Event Upsert
// ============================================

/**
 * Extract subcategory from polymarket_slug
 * Examples: "epl-ars-mun-2026-01-25" → "epl", "ucl-bay-usg1-2026-01-21" → "ucl"
 */
function extractSubcategoryFromSlug(slug: string): string | undefined {
  const prefix = slug.split('-')[0]?.toLowerCase();
  const knownPrefixes = ['epl', 'ucl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'mls'];
  return knownPrefixes.includes(prefix) ? prefix : undefined;
}

/**
 * Map outcome label to outcome type ('a', 'b', 'draw')
 */
function mapOutcomeToType(
  outcomeLabel: string,
  outcomeALabel: string,
  outcomeBLabel: string,
  outcomeDrawLabel?: string | null
): Outcome | null {
  if (outcomeLabel === outcomeALabel) return 'a';
  if (outcomeLabel === outcomeBLabel) return 'b';
  if (outcomeDrawLabel && outcomeLabel === outcomeDrawLabel) return 'draw';
  return null;
}

/**
 * Fetch a single event by polymarket_slug (UNIQUE identifier)
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('polymarket_slug', slug)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // Not found is expected
      console.error('Error fetching event by slug:', error);
    }
    return null;
  }

  return data;
}

/**
 * Upsert an event from Polymarket data
 * Uses polymarket_slug as the unique identifier
 */
export async function upsertEventFromPolymarket(
  data: PolymarketEventInput
): Promise<string | null> {
  const supabase = createServiceClient();

  // Extract subcategory from slug
  const subcategory = extractSubcategoryFromSlug(data.polymarket_slug);

  // Map status from Polymarket to our status
  const statusMap: Record<string, string> = {
    active: 'active',
    upcoming: 'upcoming',
    resolved: 'resolved',
    cancelled: 'cancelled',
  };

  const eventData = {
    polymarket_slug: data.polymarket_slug,
    polymarket_market_id: data.polymarket_market_id,
    polymarket_id: data.id,
    title: data.title,
    category: 'sports' as const, // Sport events map to 'sports' category
    subcategory,
    outcome_a_label: data.outcome_a_label,
    outcome_b_label: data.outcome_b_label,
    outcome_a_probability: data.outcome_a_probability,
    outcome_b_probability: data.outcome_b_probability,
    outcome_draw_label: data.outcome_draw_label,
    outcome_draw_probability: data.outcome_draw_probability,
    supports_draw: data.supports_draw,
    volume: data.volume,
    event_start_at: data.start_time,
    resolution_deadline_at: data.end_date,
    status: statusMap[data.status] ?? 'upcoming',
    last_price_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Upsert event by polymarket_slug
  const { data: upsertedEvent, error: eventError } = await supabase
    .from('events')
    .upsert(eventData, { onConflict: 'polymarket_slug' })
    .select('id')
    .single();

  if (eventError) {
    console.error('Error upserting event from Polymarket:', eventError);
    return null;
  }

  const eventId = upsertedEvent.id;

  // Upsert tokens with outcome mapping
  const tokenRecords: Array<{
    event_id: string;
    outcome: Outcome;
    outcome_label: string;
    token_id: string;
  }> = [];

  for (const token of data.clob_token_ids) {
    const outcomeType = mapOutcomeToType(
      token.outcome,
      data.outcome_a_label,
      data.outcome_b_label,
      data.outcome_draw_label
    );

    if (outcomeType) {
      tokenRecords.push({
        event_id: eventId,
        outcome: outcomeType,
        outcome_label: token.outcome,
        token_id: token.token_id,
      });
    }
  }

  if (tokenRecords.length > 0) {
    const { error: tokensError } = await supabase
      .from('polymarket_tokens')
      .upsert(tokenRecords, { onConflict: 'event_id,outcome' });

    if (tokensError) {
      console.error('Error upserting event tokens:', tokensError);
      // Event was created, but tokens failed - still return event ID
    }
  }

  return eventId;
}

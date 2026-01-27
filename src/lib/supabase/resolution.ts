/**
 * Supabase Resolution Functions
 *
 * Functions for resolving events and picks.
 */

import { createServiceClient } from './server';
import { calculatePoints, calculatePackBonus } from '../scoring/calculator';
import type { Event, Outcome, UserPick } from '@/types';

// ============================================
// Types
// ============================================

interface PickWithPackInfo extends UserPick {
  user_packs: {
    id: string;
    profile_id: string;
  };
}

interface ResolutionStats {
  picksResolved: number;
  packsUpdated: number;
  profilesUpdated: number;
  totalPointsAwarded: number;
}

// ============================================
// Event Resolution
// ============================================

/**
 * Resolve an event with the winning outcome
 * Updates the events table with status='resolved' and winning_outcome
 */
export async function resolveEvent(
  eventId: string,
  winningOutcome: Outcome
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('events')
    .update({
      status: 'resolved',
      winning_outcome: winningOutcome,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);

  if (error) {
    console.error('Error resolving event:', error);
    return false;
  }

  return true;
}

// ============================================
// Pick Resolution
// ============================================

/**
 * Get all unresolved picks for a specific event
 */
export async function getUnresolvedPicksForEvent(
  eventId: string
): Promise<PickWithPackInfo[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_picks')
    .select(`
      *,
      user_packs!inner (
        id,
        profile_id
      )
    `)
    .eq('event_id', eventId)
    .eq('is_resolved', false);

  if (error) {
    console.error('Error fetching unresolved picks for event:', error);
    return [];
  }

  return (data as unknown as PickWithPackInfo[]) ?? [];
}

/**
 * Resolve all picks for an event
 * Calculates is_correct and points_awarded for each pick
 */
export async function resolvePicksForEvent(
  eventId: string,
  winningOutcome: Outcome
): Promise<ResolutionStats> {
  const supabase = createServiceClient();
  const stats: ResolutionStats = {
    picksResolved: 0,
    packsUpdated: 0,
    profilesUpdated: 0,
    totalPointsAwarded: 0,
  };

  // Get all unresolved picks for this event
  const picks = await getUnresolvedPicksForEvent(eventId);

  if (picks.length === 0) {
    return stats;
  }

  // Process each pick
  const packIds = new Set<string>();
  const profileIds = new Set<string>();

  for (const pick of picks) {
    const isCorrect = pick.picked_outcome === winningOutcome;

    // Calculate points using the scoring calculator
    const scoringResult = calculatePoints({
      probabilityAtPick: pick.probability_snapshot,
      isCorrect,
    });

    // Update the pick
    const { error } = await supabase
      .from('user_picks')
      .update({
        is_resolved: true,
        is_correct: isCorrect,
        points_awarded: scoringResult.points,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', pick.id);

    if (error) {
      console.error('Error updating pick resolution:', pick.id, error);
      continue;
    }

    stats.picksResolved++;
    stats.totalPointsAwarded += scoringResult.points;
    packIds.add(pick.user_pack_id);
    profileIds.add(pick.user_packs.profile_id);
  }

  // Recalculate pack totals for affected packs
  for (const packId of Array.from(packIds)) {
    const updated = await recalculatePackTotals(packId);
    if (updated) {
      stats.packsUpdated++;
    }
  }

  stats.profilesUpdated = profileIds.size;

  return stats;
}

// ============================================
// Pack Totals Recalculation
// ============================================

/**
 * Recalculate total points and correct picks for a pack
 * Called after resolving picks
 */
export async function recalculatePackTotals(packId: string): Promise<boolean> {
  const supabase = createServiceClient();

  // Get all picks for this pack
  const { data: picks, error: fetchError } = await supabase
    .from('user_picks')
    .select('*')
    .eq('user_pack_id', packId);

  if (fetchError) {
    console.error('Error fetching picks for pack:', packId, fetchError);
    return false;
  }

  if (!picks || picks.length === 0) {
    return false;
  }

  // Calculate totals
  const resolvedPicks = picks.filter((p) => p.is_resolved);
  const correctPicks = resolvedPicks.filter((p) => p.is_correct);
  const totalPickPoints = resolvedPicks.reduce((sum, p) => sum + (p.points_awarded ?? 0), 0);

  // Determine resolution status
  const allResolved = resolvedPicks.length === picks.length;
  const someResolved = resolvedPicks.length > 0;

  let resolutionStatus: 'pending' | 'partially_resolved' | 'fully_resolved' = 'pending';
  if (allResolved) {
    resolutionStatus = 'fully_resolved';
  } else if (someResolved) {
    resolutionStatus = 'partially_resolved';
  }

  // Calculate pack bonus if fully resolved
  let packBonus = 0;
  if (allResolved) {
    packBonus = calculatePackBonus(correctPicks.length, picks.length);
  }

  const totalPoints = Math.round((totalPickPoints + packBonus) * 100) / 100;

  // Update the pack
  const updateData: Record<string, unknown> = {
    resolution_status: resolutionStatus,
    total_points: totalPoints,
    correct_picks: correctPicks.length,
    updated_at: new Date().toISOString(),
  };

  if (allResolved) {
    updateData.fully_resolved_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('user_packs')
    .update(updateData)
    .eq('id', packId);

  if (updateError) {
    console.error('Error updating pack totals:', packId, updateError);
    return false;
  }

  return true;
}

// ============================================
// Event Status Updates
// ============================================

/**
 * Update event status to 'active' when event starts
 */
export async function updateActiveEvents(): Promise<number> {
  const supabase = createServiceClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .update({
      status: 'active',
      updated_at: now,
    })
    .eq('status', 'upcoming')
    .lte('event_start_at', now)
    .select('id');

  if (error) {
    console.error('Error updating active events:', error);
    return 0;
  }

  return data?.length ?? 0;
}

// ============================================
// Resolution Helpers
// ============================================

/**
 * Get event details by ID including polymarket_market_id
 */
export async function getEventForResolution(eventId: string): Promise<Event | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event for resolution:', error);
    return null;
  }

  return data as Event;
}

/**
 * Get all picks for multiple events (for batch sync)
 */
export async function getPicksForEvents(eventIds: string[]): Promise<Record<string, UserPick[]>> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_picks')
    .select('*')
    .in('event_id', eventIds);

  if (error) {
    console.error('Error fetching picks for events:', error);
    return {};
  }

  // Group by event_id
  const picksByEvent: Record<string, UserPick[]> = {};
  for (const pick of data ?? []) {
    if (!picksByEvent[pick.event_id]) {
      picksByEvent[pick.event_id] = [];
    }
    picksByEvent[pick.event_id].push(pick as UserPick);
  }

  return picksByEvent;
}

/**
 * Check if a string is a valid UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Get events by IDs or slugs with their status and winning outcome
 * Supports both UUIDs and polymarket_slug for backward compatibility
 */
export async function getEventsById(eventIds: string[]): Promise<Event[]> {
  const supabase = createServiceClient();

  if (eventIds.length === 0) return [];

  // Separate UUIDs from slugs
  const uuids = eventIds.filter(isUUID);
  const slugs = eventIds.filter((id) => !isUUID(id));

  const results: Event[] = [];

  // Query by UUID if any
  if (uuids.length > 0) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('id', uuids);

    if (error) {
      console.error('Error fetching events by IDs:', error);
    } else if (data) {
      results.push(...(data as Event[]));
    }
  }

  // Query by slug if any
  if (slugs.length > 0) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('polymarket_slug', slugs);

    if (error) {
      console.error('Error fetching events by slugs:', error);
    } else if (data) {
      results.push(...(data as Event[]));
    }
  }

  return results;
}

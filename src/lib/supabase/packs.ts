/**
 * Supabase Packs Functions
 *
 * Functions for managing user packs and picks in the database.
 */

import { createServiceClient } from './server';
import type { UserPack, UserPick, Outcome } from '@/types';

// ============================================
// Constants
// ============================================

export const WEEKLY_PACK_LIMIT = 2;

// ============================================
// Week Calculations
// ============================================

/**
 * Get the start of the current week (Monday 00:00:00 UTC)
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust so Monday is first day
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get the end of the current week (Sunday 23:59:59 UTC)
 */
export function getCurrentWeekEnd(): Date {
  const weekStart = getCurrentWeekStart();
  const sunday = new Date(weekStart);
  sunday.setUTCDate(weekStart.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday;
}

// ============================================
// Types
// ============================================

export interface CreatePackInput {
  id: string;
  profileId: string;
  anonymousId?: string;
  packTypeSlug: string;
  openedAt: string;
  isPremium?: boolean;
  paymentSignature?: string;
  paymentAmount?: number;
  buyerWallet?: string;
}

export interface CreatePickInput {
  id: string;
  userPackId: string;
  eventId: string;
  position: number;
  pickedOutcome: Outcome;
  pickedAt: string;
  probabilitySnapshot: number;
  oppositeProbabilitySnapshot: number;
  drawProbabilitySnapshot?: number;
}

// ============================================
// Pack Operations
// ============================================

/**
 * Get pack type by slug
 */
async function getPackTypeBySlug(slug: string): Promise<{ id: string } | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('pack_types')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching pack type:', error);
    return null;
  }

  return data;
}

/**
 * Create a new user pack in the database
 */
export async function createPack(input: CreatePackInput): Promise<string | null> {
  const supabase = createServiceClient();

  // Look up the pack type by slug to get the real UUID
  const packType = await getPackTypeBySlug(input.packTypeSlug);
  if (!packType) {
    console.error('Pack type not found for slug:', input.packTypeSlug);
    return null;
  }

  const insertData: Record<string, unknown> = {
    id: input.id,
    profile_id: input.profileId,
    ...(input.anonymousId && { anonymous_id: input.anonymousId }),
    pack_type_id: packType.id,
    opened_at: input.openedAt,
    resolution_status: 'pending',
    current_reveal_index: 0,
    total_points: 0,
    correct_picks: 0,
    created_at: input.openedAt,
    updated_at: input.openedAt,
  };

  if (input.isPremium) {
    insertData.is_premium = true;
    insertData.payment_signature = input.paymentSignature;
    insertData.payment_amount = input.paymentAmount;
    insertData.buyer_wallet = input.buyerWallet;
  }

  const { data, error } = await supabase
    .from('user_packs')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating pack:', error);
    return null;
  }

  return data.id;
}

/**
 * Look up event UUID by slug (the slug is used as ID in the pool)
 */
async function getEventUuidBySlug(slug: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('events')
    .select('id')
    .eq('polymarket_slug', slug)
    .single();

  if (error) {
    console.error('Error fetching event by slug:', slug, error);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Create picks for a pack
 */
export async function createPicks(picks: CreatePickInput[]): Promise<boolean> {
  const supabase = createServiceClient();

  // Look up real UUIDs for all events
  const picksToInsert = await Promise.all(
    picks.map(async (pick) => {
      // The eventId from the pool is actually the slug, look up the real UUID
      const realEventId = await getEventUuidBySlug(pick.eventId);

      if (!realEventId) {
        console.error('Event not found in database for slug:', pick.eventId);
        return null;
      }

      return {
        // Don't pass id - let the database generate a proper UUID
        user_pack_id: pick.userPackId,
        event_id: realEventId,
        position: pick.position,
        picked_outcome: pick.pickedOutcome,
        picked_at: pick.pickedAt,
        probability_snapshot: pick.probabilitySnapshot,
        opposite_probability_snapshot: pick.oppositeProbabilitySnapshot,
        draw_probability_snapshot: pick.drawProbabilitySnapshot,
        is_resolved: false,
        points_awarded: 0,
        reveal_animation_played: false,
        created_at: pick.pickedAt,
      };
    })
  );

  // Filter out any null picks (events not found)
  const validPicks = picksToInsert.filter((p) => p !== null);

  if (validPicks.length === 0) {
    console.error('No valid picks to insert - events not found in database');
    return false;
  }

  if (validPicks.length !== picks.length) {
    console.warn(`Only ${validPicks.length} of ${picks.length} events found in database`);
  }

  const { error } = await supabase.from('user_picks').insert(validPicks);

  if (error) {
    console.error('Error creating picks:', error);
    return false;
  }

  return true;
}

/**
 * Create a pack with all its picks in a single operation
 */
export async function createPackWithPicks(
  packInput: CreatePackInput,
  picksInput: Omit<CreatePickInput, 'userPackId'>[]
): Promise<{ packId: string } | null> {
  // Create the pack first
  const packId = await createPack(packInput);
  if (!packId) {
    return null;
  }

  // Create the picks
  const picksWithPackId = picksInput.map((pick) => ({
    ...pick,
    userPackId: packId,
  }));

  const picksCreated = await createPicks(picksWithPackId);
  if (!picksCreated) {
    // We could delete the pack here, but for simplicity we'll leave it
    console.error('Failed to create picks for pack:', packId);
    return null;
  }

  return { packId };
}

/**
 * Get a pack by ID with its picks
 */
export async function getPackById(packId: string): Promise<UserPack | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_packs')
    .select(`
      *,
      picks:user_picks(*)
    `)
    .eq('id', packId)
    .single();

  if (error) {
    console.error('Error fetching pack:', error);
    return null;
  }

  return data as unknown as UserPack;
}

/**
 * Get all packs for a profile
 */
export async function getPacksByProfileId(
  profileId: string
): Promise<UserPack[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_packs')
    .select(`
      *,
      picks:user_picks(*)
    `)
    .eq('profile_id', profileId)
    .order('opened_at', { ascending: false });

  if (error) {
    console.error('Error fetching packs:', error);
    return [];
  }

  return (data as unknown as UserPack[]) ?? [];
}

/**
 * Update pack resolution status
 */
export async function updatePackResolution(
  packId: string,
  status: 'pending' | 'partially_resolved' | 'fully_resolved',
  totalPoints?: number,
  correctPicks?: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const updateData: Record<string, unknown> = {
    resolution_status: status,
    updated_at: new Date().toISOString(),
  };

  if (totalPoints !== undefined) {
    updateData.total_points = totalPoints;
  }

  if (correctPicks !== undefined) {
    updateData.correct_picks = correctPicks;
  }

  if (status === 'fully_resolved') {
    updateData.fully_resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('user_packs')
    .update(updateData)
    .eq('id', packId);

  if (error) {
    console.error('Error updating pack resolution:', error);
    return false;
  }

  return true;
}

// ============================================
// Pick Operations
// ============================================

/**
 * Update a pick after resolution
 */
export async function updatePickResolution(
  pickId: string,
  isCorrect: boolean,
  pointsAwarded: number
): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('user_picks')
    .update({
      is_resolved: true,
      is_correct: isCorrect,
      resolved_at: new Date().toISOString(),
      points_awarded: pointsAwarded,
    })
    .eq('id', pickId);

  if (error) {
    console.error('Error updating pick resolution:', error);
    return false;
  }

  return true;
}

/**
 * Mark a pick's reveal animation as played
 */
export async function markPickRevealed(pickId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from('user_picks')
    .update({
      reveal_animation_played: true,
    })
    .eq('id', pickId);

  if (error) {
    console.error('Error marking pick revealed:', error);
    return false;
  }

  return true;
}

/**
 * Get picks for a specific event across all packs for a profile
 */
export async function getPicksForEvent(
  profileId: string,
  eventId: string
): Promise<UserPick[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_picks')
    .select(`
      *,
      user_packs!inner(profile_id)
    `)
    .eq('user_packs.profile_id', profileId)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching picks for event:', error);
    return [];
  }

  return (data as unknown as UserPick[]) ?? [];
}

/**
 * Check if a pack already exists in the database
 */
export async function packExists(packId: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_packs')
    .select('id')
    .eq('id', packId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return false;
    }
    console.error('Error checking pack existence:', error);
    return false;
  }

  return !!data;
}

// ============================================
// Weekly Pack Limit
// ============================================

export interface WeeklyPackStatus {
  packsOpenedThisWeek: number;
  packsRemaining: number;
  canOpenPack: boolean;
  weeklyLimit: number;
  weekStartsAt: string;
  weekEndsAt: string;
}

/**
 * Count how many packs a profile has opened this week
 */
export async function countWeeklyPacks(profileId: string): Promise<number> {
  const supabase = createServiceClient();
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();

  const { count, error } = await supabase
    .from('user_packs')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('is_premium', false)
    .gte('opened_at', weekStart.toISOString())
    .lte('opened_at', weekEnd.toISOString());

  if (error) {
    console.error('Error counting weekly packs:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get the weekly pack status for a profile
 */
export async function getWeeklyPackStatus(profileId: string): Promise<WeeklyPackStatus> {
  const packsOpenedThisWeek = await countWeeklyPacks(profileId);
  const packsRemaining = Math.max(0, WEEKLY_PACK_LIMIT - packsOpenedThisWeek);
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();

  return {
    packsOpenedThisWeek,
    packsRemaining,
    canOpenPack: packsRemaining > 0,
    weeklyLimit: WEEKLY_PACK_LIMIT,
    weekStartsAt: weekStart.toISOString(),
    weekEndsAt: weekEnd.toISOString(),
  };
}

/**
 * Check if a profile can open a pack (hasn't reached weekly limit)
 */
export async function canOpenPack(profileId: string): Promise<boolean> {
  const status = await getWeeklyPackStatus(profileId);
  return status.canOpenPack;
}

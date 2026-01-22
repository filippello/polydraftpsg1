/**
 * Supabase Packs Functions
 *
 * Functions for managing user packs and picks in the database.
 */

import { createServiceClient } from './server';
import type { UserPack, UserPick, Outcome } from '@/types';

// ============================================
// Types
// ============================================

export interface CreatePackInput {
  id: string;
  profileId: string;
  packTypeId: string;
  packTypeSlug: string;
  openedAt: string;
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
 * Create a new user pack in the database
 */
export async function createPack(input: CreatePackInput): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_packs')
    .insert({
      id: input.id,
      profile_id: input.profileId,
      pack_type_id: input.packTypeId,
      pack_type_slug: input.packTypeSlug,
      opened_at: input.openedAt,
      resolution_status: 'pending',
      current_reveal_index: 0,
      total_points: 0,
      correct_picks: 0,
      created_at: input.openedAt,
      updated_at: input.openedAt,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating pack:', error);
    return null;
  }

  return data.id;
}

/**
 * Create picks for a pack
 */
export async function createPicks(picks: CreatePickInput[]): Promise<boolean> {
  const supabase = createServiceClient();

  const picksToInsert = picks.map((pick) => ({
    id: pick.id,
    user_pack_id: pick.userPackId,
    event_id: pick.eventId,
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
  }));

  const { error } = await supabase.from('user_picks').insert(picksToInsert);

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

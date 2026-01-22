/**
 * Supabase Leaderboard Functions
 *
 * Functions for managing the weekly leaderboard.
 */

import { createServiceClient } from './server';

// ============================================
// Types
// ============================================

export interface LeaderboardEntry {
  rank: number;
  profileId: string;
  displayName: string;
  totalPoints: number;
  packsOpened: number;
  accuracy: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  userRank?: number;
  userPoints?: number;
}

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

/**
 * Get a unique identifier for the current week (YYYY-WW format)
 */
export function getCurrentWeekId(): string {
  const weekStart = getCurrentWeekStart();
  const year = weekStart.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const pastDays = Math.floor(
    (weekStart.getTime() - startOfYear.getTime()) / 86400000
  );
  const weekNumber = Math.ceil((pastDays + startOfYear.getUTCDay() + 1) / 7);
  return `${year}-${String(weekNumber).padStart(2, '0')}`;
}

// ============================================
// Leaderboard Operations
// ============================================

/**
 * Get or create the current week's leaderboard
 */
export async function getOrCreateWeeklyLeaderboard(): Promise<string | null> {
  const supabase = createServiceClient();
  const weekId = getCurrentWeekId();
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();

  // Try to get existing leaderboard
  const { data: existing, error: selectError } = await supabase
    .from('leaderboards')
    .select('id')
    .eq('period_type', 'weekly')
    .eq('period_identifier', weekId)
    .single();

  if (existing && !selectError) {
    return existing.id;
  }

  // Create new leaderboard
  const { data: created, error: insertError } = await supabase
    .from('leaderboards')
    .insert({
      period_type: 'weekly',
      period_identifier: weekId,
      starts_at: weekStart.toISOString(),
      ends_at: weekEnd.toISOString(),
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) {
    // Might have been created by another request, try to get it again
    const { data: retry } = await supabase
      .from('leaderboards')
      .select('id')
      .eq('period_type', 'weekly')
      .eq('period_identifier', weekId)
      .single();

    return retry?.id ?? null;
  }

  return created?.id ?? null;
}

/**
 * Get the current week's leaderboard entries
 */
export async function getCurrentWeekLeaderboard(
  limit: number = 10,
  offset: number = 0,
  anonymousId?: string
): Promise<LeaderboardResponse> {
  const supabase = createServiceClient();

  // Get this week's time range
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();

  // Calculate stats from user_packs opened this week
  // We aggregate from user_packs joined with user_profiles
  const { data: weeklyStats, error: statsError } = await supabase
    .from('user_packs')
    .select(`
      profile_id,
      total_points,
      correct_picks,
      user_profiles!inner (
        id,
        display_name,
        anonymous_id
      )
    `)
    .gte('opened_at', weekStart.toISOString())
    .lte('opened_at', weekEnd.toISOString());

  if (statsError) {
    console.error('Error fetching weekly stats:', statsError);
    return { entries: [], totalPlayers: 0 };
  }

  // Aggregate stats by profile
  const profileStats = new Map<
    string,
    {
      profileId: string;
      displayName: string;
      anonymousId: string;
      totalPoints: number;
      packsOpened: number;
      correctPicks: number;
      totalPicks: number;
    }
  >();

  for (const pack of weeklyStats ?? []) {
    const profile = pack.user_profiles as unknown as {
      id: string;
      display_name: string;
      anonymous_id: string;
    };

    const existing = profileStats.get(profile.id);
    if (existing) {
      existing.totalPoints += pack.total_points ?? 0;
      existing.packsOpened += 1;
      existing.correctPicks += pack.correct_picks ?? 0;
      existing.totalPicks += 5; // Assuming 5 picks per pack
    } else {
      profileStats.set(profile.id, {
        profileId: profile.id,
        displayName: profile.display_name || 'Anonymous',
        anonymousId: profile.anonymous_id,
        totalPoints: pack.total_points ?? 0,
        packsOpened: 1,
        correctPicks: pack.correct_picks ?? 0,
        totalPicks: 5,
      });
    }
  }

  // Sort by total points descending
  const sortedEntries = Array.from(profileStats.values()).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  // Add ranks
  const rankedEntries: LeaderboardEntry[] = sortedEntries.map((entry, index) => ({
    rank: index + 1,
    profileId: entry.profileId,
    displayName: entry.displayName,
    totalPoints: entry.totalPoints,
    packsOpened: entry.packsOpened,
    accuracy: entry.totalPicks > 0 ? entry.correctPicks / entry.totalPicks : 0,
    isCurrentUser: anonymousId ? entry.anonymousId === anonymousId : false,
  }));

  // Find user's rank and points
  let userRank: number | undefined;
  let userPoints: number | undefined;
  if (anonymousId) {
    const userEntry = rankedEntries.find((e) => e.isCurrentUser);
    if (userEntry) {
      userRank = userEntry.rank;
      userPoints = userEntry.totalPoints;
    }
  }

  // Apply pagination
  const paginatedEntries = rankedEntries.slice(offset, offset + limit);

  return {
    entries: paginatedEntries,
    totalPlayers: rankedEntries.length,
    userRank,
    userPoints,
  };
}

/**
 * Get a user's rank in the current week's leaderboard
 */
export async function getUserWeeklyRank(
  anonymousId: string
): Promise<{ rank: number; points: number } | null> {
  const result = await getCurrentWeekLeaderboard(1000, 0, anonymousId);

  if (result.userRank !== undefined && result.userPoints !== undefined) {
    return {
      rank: result.userRank,
      points: result.userPoints,
    };
  }

  return null;
}

/**
 * Update or create a leaderboard entry for a profile
 * This is called after a pack is completed
 */
export async function updateLeaderboardEntry(
  profileId: string,
  pointsToAdd: number,
  packsToAdd: number = 1,
  correctPicksToAdd: number = 0,
  totalPicksToAdd: number = 5
): Promise<boolean> {
  const supabase = createServiceClient();

  // Get or create the current week's leaderboard
  const leaderboardId = await getOrCreateWeeklyLeaderboard();
  if (!leaderboardId) {
    console.error('Failed to get or create weekly leaderboard');
    return false;
  }

  // Check if entry exists
  const { data: existing, error: selectError } = await supabase
    .from('leaderboard_entries')
    .select('*')
    .eq('leaderboard_id', leaderboardId)
    .eq('profile_id', profileId)
    .single();

  if (existing && !selectError) {
    // Update existing entry
    const { error: updateError } = await supabase
      .from('leaderboard_entries')
      .update({
        total_points: (existing.total_points ?? 0) + pointsToAdd,
        packs_opened: (existing.packs_opened ?? 0) + packsToAdd,
        correct_picks: (existing.correct_picks ?? 0) + correctPicksToAdd,
        picks_made: (existing.picks_made ?? 0) + totalPicksToAdd,
        accuracy_rate:
          ((existing.correct_picks ?? 0) + correctPicksToAdd) /
          ((existing.picks_made ?? 0) + totalPicksToAdd),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Error updating leaderboard entry:', updateError);
      return false;
    }
  } else {
    // Create new entry
    const { error: insertError } = await supabase
      .from('leaderboard_entries')
      .insert({
        leaderboard_id: leaderboardId,
        profile_id: profileId,
        total_points: pointsToAdd,
        packs_opened: packsToAdd,
        correct_picks: correctPicksToAdd,
        picks_made: totalPicksToAdd,
        accuracy_rate: totalPicksToAdd > 0 ? correctPicksToAdd / totalPicksToAdd : 0,
        rank: 0, // Will be calculated later
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating leaderboard entry:', insertError);
      return false;
    }
  }

  return true;
}

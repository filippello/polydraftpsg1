// Core game types for Polydraft

// ============================================
// Rarity Types
// ============================================

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RarityInfo {
  pLow: number;           // min(p1, p2) - underdog probability
  rarity: Rarity;         // Assigned rarity based on p_low
  targetRarity?: Rarity;  // Target rarity that was rolled (for pack generation)
}

// ============================================
// Event Types
// ============================================

export type EventStatus = 'upcoming' | 'active' | 'pending_resolution' | 'resolved' | 'cancelled';
export type Outcome = 'a' | 'b';
export type EventCategory = 'sports' | 'politics' | 'crypto' | 'economy' | 'entertainment';

export interface Event {
  id: string;
  polymarket_market_id: string;
  polymarket_condition_id?: string;
  polymarket_slug?: string;

  title: string;
  description?: string;
  image_url?: string;

  outcome_a_label: string;
  outcome_b_label: string;
  outcome_a_probability: number;
  outcome_b_probability: number;
  last_price_sync_at?: string;

  category: EventCategory;
  subcategory?: string;
  league?: string;

  event_start_at?: string;
  resolution_deadline_at?: string;

  status: EventStatus;
  resolved_at?: string;
  winning_outcome?: Outcome;

  is_featured: boolean;
  priority_score: number;

  created_at: string;
  updated_at: string;

  // Rarity info (populated when event is selected for a pack)
  rarityInfo?: RarityInfo;
}

// ============================================
// Pack Types
// ============================================

export interface PackType {
  id: string;
  slug: string;
  name: string;
  description?: string;

  icon_url?: string;
  background_color?: string;
  pixel_art_theme?: string;

  cards_per_pack: number;
  eligibility_filters: Record<string, unknown>;

  is_active: boolean;
  available_from?: string;
  available_until?: string;
  display_order: number;

  created_at: string;
  updated_at: string;
}

// ============================================
// User Pack & Picks
// ============================================

export type PackResolutionStatus = 'pending' | 'partially_resolved' | 'fully_resolved';
export type PickStatus = 'pending' | 'resolved';

export interface UserPack {
  id: string;
  user_id: string;
  pack_type_id: string;
  pack_type?: PackType;

  opened_at: string;
  resolution_status: PackResolutionStatus;
  current_reveal_index: number;
  last_reveal_at?: string;

  total_points: number;
  correct_picks: number;

  fully_resolved_at?: string;
  created_at: string;
  updated_at: string;

  // Populated
  picks?: UserPick[];
}

export interface UserPick {
  id: string;
  user_pack_id: string;
  event_id: string;
  event?: Event;

  position: number; // 1-5
  picked_outcome: Outcome;
  picked_at: string;

  probability_snapshot: number;
  opposite_probability_snapshot: number;

  is_resolved: boolean;
  is_correct?: boolean;
  resolved_at?: string;
  points_awarded: number;

  reveal_animation_played: boolean;
  created_at: string;
}

// ============================================
// User Profile
// ============================================

export interface UserProfile {
  id: string;
  user_id: string;

  username?: string;
  display_name?: string;
  avatar_url?: string;
  pixel_avatar_config?: Record<string, unknown>;

  total_points: number;
  total_packs_opened: number;
  total_picks_made: number;
  total_correct_picks: number;

  current_streak: number;
  longest_streak: number;

  category_stats?: Record<string, CategoryStats>;
  achievements?: Achievement[];

  best_weekly_rank?: number;
  best_weekly_points?: number;

  favorite_pack_types?: string[];
  notification_preferences?: NotificationPreferences;

  created_at: string;
  updated_at: string;
}

export interface CategoryStats {
  points: number;
  picks: number;
  correct: number;
}

export interface Achievement {
  id: string;
  unlocked_at: string;
}

export interface NotificationPreferences {
  resolution: boolean;
  leaderboard: boolean;
}

// ============================================
// Leaderboard
// ============================================

export interface LeaderboardEntry {
  id: string;
  leaderboard_id: string;
  user_id: string;

  total_points: number;
  packs_opened: number;
  picks_made: number;
  correct_picks: number;
  accuracy_rate?: number;

  rank: number;
  previous_rank?: number;

  updated_at: string;

  // Populated
  user_profile?: UserProfile;
}

// ============================================
// Game State Types
// ============================================

export type PackOpeningPhase = 'idle' | 'opening' | 'revealing' | 'complete';
export type CardFlipState = 'hidden' | 'flipping' | 'revealed';

export interface RevealItem {
  position: number;
  eventTitle: string;
  isCorrect: boolean;
  points: number;
}

// ============================================
// Anonymous Session
// ============================================

export interface AnonymousSession {
  id: string;
  anonymous_id: string;
  user_id?: string;
  created_at: string;
  last_active_at: string;
  data?: Record<string, unknown>;
}

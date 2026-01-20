/**
 * Scoring Calculator for Polydraft
 *
 * The scoring system rewards picking underdogs (low probability events)
 * while still giving points for correct favorite picks.
 *
 * Formula: Points = BASE_POINTS * (1 / probability) + tier_bonus
 * - Lower probability = higher reward
 * - Bonus tiers for extreme underdogs
 * - Capped at 150 points per pick
 */

export interface ScoringParams {
  /** Probability of the picked outcome at the time of pick (0.0 to 1.0) */
  probabilityAtPick: number;
  /** Whether the picked outcome was correct */
  isCorrect: boolean;
}

export interface ScoringResult {
  points: number;
  multiplier: number;
  tierBonus: number;
  tier: 'longshot' | 'underdog' | 'slight_underdog' | 'tossup' | 'favorite' | 'heavy_favorite';
}

const BASE_POINTS = 10;
const MAX_POINTS = 150;
const MAX_MULTIPLIER = 10;

/**
 * Get the tier classification based on probability
 */
export function getTier(probability: number): ScoringResult['tier'] {
  if (probability < 0.1) return 'longshot';
  if (probability < 0.25) return 'underdog';
  if (probability < 0.4) return 'slight_underdog';
  if (probability < 0.6) return 'tossup';
  if (probability < 0.75) return 'favorite';
  return 'heavy_favorite';
}

/**
 * Get bonus points based on tier
 */
export function getTierBonus(tier: ScoringResult['tier']): number {
  switch (tier) {
    case 'longshot':
      return 50;
    case 'underdog':
      return 20;
    case 'slight_underdog':
      return 5;
    default:
      return 0;
  }
}

/**
 * Calculate points for a single pick
 *
 * @example
 * // Underdog at 10% - correct
 * calculatePoints({ probabilityAtPick: 0.10, isCorrect: true })
 * // Returns: { points: 100, multiplier: 10, tierBonus: 0, tier: 'longshot' }
 *
 * @example
 * // Favorite at 75% - correct
 * calculatePoints({ probabilityAtPick: 0.75, isCorrect: true })
 * // Returns: { points: 13.33, multiplier: 1.33, tierBonus: 0, tier: 'favorite' }
 */
export function calculatePoints({ probabilityAtPick, isCorrect }: ScoringParams): ScoringResult {
  const tier = getTier(probabilityAtPick);
  const tierBonus = getTierBonus(tier);

  if (!isCorrect) {
    return {
      points: 0,
      multiplier: 0,
      tierBonus: 0,
      tier,
    };
  }

  // Core multiplier: inverse of probability
  // Lower probability = higher reward
  let multiplier = 1 / probabilityAtPick;

  // Cap multiplier to prevent extreme values
  multiplier = Math.min(multiplier, MAX_MULTIPLIER);

  const basePoints = BASE_POINTS * multiplier;
  const totalPoints = Math.min(basePoints + tierBonus, MAX_POINTS);

  return {
    points: Math.round(totalPoints * 100) / 100,
    multiplier: Math.round(multiplier * 100) / 100,
    tierBonus,
    tier,
  };
}

/**
 * Calculate pack completion bonus
 */
export function calculatePackBonus(correctCount: number, totalPicks: number = 5): number {
  if (correctCount === totalPicks) {
    return 100; // Perfect pack!
  }
  if (correctCount === totalPicks - 1) {
    return 30; // Excellent
  }
  if (correctCount === totalPicks - 2) {
    return 10; // Good
  }
  return 0;
}

/**
 * Calculate total pack score
 */
export function calculatePackScore(picks: Array<{ probabilityAtPick: number; isCorrect: boolean }>): {
  totalPoints: number;
  correctCount: number;
  packBonus: number;
  breakdown: ScoringResult[];
} {
  const breakdown = picks.map((pick) => calculatePoints(pick));
  const totalPickPoints = breakdown.reduce((sum, result) => sum + result.points, 0);
  const correctCount = breakdown.filter((r) => r.points > 0).length;
  const packBonus = calculatePackBonus(correctCount, picks.length);

  return {
    totalPoints: Math.round((totalPickPoints + packBonus) * 100) / 100,
    correctCount,
    packBonus,
    breakdown,
  };
}

/**
 * Format probability as percentage
 */
export function formatProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Format probability as decimal odds
 */
export function formatDecimalOdds(probability: number): string {
  if (probability === 0) return '-';
  return (1 / probability).toFixed(2);
}

/**
 * Get display color for probability tier
 */
export function getTierColor(tier: ScoringResult['tier']): string {
  switch (tier) {
    case 'longshot':
      return '#ef4444'; // red-500
    case 'underdog':
      return '#f97316'; // orange-500
    case 'slight_underdog':
      return '#eab308'; // yellow-500
    case 'tossup':
      return '#84cc16'; // lime-500
    case 'favorite':
      return '#22c55e'; // green-500
    case 'heavy_favorite':
      return '#14b8a6'; // teal-500
    default:
      return '#6b7280'; // gray-500
  }
}

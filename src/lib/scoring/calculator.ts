/**
 * Scoring Calculator for Polydraft
 *
 * Works like Polymarket: each pick is a $1 bet.
 * Payout = $1 * (1 / probability)
 *
 * Examples:
 * - 50% probability = 2x odds = $2 return
 * - 20% probability = 5x odds = $5 return
 * - 10% probability = 10x odds = $10 return
 * - 5% probability = 20x odds = $20 return
 *
 * Pack = $5 total (5 picks x $1 each)
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

const BASE_POINTS = 1; // $1 bet per pick

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
 * Get bonus points based on tier (small bonuses for picking underdogs)
 */
export function getTierBonus(tier: ScoringResult['tier']): number {
  switch (tier) {
    case 'longshot':
      return 0.50; // +$0.50 bonus
    case 'underdog':
      return 0.25; // +$0.25 bonus
    case 'slight_underdog':
      return 0.10; // +$0.10 bonus
    default:
      return 0;
  }
}

/**
 * Calculate points for a single pick
 * Each pick represents a $1 bet with standard betting odds
 *
 * @example
 * // Underdog at 10% - correct ($1 bet returns $10 + $0.50 bonus)
 * calculatePoints({ probabilityAtPick: 0.10, isCorrect: true })
 * // Returns: { points: 10.50, multiplier: 10, tierBonus: 0.50, tier: 'longshot' }
 *
 * @example
 * // Favorite at 75% - correct ($1 bet returns $1.33)
 * calculatePoints({ probabilityAtPick: 0.75, isCorrect: true })
 * // Returns: { points: 1.33, multiplier: 1.33, tierBonus: 0, tier: 'favorite' }
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

  // Core multiplier: inverse of probability (like Polymarket)
  // Lower probability = higher reward
  const multiplier = 1 / probabilityAtPick;

  const basePoints = BASE_POINTS * multiplier;
  const totalPoints = basePoints + tierBonus;

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
    return 5; // Perfect pack! +$5 bonus
  }
  if (correctCount === totalPicks - 1) {
    return 2; // Excellent +$2 bonus
  }
  if (correctCount === totalPicks - 2) {
    return 1; // Good +$1 bonus
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

/**
 * Calculate the maximum potential points if all picks are correct
 * Useful for showing "jackpot" potential after drafting
 */
export function calculateMaxPotentialPoints(
  picks: Array<{ probabilityAtPick: number }>
): {
  totalPoints: number;
  breakdown: ScoringResult[];
  packBonus: number;
} {
  const breakdown = picks.map((pick) =>
    calculatePoints({ probabilityAtPick: pick.probabilityAtPick, isCorrect: true })
  );
  const totalPickPoints = breakdown.reduce((sum, result) => sum + result.points, 0);
  const packBonus = calculatePackBonus(picks.length, picks.length); // Perfect score bonus

  return {
    totalPoints: Math.round((totalPickPoints + packBonus) * 100) / 100,
    breakdown,
    packBonus,
  };
}

/**
 * Calculate the combined probability (parlay odds) of all picks being correct
 * This is the product of all individual probabilities
 */
export function calculateCombinedProbability(
  picks: Array<{ probabilityAtPick: number }>
): number {
  if (picks.length === 0) return 0;
  return picks.reduce((product, pick) => product * pick.probabilityAtPick, 1);
}

/**
 * Rarity System for Polydraft
 *
 * Rarity is determined by the "underdog" probability (p_low = min(p1, p2))
 * Lower p_low = rarer card
 */

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RarityConfig {
  name: string;
  color: string;        // Tailwind color class
  hex: string;          // Hex color for inline styles
  glowClass: string;    // Tailwind glow/shadow class
  minPLow: number;      // Minimum p_low (inclusive)
  maxPLow: number;      // Maximum p_low (exclusive, except for common which is inclusive)
}

// Rarity configurations with colors and probability ranges
export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  legendary: {
    name: 'Legendary',
    color: 'text-orange-500',
    hex: '#f97316',
    glowClass: 'shadow-[0_0_15px_rgba(249,115,22,0.6)]',
    minPLow: 0.00,
    maxPLow: 0.02,
  },
  epic: {
    name: 'Epic',
    color: 'text-purple-500',
    hex: '#a855f7',
    glowClass: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    minPLow: 0.02,
    maxPLow: 0.05,
  },
  rare: {
    name: 'Rare',
    color: 'text-blue-500',
    hex: '#3b82f6',
    glowClass: 'shadow-[0_0_15px_rgba(59,130,246,0.6)]',
    minPLow: 0.05,
    maxPLow: 0.15,
  },
  uncommon: {
    name: 'Uncommon',
    color: 'text-green-500',
    hex: '#22c55e',
    glowClass: 'shadow-[0_0_15px_rgba(34,197,94,0.6)]',
    minPLow: 0.15,
    maxPLow: 0.30,
  },
  common: {
    name: 'Common',
    color: 'text-gray-400',
    hex: '#9ca3af',
    glowClass: '',
    minPLow: 0.30,
    maxPLow: 0.50,
  },
};

// Drop rates for pack generation (must sum to 1.0)
export const DROP_RATES: Record<Rarity, number> = {
  common: 0.59,
  uncommon: 0.25,
  rare: 0.11,
  epic: 0.03,
  legendary: 0.02,
};

// Rarity order from most common to most rare (for fallback)
export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

/**
 * Calculate p_low (underdog probability) from two outcome probabilities
 */
export function calculatePLow(p1: number, p2: number): number {
  return Math.min(p1, p2);
}

/**
 * Get rarity from p_low value
 * Uses exact bin boundaries to avoid overlap
 */
export function getRarityFromPLow(pLow: number): Rarity {
  // Clamp p_low to valid range [0, 0.5]
  const clampedPLow = Math.max(0, Math.min(0.5, pLow));

  if (clampedPLow < 0.02) return 'legendary';
  if (clampedPLow < 0.05) return 'epic';
  if (clampedPLow < 0.15) return 'rare';
  if (clampedPLow < 0.30) return 'uncommon';
  return 'common';
}

/**
 * Get rarity for an event based on its outcome probabilities
 */
export function getEventRarity(outcomeAProbability: number, outcomeBProbability: number): Rarity {
  const pLow = calculatePLow(outcomeAProbability, outcomeBProbability);
  return getRarityFromPLow(pLow);
}

/**
 * Get the rarity configuration for a given rarity
 */
export function getRarityConfig(rarity: Rarity): RarityConfig {
  return RARITY_CONFIG[rarity];
}

/**
 * Roll a target rarity based on drop rates
 * Returns a rarity based on the configured drop rate distribution
 */
export function rollTargetRarity(): Rarity {
  const roll = Math.random();
  let cumulative = 0;

  for (const rarity of RARITY_ORDER) {
    cumulative += DROP_RATES[rarity];
    if (roll < cumulative) {
      return rarity;
    }
  }

  // Fallback (should never reach due to rates summing to 1)
  return 'common';
}

/**
 * Check if an event matches a target rarity
 */
export function eventMatchesRarity(
  outcomeAProbability: number,
  outcomeBProbability: number,
  targetRarity: Rarity
): boolean {
  const eventRarity = getEventRarity(outcomeAProbability, outcomeBProbability);
  return eventRarity === targetRarity;
}

/**
 * Calculate distance from p_low to a rarity bin
 * Returns 0 if p_low is within the bin
 */
export function distanceToRarityBin(pLow: number, targetRarity: Rarity): number {
  const config = RARITY_CONFIG[targetRarity];

  if (pLow >= config.minPLow && pLow < config.maxPLow) {
    return 0;
  }

  if (pLow < config.minPLow) {
    return config.minPLow - pLow;
  }

  return pLow - config.maxPLow;
}

/**
 * Get fallback rarities in order (degrade towards common)
 */
export function getFallbackRarities(targetRarity: Rarity): Rarity[] {
  const targetIndex = RARITY_ORDER.indexOf(targetRarity);
  // Return rarities from target down to common
  return RARITY_ORDER.slice(0, targetIndex + 1).reverse();
}

/**
 * Get border color class for a rarity
 */
export function getRarityBorderClass(rarity: Rarity): string {
  switch (rarity) {
    case 'legendary':
      return 'border-orange-500';
    case 'epic':
      return 'border-purple-500';
    case 'rare':
      return 'border-blue-500';
    case 'uncommon':
      return 'border-green-500';
    case 'common':
    default:
      return 'border-gray-500';
  }
}

/**
 * Get background color class for a rarity badge
 */
export function getRarityBgClass(rarity: Rarity): string {
  switch (rarity) {
    case 'legendary':
      return 'bg-orange-500/20';
    case 'epic':
      return 'bg-purple-500/20';
    case 'rare':
      return 'bg-blue-500/20';
    case 'uncommon':
      return 'bg-green-500/20';
    case 'common':
    default:
      return 'bg-gray-500/20';
  }
}

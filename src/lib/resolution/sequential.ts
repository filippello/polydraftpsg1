/**
 * Sequential Resolution Logic
 *
 * Manages the sequential reveal of pack results.
 * Cards must be revealed in order (1 → 2 → 3 → 4 → 5),
 * regardless of when events actually resolved.
 */

import type { UserPack, UserPick } from '@/types';

// ============================================
// Types
// ============================================

export interface RevealStatus {
  /** Whether the next card can be revealed */
  canRevealNext: boolean;
  /** Position of the next card to reveal (1-5), or null if complete */
  nextRevealPosition: number | null;
  /** The pick to reveal (if canRevealNext is true) */
  nextPick: UserPick | null;
  /** Positions of cards that are still pending resolution */
  pendingPositions: number[];
  /** Whether the pack is fully revealed */
  isFullyRevealed: boolean;
  /** Number of cards revealed so far */
  revealedCount: number;
  /** Number of cards resolved (but maybe not revealed yet) */
  resolvedCount: number;
}

export interface RevealResult {
  position: number;
  isCorrect: boolean;
  pointsAwarded: number;
  isPackComplete: boolean;
  totalPoints: number;
  correctCount: number;
}

// ============================================
// Core Logic
// ============================================

/**
 * Get the current reveal status for a pack
 *
 * The key rule is that cards must be revealed in order.
 * Card N can only be revealed if:
 * 1. Card N-1 has been revealed (or N is the first card)
 * 2. Card N is resolved
 */
export function getRevealStatus(pack: UserPack): RevealStatus {
  const picks = pack.picks ?? [];
  const currentIndex = pack.current_reveal_index;

  // Sort picks by position to ensure order
  const sortedPicks = [...picks].sort((a, b) => a.position - b.position);

  // Count revealed and resolved
  const revealedCount = sortedPicks.filter((p) => p.reveal_animation_played).length;
  const resolvedCount = sortedPicks.filter((p) => p.is_resolved).length;

  // Find pending positions
  const pendingPositions = sortedPicks
    .filter((p) => !p.is_resolved)
    .map((p) => p.position);

  // Check if fully revealed
  const isFullyRevealed = revealedCount >= picks.length;

  if (isFullyRevealed) {
    return {
      canRevealNext: false,
      nextRevealPosition: null,
      nextPick: null,
      pendingPositions,
      isFullyRevealed: true,
      revealedCount,
      resolvedCount,
    };
  }

  // Get the next pick to reveal (by index)
  const nextPick = sortedPicks[currentIndex];

  if (!nextPick) {
    return {
      canRevealNext: false,
      nextRevealPosition: null,
      nextPick: null,
      pendingPositions,
      isFullyRevealed: false,
      revealedCount,
      resolvedCount,
    };
  }

  // Can reveal if the pick is resolved and hasn't been revealed yet
  const canRevealNext = nextPick.is_resolved && !nextPick.reveal_animation_played;

  return {
    canRevealNext,
    nextRevealPosition: canRevealNext ? nextPick.position : null,
    nextPick: canRevealNext ? nextPick : null,
    pendingPositions,
    isFullyRevealed: false,
    revealedCount,
    resolvedCount,
  };
}

/**
 * Check if a specific position can be revealed
 */
export function canRevealPosition(pack: UserPack, position: number): boolean {
  const picks = pack.picks ?? [];
  const currentIndex = pack.current_reveal_index;

  // Position must be the current index + 1 (positions are 1-indexed)
  if (position !== currentIndex + 1) {
    return false;
  }

  // Find the pick at this position
  const pick = picks.find((p) => p.position === position);
  if (!pick) {
    return false;
  }

  // Must be resolved and not yet revealed
  return pick.is_resolved && !pick.reveal_animation_played;
}

/**
 * Get all picks that are resolved but not yet visible
 * (resolved after their predecessor in the sequence)
 */
export function getQueuedReveals(pack: UserPack): UserPick[] {
  const picks = pack.picks ?? [];
  const sortedPicks = [...picks].sort((a, b) => a.position - b.position);

  return sortedPicks.filter((pick) => {
    // Already revealed = not queued
    if (pick.reveal_animation_played) return false;

    // Not resolved = not queued
    if (!pick.is_resolved) return false;

    // This pick is resolved but waiting for previous picks
    return true;
  });
}

/**
 * Calculate the total points for a pack
 */
export function calculatePackTotals(picks: UserPick[]): {
  totalPoints: number;
  correctCount: number;
  resolvedCount: number;
} {
  const resolvedPicks = picks.filter((p) => p.is_resolved);

  return {
    totalPoints: resolvedPicks.reduce((sum, p) => sum + p.points_awarded, 0),
    correctCount: resolvedPicks.filter((p) => p.is_correct).length,
    resolvedCount: resolvedPicks.length,
  };
}

/**
 * Get a human-readable status message for the pack
 */
export function getPackStatusMessage(pack: UserPack): string {
  const status = getRevealStatus(pack);

  if (status.isFullyRevealed) {
    const totals = calculatePackTotals(pack.picks ?? []);
    return `Pack complete! ${totals.correctCount}/5 correct`;
  }

  if (status.canRevealNext) {
    return `Ready to reveal card ${status.nextRevealPosition}!`;
  }

  if (status.pendingPositions.length > 0) {
    const nextPending = Math.min(...status.pendingPositions);
    return `Waiting for event ${nextPending} to resolve...`;
  }

  return `${status.revealedCount}/5 revealed`;
}

/**
 * Format reveal progress for UI
 */
export function formatRevealProgress(pack: UserPack): {
  label: string;
  resolved: number;
  revealed: number;
  total: number;
  percentage: number;
} {
  const picks = pack.picks ?? [];
  const total = picks.length;
  const resolved = picks.filter((p) => p.is_resolved).length;
  const revealed = picks.filter((p) => p.reveal_animation_played).length;
  const percentage = total > 0 ? Math.round((revealed / total) * 100) : 0;

  return {
    label: `${revealed}/${total}`,
    resolved,
    revealed,
    total,
    percentage,
  };
}

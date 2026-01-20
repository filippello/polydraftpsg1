'use client';

import type { PickPreview } from '@/stores/myPacks';

interface PickChipProps {
  pick: PickPreview;
}

export function PickChip({ pick }: PickChipProps) {
  // Determine state
  const isRevealed = pick.isRevealed;
  const isResolved = pick.isResolved;
  const isCorrect = pick.isCorrect;

  // Get short label (max 3 chars)
  const shortLabel = pick.pickedLabel.slice(0, 3).toUpperCase();

  // Determine styling based on state
  let bgClass = 'bg-card-border/50';
  let textClass = 'text-gray-400';
  let borderClass = 'border-card-border';
  let icon = '';

  if (isRevealed) {
    if (isCorrect) {
      bgClass = 'bg-game-success/20';
      textClass = 'text-game-success';
      borderClass = 'border-game-success';
      icon = '✓';
    } else {
      bgClass = 'bg-game-error/20';
      textClass = 'text-game-error';
      borderClass = 'border-game-error';
      icon = '✗';
    }
  } else if (isResolved) {
    // Resolved but not revealed - ready to reveal
    bgClass = 'bg-game-gold/20';
    textClass = 'text-game-gold';
    borderClass = 'border-game-gold';
    icon = '!';
  } else {
    // Waiting for resolution
    icon = '?';
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${bgClass} ${textClass} ${borderClass}`}
    >
      <span>{shortLabel}</span>
      <span className="text-[8px]">{icon}</span>
    </span>
  );
}

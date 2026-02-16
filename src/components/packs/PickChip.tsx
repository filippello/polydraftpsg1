'use client';

import { isPSG1 } from '@/lib/platform';
import type { PickPreview } from '@/stores/myPacks';

interface PickChipProps {
  pick: PickPreview;
}

export function PickChip({ pick }: PickChipProps) {
  const psg1 = isPSG1();

  // Determine state
  const isRevealed = pick.isRevealed;
  const isResolved = pick.isResolved;
  const isCorrect = pick.isCorrect;

  // Get short label (max 3 chars)
  const shortLabel = pick.pickedLabel.slice(0, 3).toUpperCase();

  // Determine styling based on state
  let bgClass = psg1 ? 'bg-white/[0.06]' : 'bg-card-border/50';
  let textClass = psg1 ? 'text-gray-500' : 'text-gray-400';
  let borderClass = psg1 ? 'border-white/[0.06]' : 'border-card-border';
  let icon = '';

  if (isRevealed) {
    if (isCorrect) {
      bgClass = psg1 ? 'bg-emerald-400/20' : 'bg-game-success/20';
      textClass = psg1 ? 'text-emerald-400' : 'text-game-success';
      borderClass = psg1 ? 'border-emerald-400' : 'border-game-success';
      icon = '✓';
    } else {
      bgClass = psg1 ? 'bg-red-400/20' : 'bg-game-error/20';
      textClass = psg1 ? 'text-red-400' : 'text-game-error';
      borderClass = psg1 ? 'border-red-400' : 'border-game-error';
      icon = '✗';
    }
  } else if (isResolved) {
    // Resolved but not revealed - ready to reveal
    bgClass = psg1 ? 'bg-amber-400/20' : 'bg-game-gold/20';
    textClass = psg1 ? 'text-amber-400' : 'text-game-gold';
    borderClass = psg1 ? 'border-amber-400' : 'border-game-gold';
    icon = '!';
  } else {
    // Waiting for resolution
    icon = '?';
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${bgClass} ${textClass} ${borderClass} ${
        psg1 ? 'font-pixel-body text-balatro-xs' : 'text-[10px] font-bold'
      }`}
    >
      <span>{shortLabel}</span>
      <span className={psg1 ? 'text-balatro-xs' : 'text-[8px]'}>{icon}</span>
    </span>
  );
}

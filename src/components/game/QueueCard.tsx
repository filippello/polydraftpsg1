'use client';

import { motion } from 'framer-motion';
import type { UserPick, Event } from '@/types';
import { formatProbability } from '@/lib/scoring/calculator';

interface QueueCardProps {
  pick: UserPick & { event: Event };
  position: number;
  isRevealed: boolean;
  isNext: boolean;
  isLocked: boolean;
}

export function QueueCard({
  pick,
  position,
  isRevealed,
  isNext,
  isLocked,
}: QueueCardProps) {
  const pickedLabel =
    pick.picked_outcome === 'a'
      ? pick.event.outcome_a_label
      : pick.event.outcome_b_label;

  // Determine card state
  let stateClasses = '';
  let statusIcon = '';
  let statusText = '';

  if (isRevealed) {
    if (pick.is_correct) {
      stateClasses = 'border-game-success bg-game-success/10';
      statusIcon = '✓';
      statusText = 'WIN';
    } else {
      stateClasses = 'border-game-failure bg-game-failure/10';
      statusIcon = '✗';
      statusText = 'LOSE';
    }
  } else if (isNext && pick.is_resolved) {
    stateClasses = 'border-game-gold glow-gold';
    statusIcon = '▶';
    statusText = 'READY';
  } else if (isNext && !pick.is_resolved) {
    stateClasses = 'border-game-warning';
    statusIcon = '⏳';
    statusText = 'PENDING';
  } else if (isLocked) {
    stateClasses = 'border-card-border opacity-60';
    statusIcon = '🔒';
    statusText = pick.is_resolved ? 'QUEUED' : 'PENDING';
  } else {
    stateClasses = 'border-card-border';
    statusIcon = '⏳';
    statusText = 'PENDING';
  }

  return (
    <motion.div
      className={`p-3 rounded border-2 ${stateClasses} transition-all`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.1 }}
    >
      <div className="flex items-start gap-3">
        {/* Position badge */}
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
            ${isRevealed
              ? pick.is_correct
                ? 'bg-game-success text-black'
                : 'bg-game-failure text-white'
              : isNext
                ? 'bg-game-gold text-black'
                : 'bg-game-secondary text-white'
            }
          `}
        >
          {isRevealed ? statusIcon : position}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Event title */}
          <p className="font-bold text-sm truncate">{pick.event.title}</p>

          {/* Pick info */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">Your pick:</span>
            <span className="text-xs font-bold text-game-accent">
              {pickedLabel}
            </span>
            <span className="text-xs text-gray-500">
              @ {formatProbability(pick.probability_snapshot)}
            </span>
          </div>

          {/* Result (if revealed) */}
          {isRevealed && (
            <motion.div
              className="mt-2 flex items-center gap-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span
                className={`text-xs font-bold ${
                  pick.is_correct ? 'text-game-success' : 'text-game-failure'
                }`}
              >
                {statusText}
              </span>
              {pick.is_correct && (
                <span className="text-xs text-game-gold font-bold">
                  +{pick.points_awarded.toFixed(1)} pts
                </span>
              )}
            </motion.div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0 text-right">
          <span
            className={`text-xs font-bold uppercase ${
              isRevealed
                ? pick.is_correct
                  ? 'text-game-success'
                  : 'text-game-failure'
                : isNext && pick.is_resolved
                  ? 'text-game-gold'
                  : 'text-gray-500'
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

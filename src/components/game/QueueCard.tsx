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
  onReveal?: () => void;
  focused?: boolean;
}

export function QueueCard({
  pick,
  position,
  isRevealed,
  isNext,
  isLocked,
  onReveal,
  focused,
}: QueueCardProps) {
  const pickedLabel =
    pick.picked_outcome === 'a'
      ? pick.event.outcome_a_label
      : pick.picked_outcome === 'b'
        ? pick.event.outcome_b_label
        : pick.event.outcome_draw_label || 'Draw';

  // Determine if this is the "chest ready" state
  const isChestReady = isNext && pick.is_resolved && !isRevealed;

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
  } else if (isChestReady) {
    stateClasses = 'border-game-gold bg-gradient-to-br from-game-gold/20 to-amber-500/10';
    statusIcon = '🎁';
    statusText = 'READY!';
  } else if (isNext && !pick.is_resolved) {
    stateClasses = 'border-game-warning bg-game-warning/5';
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

  // Chest ready state - special expanded card
  if (isChestReady) {
    return (
      <motion.div
        className={`rounded-xl border-2 ${stateClasses} overflow-hidden ${focused ? 'psg1-focus' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: position * 0.1 }}
      >
        {/* Event info header */}
        <div className="p-3 border-b border-game-gold/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-game-gold text-black">
              {position}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{pick.event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">Your pick:</span>
                <span className="text-xs font-bold text-game-accent">
                  {pickedLabel}
                </span>
                <span className="text-xs text-gray-500">
                  @ {formatProbability(pick.probability_snapshot)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chest section */}
        <div className="p-4 flex flex-col items-center">
          {/* Animated chest */}
          <motion.div
            className="relative mb-4"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Sparkle particles around chest */}
            <div className="absolute inset-0 -m-4">
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{
                    left: `${20 + (i % 3) * 30}%`,
                    top: `${i < 3 ? 0 : 70}%`,
                  }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.25,
                  }}
                >
                  ✨
                </motion.span>
              ))}
            </div>

            {/* Main chest emoji */}
            <motion.div
              className="text-6xl"
              animate={{
                rotateY: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 1.5,
              }}
            >
              🎁
            </motion.div>
          </motion.div>

          {/* REVEAL button */}
          <motion.button
            onClick={onReveal}
            className="w-full max-w-xs px-6 py-3 bg-gradient-to-r from-game-gold to-amber-500 text-black font-bold rounded-lg shadow-lg"
            animate={{
              scale: [1, 1.03, 1],
              boxShadow: [
                '0 0 20px rgba(255, 215, 0, 0.4)',
                '0 0 35px rgba(255, 215, 0, 0.7)',
                '0 0 20px rgba(255, 215, 0, 0.4)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              <span>REVEAL</span>
              <span>✨</span>
            </span>
          </motion.button>
          {focused && (
            <p className="mt-2 text-xs text-gray-500">[B] Reveal</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Default card state (pending, locked, revealed)
  return (
    <motion.div
      className={`p-3 rounded border-2 ${stateClasses} transition-all ${focused ? 'psg1-focus' : ''}`}
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
                  +${pick.points_awarded.toFixed(2)}
                </span>
              )}
            </motion.div>
          )}

          {/* Pending indicator for non-revealed cards */}
          {!isRevealed && !isNext && (
            <motion.div
              className="mt-2 flex items-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs text-gray-500">
                {pick.is_resolved ? 'En cola...' : 'Esperando resultado...'}
              </span>
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

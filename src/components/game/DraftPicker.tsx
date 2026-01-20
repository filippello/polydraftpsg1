'use client';

import { motion } from 'framer-motion';
import type { Event, Outcome } from '@/types';
import { formatProbability, getTier, getTierColor } from '@/lib/scoring/calculator';

interface DraftPickerProps {
  event: Event;
  position: number;
  isPicked: boolean;
  pickedOutcome?: Outcome;
  isCurrent: boolean;
  onPick: (outcome: Outcome) => void;
}

export function DraftPicker({
  event,
  position,
  isPicked,
  pickedOutcome,
  isCurrent,
  onPick,
}: DraftPickerProps) {
  const tierA = getTier(event.outcome_a_probability);
  const tierB = getTier(event.outcome_b_probability);
  const colorA = getTierColor(tierA);
  const colorB = getTierColor(tierB);

  // Determine if this is a vs match or yes/no question
  const isVsMatch =
    event.outcome_a_label !== 'Yes' && event.outcome_b_label !== 'No';

  return (
    <div
      className={`
        card-pixel overflow-hidden transition-all duration-300
        ${isCurrent ? 'ring-2 ring-game-gold' : ''}
        ${isPicked ? 'opacity-80' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-game-secondary rounded-full flex items-center justify-center text-xs font-bold">
            {position}
          </span>
          <span className="text-xs text-gray-400 uppercase">
            {event.subcategory || event.category}
          </span>
        </div>
        {isPicked && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-game-success text-sm"
          >
            ✓ Picked
          </motion.span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm mb-4 line-clamp-2">{event.title}</h3>

      {/* Options */}
      <div className={`grid ${isVsMatch ? 'grid-cols-2' : 'grid-cols-2'} gap-2`}>
        {/* Option A */}
        <motion.button
          className={`
            relative p-3 rounded border-2 transition-all
            ${
              pickedOutcome === 'a'
                ? 'bg-game-success/20 border-game-success'
                : isPicked
                  ? 'opacity-50 border-card-border'
                  : 'border-card-border hover:border-outcome-a hover:bg-outcome-a/10'
            }
          `}
          onClick={() => !isPicked && onPick('a')}
          disabled={isPicked}
          whileTap={!isPicked ? { scale: 0.95 } : {}}
        >
          <div className="text-center">
            <p className="font-bold text-sm mb-1">{event.outcome_a_label}</p>
            <div className="flex items-center justify-center gap-1">
              <span
                className="text-xs font-bold"
                style={{ color: colorA }}
              >
                {formatProbability(event.outcome_a_probability)}
              </span>
            </div>
          </div>

          {/* Selection indicator */}
          {pickedOutcome === 'a' && (
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-game-success rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <span className="text-xs">✓</span>
            </motion.div>
          )}
        </motion.button>

        {/* VS indicator for matches */}
        {isVsMatch && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden">
            <span className="text-xs font-bold text-gray-500">VS</span>
          </div>
        )}

        {/* Option B */}
        <motion.button
          className={`
            relative p-3 rounded border-2 transition-all
            ${
              pickedOutcome === 'b'
                ? 'bg-game-success/20 border-game-success'
                : isPicked
                  ? 'opacity-50 border-card-border'
                  : 'border-card-border hover:border-outcome-b hover:bg-outcome-b/10'
            }
          `}
          onClick={() => !isPicked && onPick('b')}
          disabled={isPicked}
          whileTap={!isPicked ? { scale: 0.95 } : {}}
        >
          <div className="text-center">
            <p className="font-bold text-sm mb-1">{event.outcome_b_label}</p>
            <div className="flex items-center justify-center gap-1">
              <span
                className="text-xs font-bold"
                style={{ color: colorB }}
              >
                {formatProbability(event.outcome_b_probability)}
              </span>
            </div>
          </div>

          {/* Selection indicator */}
          {pickedOutcome === 'b' && (
            <motion.div
              className="absolute -top-1 -right-1 w-5 h-5 bg-game-success rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <span className="text-xs">✓</span>
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Potential points hint */}
      {!isPicked && isCurrent && (
        <motion.div
          className="mt-3 text-center text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Tap an outcome to pick
        </motion.div>
      )}
    </div>
  );
}

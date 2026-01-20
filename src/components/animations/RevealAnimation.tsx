'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { UserPick, Event } from '@/types';

interface RevealAnimationProps {
  pick: UserPick & { event: Event };
  onComplete: () => void;
}

type Phase = 'intro' | 'flip' | 'result' | 'points';

export function RevealAnimation({ pick, onComplete }: RevealAnimationProps) {
  const [phase, setPhase] = useState<Phase>('intro');

  const pickedLabel =
    pick.picked_outcome === 'a'
      ? pick.event.outcome_a_label
      : pick.event.outcome_b_label;

  const winnerLabel =
    pick.event.winning_outcome === 'a'
      ? pick.event.outcome_a_label
      : pick.event.outcome_b_label;

  const isWin = pick.is_correct;

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Phase progression
    timers.push(setTimeout(() => setPhase('flip'), 1000));
    timers.push(setTimeout(() => setPhase('result'), 2000));
    timers.push(setTimeout(() => setPhase('points'), 3000));
    timers.push(setTimeout(() => onComplete(), 4000));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Intro - Card back */}
      {phase === 'intro' && (
        <motion.div
          className="w-64 h-80 bg-game-primary border-4 border-game-accent rounded-lg flex items-center justify-center"
          animate={{ rotateY: [0, 5, -5, 0] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <span className="text-6xl">🎴</span>
        </motion.div>
      )}

      {/* Flip animation */}
      {phase === 'flip' && (
        <motion.div
          className="w-64 h-80 bg-game-primary border-4 border-game-accent rounded-lg flex items-center justify-center perspective-1000"
          animate={{ rotateY: 180 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-6xl">🎴</span>
        </motion.div>
      )}

      {/* Result reveal */}
      {phase === 'result' && (
        <motion.div
          className={`w-64 h-80 rounded-lg flex flex-col items-center justify-center p-4 border-4 ${
            isWin
              ? 'bg-game-success/20 border-game-success'
              : 'bg-game-failure/20 border-game-failure'
          }`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.span
            className="text-6xl mb-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5 }}
          >
            {isWin ? '🎉' : '😔'}
          </motion.span>

          <p className="text-sm text-gray-400 mb-2">Winner:</p>
          <p className="text-xl font-bold text-center">{winnerLabel}</p>

          <div className="mt-4 pt-4 border-t border-card-border w-full text-center">
            <p className="text-xs text-gray-400">Your pick:</p>
            <p className={`font-bold ${isWin ? 'text-game-success' : 'text-game-failure'}`}>
              {pickedLabel}
            </p>
          </div>

          <motion.p
            className={`mt-4 text-2xl font-bold ${
              isWin ? 'text-game-success' : 'text-game-failure'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            {isWin ? 'WIN!' : 'LOSE'}
          </motion.p>
        </motion.div>
      )}

      {/* Points (if win) */}
      {phase === 'points' && (
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {isWin ? (
            <>
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                💰
              </motion.div>
              <motion.p
                className="text-4xl font-bold text-game-gold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{pick.points_awarded.toFixed(1)}
              </motion.p>
              <p className="text-sm text-gray-400 mt-2">points earned!</p>
            </>
          ) : (
            <>
              <motion.div className="text-6xl mb-4">💔</motion.div>
              <p className="text-xl font-bold text-game-failure">Better luck next time!</p>
              <p className="text-sm text-gray-400 mt-2">0 points</p>
            </>
          )}
        </motion.div>
      )}

      {/* Confetti particles for wins */}
      {isWin && (phase === 'result' || phase === 'points') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f'][
                  i % 5
                ],
                left: `${Math.random() * 100}%`,
                top: -20,
              }}
              animate={{
                y: [0, window.innerHeight + 100],
                x: [0, (Math.random() - 0.5) * 200],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

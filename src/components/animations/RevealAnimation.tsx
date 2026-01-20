'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserPick, Event } from '@/types';
import { Confetti, VictoryConfetti } from './Confetti';
import { GoldCoinBurst, TrophyBurst } from './CoinBurst';

interface RevealAnimationProps {
  pick: UserPick & { event: Event };
  onComplete: () => void;
}

type Phase = 'anticipation' | 'burst' | 'reveal' | 'celebration' | 'points';

// Consolation messages for losses
const CONSOLATION_MESSAGES = [
  { text: 'So close!', emoji: '😅' },
  { text: 'Next time!', emoji: '💪' },
  { text: 'Keep going!', emoji: '🎯' },
  { text: 'Almost had it!', emoji: '🤏' },
  { text: "You'll get 'em!", emoji: '🔥' },
];

// Animated counter component
function AnimatedCounter({
  target,
  duration = 1.5,
  decimals = 1,
  onComplete,
}: {
  target: number;
  duration?: number;
  decimals?: number;
  onComplete?: () => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      // Ease out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, onComplete]);

  return <span>{count.toFixed(decimals)}</span>;
}

export function RevealAnimation({ pick, onComplete }: RevealAnimationProps) {
  const [phase, setPhase] = useState<Phase>('anticipation');
  const [canSkip, setCanSkip] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const pickedLabel =
    pick.picked_outcome === 'a'
      ? pick.event.outcome_a_label
      : pick.event.outcome_b_label;

  const winningOutcome = pick.event.winning_outcome;
  const winnerLabel = winningOutcome
    ? (winningOutcome === 'a' ? pick.event.outcome_a_label : pick.event.outcome_b_label)
    : 'Unknown';

  const isWin = pick.is_correct === true;

  // Random consolation message
  const consolation =
    CONSOLATION_MESSAGES[Math.floor(Math.random() * CONSOLATION_MESSAGES.length)];

  // Phase timing - only runs once on mount
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Enable skip after a short delay
    timers.push(setTimeout(() => setCanSkip(true), 1500));

    if (isWin) {
      // WIN timing: 6-7 seconds total
      timers.push(setTimeout(() => setPhase('burst'), 1200));
      timers.push(setTimeout(() => setPhase('reveal'), 2000));
      timers.push(setTimeout(() => setPhase('celebration'), 3500));
      timers.push(setTimeout(() => setPhase('points'), 5500));
      timers.push(setTimeout(() => onCompleteRef.current(), 7000));
    } else {
      // LOSE timing: 4-5 seconds total
      timers.push(setTimeout(() => setPhase('burst'), 1200));
      timers.push(setTimeout(() => setPhase('reveal'), 2000));
      timers.push(setTimeout(() => setPhase('celebration'), 3500));
      timers.push(setTimeout(() => onCompleteRef.current(), 4500));
    }

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip handler
  const handleSkip = useCallback(() => {
    if (canSkip) {
      onCompleteRef.current();
    }
  }, [canSkip]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleSkip}
    >
      {/* Darkening overlay during anticipation */}
      <AnimatePresence>
        {phase === 'anticipation' && (
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* === PHASE: ANTICIPATION === */}
      {phase === 'anticipation' && (
        <motion.div className="relative flex flex-col items-center">
          {/* Orbiting golden particles */}
          <div className="absolute inset-0 -m-16">
            {[...Array(8)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute text-xl"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [
                    Math.cos((i / 8) * Math.PI * 2) * 60,
                    Math.cos((i / 8) * Math.PI * 2 + Math.PI) * 60,
                    Math.cos((i / 8) * Math.PI * 2) * 60,
                  ],
                  y: [
                    Math.sin((i / 8) * Math.PI * 2) * 60,
                    Math.sin((i / 8) * Math.PI * 2 + Math.PI) * 60,
                    Math.sin((i / 8) * Math.PI * 2) * 60,
                  ],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                ✨
              </motion.span>
            ))}
          </div>

          {/* Trembling chest */}
          <motion.div
            className="text-8xl"
            animate={{
              rotate: [-2, 2, -3, 3, -4, 4, -2],
              scale: [1, 1.02, 1, 1.03, 1, 1.04, 1],
            }}
            transition={{
              duration: 0.15,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            🎁
          </motion.div>
        </motion.div>
      )}

      {/* === PHASE: BURST === */}
      {phase === 'burst' && (
        <motion.div className="relative flex flex-col items-center">
          {/* Flash effect for wins */}
          {isWin && (
            <motion.div
              className="absolute inset-0 -m-32 bg-game-gold rounded-full"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2, 3] }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Opening chest */}
          <motion.div
            className="text-8xl"
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.5, 0],
              rotate: [0, 10, -10, 0],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 0.8 }}
          >
            🎁
          </motion.div>

          {/* Initial confetti burst for wins */}
          {isWin && <Confetti count={30} duration={2} delay={0.2} />}
        </motion.div>
      )}

      {/* === PHASE: REVEAL === */}
      {phase === 'reveal' && (
        <motion.div
          className={`relative w-72 rounded-2xl p-6 flex flex-col items-center border-4 ${
            isWin
              ? 'bg-gradient-to-b from-game-success/30 to-game-success/10 border-game-success shadow-[0_0_60px_rgba(34,197,94,0.4)]'
              : 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-gray-500'
          }`}
          initial={{ scale: 0, rotateY: -180, opacity: 0 }}
          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            duration: 0.8,
          }}
        >
          {/* Golden glow for wins */}
          {isWin && (
            <motion.div
              className="absolute -inset-2 rounded-3xl bg-game-gold/20 blur-xl -z-10"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}

          {/* Result emoji */}
          <motion.div
            className="text-6xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 15 }}
          >
            {isWin ? '🏆' : '😔'}
          </motion.div>

          {/* Main result text */}
          <motion.p
            className={`text-3xl font-black mb-4 ${
              isWin ? 'text-game-success' : 'text-gray-400'
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isWin ? 'YOU WON!' : 'BETTER LUCK'}
          </motion.p>

          {!isWin && (
            <motion.p
              className="text-xl font-bold text-gray-500 -mt-2 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              NEXT TIME
            </motion.p>
          )}

          {/* Winner info */}
          <div className="w-full border-t border-white/20 pt-4 mt-2">
            <p className="text-xs text-gray-400 text-center mb-1">Winner:</p>
            <p className="text-lg font-bold text-center text-white">{winnerLabel}</p>
          </div>

          {/* Your pick info */}
          <div className="w-full border-t border-white/20 pt-3 mt-3">
            <p className="text-xs text-gray-400 text-center mb-1">Your pick:</p>
            <p
              className={`text-sm font-bold text-center ${
                isWin ? 'text-game-success' : 'text-game-failure'
              }`}
            >
              {pickedLabel}
            </p>
          </div>
        </motion.div>
      )}

      {/* === PHASE: CELEBRATION (WIN) === */}
      {phase === 'celebration' && isWin && (
        <motion.div className="relative flex flex-col items-center">
          {/* Epic confetti */}
          <VictoryConfetti count={100} duration={4} />

          {/* Coin burst from center */}
          <GoldCoinBurst origin={{ x: 50, y: 50 }} radius={200} />

          {/* Trophy burst */}
          <TrophyBurst delay={0.3} radius={150} />

          {/* Floating celebration emojis */}
          <div className="absolute inset-0">
            {['🎉', '🏆', '💰', '⭐', '🔥'].map((emoji, i) => (
              <motion.span
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${15 + i * 18}%`,
                  top: '50%',
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: [-50, -150],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.15,
                  ease: 'easeOut',
                }}
              >
                {emoji}
              </motion.span>
            ))}
          </div>

          {/* Pulsing result card */}
          <motion.div
            className="w-72 rounded-2xl p-6 flex flex-col items-center border-4 bg-gradient-to-b from-game-success/30 to-game-success/10 border-game-success"
            animate={{
              scale: [1, 1.02, 1],
              boxShadow: [
                '0 0 30px rgba(34,197,94,0.4)',
                '0 0 60px rgba(34,197,94,0.6)',
                '0 0 30px rgba(34,197,94,0.4)',
              ],
            }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <motion.div
              className="text-6xl mb-2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🏆
            </motion.div>
            <p className="text-3xl font-black text-game-success">YOU WON!</p>
            <p className="text-sm text-gray-300 mt-2">
              {pickedLabel}
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* === PHASE: CELEBRATION (LOSE) - Consolation === */}
      {phase === 'celebration' && !isWin && (
        <motion.div className="relative flex flex-col items-center">
          {/* Subtle particles */}
          <Confetti
            count={15}
            colors={['#6b7280', '#9ca3af', '#d1d5db']}
            duration={2}
          />

          {/* Consolation card */}
          <motion.div
            className="w-72 rounded-2xl p-6 flex flex-col items-center border-4 bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-gray-500"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {/* Wobbling broken heart */}
            <motion.div
              className="text-6xl mb-4"
              animate={{
                rotate: [-5, 5, -5],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              💔
            </motion.div>

            {/* Random consolation message */}
            <motion.p
              className="text-2xl font-bold text-gray-300 mb-2"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {consolation.text}
            </motion.p>

            <motion.span
              className="text-4xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.4 }}
            >
              {consolation.emoji}
            </motion.span>

            <p className="text-xs text-gray-500 mt-4">$0.00</p>
          </motion.div>
        </motion.div>
      )}

      {/* === PHASE: POINTS (WIN ONLY) === */}
      {phase === 'points' && isWin && (
        <motion.div
          className="relative flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Continuing confetti */}
          <VictoryConfetti count={50} duration={3} />

          {/* Points display */}
          <motion.div
            className="text-center"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            {/* Money bag emoji */}
            <motion.div
              className="text-7xl mb-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              💰
            </motion.div>

            {/* Animated counter */}
            <motion.div
              className="text-6xl font-black text-game-gold mb-2"
              animate={{
                scale: [1, 1.05, 1],
                textShadow: [
                  '0 0 20px rgba(255,215,0,0.5)',
                  '0 0 40px rgba(255,215,0,0.8)',
                  '0 0 20px rgba(255,215,0,0.5)',
                ],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              +$<AnimatedCounter target={pick.points_awarded} duration={1.2} decimals={2} />
            </motion.div>

            <motion.p
              className="text-lg text-gray-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              USD
            </motion.p>

            {/* Mini coin bursts during counting */}
            <GoldCoinBurst
              count={8}
              radius={100}
              emojis={['🪙', '✨']}
              delay={0.3}
            />
            <GoldCoinBurst
              count={8}
              radius={80}
              emojis={['🪙', '✨']}
              delay={0.8}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Skip hint */}
      <AnimatePresence>
        {canSkip && (
          <motion.p
            className="absolute bottom-8 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Tap to skip
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

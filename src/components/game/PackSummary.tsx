'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VictoryConfetti } from '../animations/Confetti';
import { GoldCoinBurst, TrophyBurst } from '../animations/CoinBurst';
import { isPSG1 } from '@/lib/platform';
import { GP, isGamepadButtonPressed } from '@/lib/gamepad';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';

interface PackSummaryProps {
  correctCount: number;
  totalPicks: number;
  totalUSD: number;
  onClose: () => void;
  onOpenAnother: () => void;
  skipAnimations?: boolean; // Skip celebration and show summary directly with no delays
}

type Phase = 'celebration' | 'summary';

// Animated counter component
function AnimatedCounter({
  target,
  duration = 1.5,
  decimals = 2,
  prefix = '',
  suffix = '',
  onComplete,
}: {
  target: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
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

  return (
    <span>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Get rank badge color
function getRankBadgeColor(rank: number): string {
  if (rank <= 3) return 'from-yellow-500 to-yellow-600'; // Gold
  if (rank <= 10) return 'from-gray-300 to-gray-400'; // Silver
  if (rank <= 25) return 'from-amber-600 to-amber-700'; // Bronze
  return 'from-gray-500 to-gray-600'; // Gray
}

export function PackSummary({
  correctCount,
  totalPicks,
  totalUSD,
  onClose,
  onOpenAnother,
  skipAnimations = false,
}: PackSummaryProps) {
  const [phase, setPhase] = useState<Phase>(skipAnimations ? 'summary' : 'celebration');
  const [canSkip, setCanSkip] = useState(false);
  const onCloseRef = useRef(onClose);

  // Animation delay multiplier (0 for instant, 1 for normal)
  const d = skipAnimations ? 0 : 1;

  // Calculate stats
  const accuracy = totalPicks > 0 ? Math.round((correctCount / totalPicks) * 100) : 0;

  // Mock rank data (random between 15-50)
  const [mockRank] = useState(() => Math.floor(Math.random() * 36) + 15);
  const [mockTotalUSD] = useState(() => totalUSD + Math.random() * 100 + 25);

  // Keep ref updated
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Phase timing (skip if skipAnimations)
  useEffect(() => {
    if (skipAnimations) return;

    const timers: NodeJS.Timeout[] = [];

    // Enable skip after a short delay
    timers.push(setTimeout(() => setCanSkip(true), 500));

    // Phase transitions: celebration (2s) → summary
    timers.push(setTimeout(() => setPhase('summary'), 2000));

    return () => timers.forEach(clearTimeout);
  }, [skipAnimations]);

  // Skip handler - only works during celebration phase
  const handleSkip = useCallback(() => {
    if (!canSkip) return;

    if (phase === 'celebration') {
      setPhase('summary');
    }
    // In summary phase, tap doesn't auto-close (user should use buttons)
  }, [canSkip, phase]);

  // PSG1 support
  const psg1 = isPSG1();

  // PSG1: B button to skip celebration phase
  useEffect(() => {
    if (!psg1 || phase !== 'celebration') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); setPhase('summary'); }
    };
    let rafId: number | null = null;
    let prevB = false;
    const poll = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      if (bNow && !prevB) setPhase('summary');
      prevB = bNow;
      rafId = requestAnimationFrame(poll);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(poll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, phase]);

  // PSG1 navigation for CTA buttons in summary phase (0=View My Packs, 1=Open Another)
  const handleCTASelect = useCallback((index: number) => {
    if (index === 0) onClose();
    else onOpenAnother();
  }, [onClose, onOpenAnother]);

  const handleCTABack = useCallback(() => {
    onClose();
  }, [onClose]);

  const { focusedIndex: ctaFocusedIndex } = usePSG1Navigation({
    enabled: psg1 && phase === 'summary',
    itemCount: 2,
    columns: 2,
    onSelect: handleCTASelect,
    onBack: handleCTABack,
    initialIndex: 1, // Default to "Open Another"
  });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleSkip}
    >
      {/* === PHASE 1: CELEBRATION (2 seconds) === */}
      <AnimatePresence mode="wait">
        {phase === 'celebration' && (
          <motion.div
            key="celebration"
            className="relative flex flex-col items-center justify-center w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* VictoryConfetti */}
            <VictoryConfetti count={100} duration={4} />

            {/* GoldCoinBurst from center */}
            <GoldCoinBurst origin={{ x: 50, y: 50 }} radius={200} />

            {/* TrophyBurst */}
            <TrophyBurst radius={150} delay={0.3} />

            {/* Floating celebration emojis */}
            <div className="absolute inset-0 pointer-events-none">
              {['🎉', '🏆', '💰', '⭐', '🔥'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="absolute text-5xl"
                  style={{
                    left: `${10 + i * 20}%`,
                    top: '60%',
                  }}
                  initial={{ y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    y: [-50, -200],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 1],
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    ease: 'easeOut',
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </div>

            {/* Central celebration text */}
            <motion.div
              className="text-center z-10"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                🎊
              </motion.div>
              <motion.p
                className="text-4xl font-black text-game-gold"
                animate={{
                  textShadow: [
                    '0 0 20px rgba(255,215,0,0.5)',
                    '0 0 40px rgba(255,215,0,0.8)',
                    '0 0 20px rgba(255,215,0,0.5)',
                  ],
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                PACK COMPLETE!
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* === PHASE 2: SUMMARY (staggered reveal) === */}
        {phase === 'summary' && (
          <motion.div
            key="summary"
            className="relative flex flex-col items-center justify-center w-full h-full px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()} // Prevent skip on this phase
          >
            {/* Main Summary Card - delay 0ms */}
            <motion.div
              className="w-full max-w-sm bg-gradient-to-b from-game-primary to-game-bg border-4 border-game-gold rounded-2xl p-6 shadow-[0_0_60px_rgba(255,215,0,0.3)] mb-4"
              initial={{ scale: skipAnimations ? 1 : 0, rotateX: skipAnimations ? 0 : -20 }}
              animate={{ scale: 1, rotateX: 0 }}
              transition={skipAnimations ? { duration: 0 } : {
                type: 'spring',
                stiffness: 200,
                damping: 20,
              }}
            >
              {/* Header - delay 0ms */}
              <div className="text-center mb-6">
                <motion.div
                  className="text-5xl mb-2"
                  animate={skipAnimations ? {} : { rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🏆
                </motion.div>
                <p className="text-2xl font-black text-game-gold">PACK COMPLETE!</p>
              </div>

              {/* Hits + Accuracy - delay 200ms */}
              <motion.div
                className="flex items-center justify-center gap-4 mb-6"
                initial={{ opacity: skipAnimations ? 1 : 0, y: skipAnimations ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * d }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-game-success text-2xl">✓</span>
                  <span className="text-3xl font-black text-white">{correctCount}/{totalPicks}</span>
                  <span className="text-gray-400 text-sm ml-1">HITS</span>
                </div>
                <span className="text-gray-500">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-white">{accuracy}%</span>
                  <span className="text-gray-400 text-sm">Accuracy</span>
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div
                className="border-t border-gray-700 my-4"
                initial={{ scaleX: skipAnimations ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 * d, duration: 0.3 * d }}
              />

              {/* USD Won - delay 500ms */}
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: skipAnimations ? 1 : 0, y: skipAnimations ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 * d }}
              >
                <motion.p
                  className="text-4xl font-black text-game-gold"
                  animate={skipAnimations ? {} : { scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.5, repeat: 2, delay: 0.7 * d }}
                >
                  {skipAnimations ? (
                    <span>${totalUSD.toFixed(2)}</span>
                  ) : (
                    <AnimatedCounter target={totalUSD} prefix="$" decimals={2} duration={1.2} />
                  )}
                </motion.p>
                <p className="text-gray-400 text-sm">USD WON</p>
              </motion.div>

              {/* Divider */}
              <motion.div
                className="border-t border-gray-700 my-4"
                initial={{ scaleX: skipAnimations ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8 * d, duration: 0.3 * d }}
              />

              {/* Ranking Section - delay 900ms */}
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: skipAnimations ? 1 : 0, y: skipAnimations ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 * d }}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <motion.div
                    className={`w-12 h-12 rounded-full bg-gradient-to-b ${getRankBadgeColor(mockRank)} flex items-center justify-center shadow-lg`}
                    initial={{ scale: skipAnimations ? 1 : 0, rotate: skipAnimations ? 0 : -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.0 * d, type: 'spring' }}
                  >
                    <span className="text-white font-black text-sm">#{mockRank}</span>
                  </motion.div>
                  <div>
                    <p className="text-white font-bold text-sm">YOUR RANK</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-game-gold font-bold">${mockTotalUSD.toFixed(2)}</p>
                  <p className="text-gray-400 text-xs">Total</p>
                </div>
              </motion.div>
            </motion.div>

            {/* CTAs - delay 1300ms */}
            <motion.div
              className="w-full max-w-sm flex gap-3"
              initial={{ opacity: skipAnimations ? 1 : 0, y: skipAnimations ? 0 : 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 * d }}
            >
              <motion.button
                onClick={onClose}
                className={`flex-1 py-3 px-4 bg-game-primary border-2 border-card-border rounded-xl font-bold text-white hover:bg-game-primary/80 transition-colors ${psg1 && ctaFocusedIndex === 0 ? 'psg1-focus' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View My Packs
              </motion.button>
              <motion.button
                onClick={onOpenAnother}
                className={`flex-1 py-3 px-4 bg-gradient-to-r from-game-gold to-yellow-500 rounded-xl font-bold text-black hover:from-yellow-400 hover:to-yellow-500 transition-colors ${psg1 && ctaFocusedIndex === 1 ? 'psg1-focus' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Open Another
              </motion.button>
            </motion.div>
            {psg1 && (
              <motion.p
                className="mt-3 text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 * d }}
              >
                [A] My Packs  [B] Open Another
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip hint - only during celebration */}
      <AnimatePresence>
        {canSkip && phase === 'celebration' && (
          <motion.p
            className="absolute bottom-8 text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {psg1 ? '[B] Skip' : 'Tap to skip'}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

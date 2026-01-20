'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { QueueCard } from '@/components/game/QueueCard';
import { RevealAnimation } from '@/components/animations/RevealAnimation';
import { useMyPacksStore, useStoredPack } from '@/stores';
import type { UserPick, Event } from '@/types';

export default function QueuePage({ params }: { params: { packId: string } }) {
  const { packId } = params;

  // Load pack from myPacks store
  const storedPack = useStoredPack(packId);
  const updatePick = useMyPacksStore((state) => state.updatePick);

  const [picks, setPicks] = useState<(UserPick & { event: Event })[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingPick, setRevealingPick] = useState<(UserPick & { event: Event }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyToast, setShowBuyToast] = useState(false);

  // Handle "Open Another Pack" click - show buy notification
  const handleOpenAnotherPack = () => {
    setShowBuyToast(true);
    // Auto-hide after 3 seconds
    setTimeout(() => setShowBuyToast(false), 3000);
    // TODO: Track this click for analytics
    console.log('[Analytics] User clicked "Open Another Pack"');
  };

  // Initialize picks from stored pack
  useEffect(() => {
    if (storedPack) {
      const sortedPicks = [...storedPack.picks].sort((a, b) => a.position - b.position);
      setPicks(sortedPicks);

      // Find the current reveal index (first non-revealed pick)
      const firstUnrevealed = sortedPicks.findIndex((p) => !p.reveal_animation_played);
      setCurrentRevealIndex(firstUnrevealed === -1 ? sortedPicks.length : firstUnrevealed);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [storedPack]);

  // Show not found state
  if (!isLoading && !storedPack) {
    return (
      <main className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-xl font-bold mb-2">Pack Not Found</h1>
          <p className="text-gray-400 mb-6">This pack doesn&apos;t exist or has been removed.</p>
          <Link
            href="/my-packs"
            className="btn-pixel-gold inline-block"
          >
            View My Packs
          </Link>
        </div>
      </main>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-game-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse">📦</div>
          <p className="mt-4 text-gray-400">Loading pack...</p>
        </div>
      </main>
    );
  }

  // Calculate stats
  const resolvedCount = picks.filter((p) => p.reveal_animation_played).length;
  const totalPoints = picks.reduce((sum, p) => sum + p.points_awarded, 0);
  const correctCount = picks.filter((p) => p.is_correct).length;

  // Check if next card can be revealed
  const nextPick = picks[currentRevealIndex];
  const canReveal = nextPick?.is_resolved && !nextPick?.reveal_animation_played;

  const handleReveal = () => {
    if (!canReveal || !nextPick) return;

    setIsRevealing(true);
    setRevealingPick(nextPick);
  };

  const handleRevealComplete = () => {
    if (!revealingPick) return;

    // Mark as revealed locally
    setPicks((prev) =>
      prev.map((p) =>
        p.id === revealingPick.id ? { ...p, reveal_animation_played: true } : p
      )
    );

    // Sync to myPacks store (persists to localStorage)
    updatePick(packId, revealingPick.id, { reveal_animation_played: true });

    setCurrentRevealIndex((prev) => prev + 1);
    setIsRevealing(false);
    setRevealingPick(null);
  };

  return (
    <main className="min-h-screen bg-game-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-game-bg/95 backdrop-blur-sm border-b border-card-border p-4">
        <div className="flex items-center justify-between">
          <Link href="/my-packs" className="text-gray-400 hover:text-white">
            ← My Packs
          </Link>
          <h1 className="font-bold">Your Queue</h1>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="p-4 border-b border-card-border">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Progress</p>
            <p className="text-lg font-bold">
              {resolvedCount}/{picks.length} revealed
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Points</p>
            <p className="text-lg font-bold text-game-gold">
              {totalPoints.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-card-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-game-gold"
            initial={{ width: 0 }}
            animate={{ width: `${(resolvedCount / picks.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Reveal Button (if available) */}
      {canReveal && !isRevealing && (
        <div className="p-4">
          <motion.button
            className="w-full btn-pixel-gold"
            onClick={handleReveal}
            initial={{ scale: 0.95 }}
            animate={{ scale: [0.95, 1.02, 0.95] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Reveal Card #{currentRevealIndex + 1}
          </motion.button>
        </div>
      )}

      {/* Waiting message */}
      {!canReveal && !isRevealing && currentRevealIndex < picks.length && (
        <div className="p-4 text-center">
          <motion.p
            className="text-sm text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Waiting for event #{currentRevealIndex + 1} to resolve...
          </motion.p>
        </div>
      )}

      {/* Pack complete */}
      {currentRevealIndex >= picks.length && (
        <div className="p-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-4xl mb-2"
          >
            🎉
          </motion.div>
          <p className="text-lg font-bold">Pack Complete!</p>
          <p className="text-sm text-gray-400">
            {correctCount}/{picks.length} correct • {totalPoints.toFixed(1)} points
          </p>
        </div>
      )}

      {/* Picks List */}
      <div className="flex-1 p-4 pb-24">
        <div className="space-y-3 max-w-md mx-auto">
          {picks.map((pick, index) => (
            <QueueCard
              key={pick.id}
              pick={pick}
              position={index + 1}
              isRevealed={pick.reveal_animation_played}
              isNext={index === currentRevealIndex}
              isLocked={index > currentRevealIndex}
            />
          ))}

          {/* Open Another Pack CTA */}
          <motion.button
            onClick={handleOpenAnotherPack}
            className="w-full mt-6 py-4 px-6 bg-gradient-to-r from-game-accent/20 to-game-gold/20 border-2 border-dashed border-game-accent/50 rounded-xl hover:border-game-accent transition-colors group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl group-hover:animate-bounce">📦</span>
              <div className="text-left">
                <p className="font-bold text-game-accent">Open Another Pack</p>
                <p className="text-xs text-gray-400">Keep the momentum going!</p>
              </div>
              <span className="text-xl">→</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Buy Pack Toast Notification */}
      <AnimatePresence>
        {showBuyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-50"
          >
            <div className="bg-game-primary border-2 border-game-gold rounded-xl p-4 shadow-lg max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <div className="flex-1">
                  <p className="font-bold text-game-gold">Buy More Packs!</p>
                  <p className="text-sm text-gray-300">You need to purchase a pack to open another one.</p>
                </div>
                <button
                  onClick={() => setShowBuyToast(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal Animation Overlay */}
      <AnimatePresence>
        {isRevealing && revealingPick && (
          <RevealAnimation
            pick={revealingPick}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QueueCard } from '@/components/game/QueueCard';
import { RevealAnimation } from '@/components/animations/RevealAnimation';
import { PackSummary } from '@/components/game/PackSummary';
import { useMyPacksStore, useStoredPack, useSessionStore, usePackSummaries } from '@/stores';
import { useEventSync } from '@/hooks/useEventSync';
import type { UserPick, Event } from '@/types';

export default function QueuePage({ params }: { params: { packId: string } }) {
  const { packId } = params;
  const router = useRouter();

  // Load pack from myPacks store
  const storedPack = useStoredPack(packId);
  const updatePick = useMyPacksStore((state) => state.updatePick);
  const anonymousId = useSessionStore((state) => state.anonymousId);
  const packSummaries = usePackSummaries();

  const [picks, setPicks] = useState<(UserPick & { event: Event })[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingPick, setRevealingPick] = useState<(UserPick & { event: Event }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyToast, setShowBuyToast] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryDismissed, setSummaryDismissed] = useState(false); // User explicitly dismissed summary
  const [wasAlreadyComplete, setWasAlreadyComplete] = useState(false); // Pack was complete on mount

  // Poll for event resolutions
  useEventSync(packId);

  // Handle "Open Another Pack" click - check availability first
  const handleOpenAnotherPack = async () => {
    setSummaryDismissed(true); // Prevent summary from re-opening
    setShowSummary(false);

    // Count packs opened this week from local storage (for instant/accurate feedback)
    const getLocalPacksThisWeek = () => {
      const now = new Date();
      const day = now.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setUTCDate(now.getUTCDate() + diff);
      monday.setUTCHours(0, 0, 0, 0);

      return packSummaries.filter((pack) => {
        const openedAt = new Date(pack.openedAt);
        return openedAt >= monday;
      }).length;
    };

    const localPacksThisWeek = getLocalPacksThisWeek();
    const weeklyLimit = 2;

    // Check local count first (most accurate since DB sync might be delayed)
    if (localPacksThisWeek >= weeklyLimit) {
      setShowBuyToast(true);
      setTimeout(() => setShowBuyToast(false), 3000);
      console.log('[Analytics] User clicked "Open Another Pack" - no packs (local check)');
      return;
    }

    // Also check API for extra safety
    if (anonymousId) {
      try {
        const response = await fetch(
          `/api/packs/availability?anonymousId=${encodeURIComponent(anonymousId)}`
        );

        if (response.ok) {
          const data = await response.json();
          const apiPacksOpened = data.packsOpenedThisWeek ?? 0;

          // Use maximum of local and API count (most restrictive)
          const packsOpenedThisWeek = Math.max(localPacksThisWeek, apiPacksOpened);
          const packsRemaining = Math.max(0, weeklyLimit - packsOpenedThisWeek);

          if (packsRemaining > 0) {
            // Has packs remaining, navigate to open new pack
            window.location.href = '/pack/open/sports';
            return;
          }
        }
      } catch (error) {
        console.error('Error checking pack availability:', error);
      }
    }

    // If we got here and local check passed, allow opening (local-first approach)
    if (localPacksThisWeek < weeklyLimit) {
      window.location.href = '/pack/open/sports';
      return;
    }

    // No packs remaining, show buy toast
    setShowBuyToast(true);
    setTimeout(() => setShowBuyToast(false), 3000);
    console.log('[Analytics] User clicked "Open Another Pack" - no packs');
  };

  // Handle "View My Packs" click from summary
  const handleViewMyPacks = () => {
    setShowSummary(false);
    router.push('/my-packs');
  };

  // Initialize and sync picks from stored pack
  useEffect(() => {
    if (storedPack) {
      const sortedPicks = [...storedPack.picks].sort((a, b) => a.position - b.position);
      setPicks(sortedPicks);

      // Only update reveal index if not currently revealing
      if (!isRevealing) {
        const firstUnrevealed = sortedPicks.findIndex((p) => !p.reveal_animation_played);
        const newIndex = firstUnrevealed === -1 ? sortedPicks.length : firstUnrevealed;
        setCurrentRevealIndex(newIndex);

        // Check if pack was already complete on mount (all picks revealed)
        if (isLoading && newIndex >= sortedPicks.length) {
          setWasAlreadyComplete(true);
          setShowSummary(true); // Show summary immediately
        }
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [storedPack, isRevealing, isLoading]);

  // Show summary when pack is complete (all picks revealed)
  // Don't show if: already showing, user dismissed it, or pack was already complete on mount (handled above)
  useEffect(() => {
    if (
      picks.length > 0 &&
      currentRevealIndex >= picks.length &&
      !isRevealing &&
      !showSummary &&
      !summaryDismissed &&
      !wasAlreadyComplete // Already handled in init effect
    ) {
      // Small delay to let the last reveal finish
      const timer = setTimeout(() => setShowSummary(true), 500);
      return () => clearTimeout(timer);
    }
  }, [currentRevealIndex, picks.length, isRevealing, showSummary, summaryDismissed, wasAlreadyComplete]);

  // Memoized callback for reveal complete (must be before early returns)
  const handleRevealComplete = useCallback(() => {
    setRevealingPick((currentRevealingPick) => {
      if (!currentRevealingPick) return null;

      // Mark as revealed locally
      setPicks((prev) =>
        prev.map((p) =>
          p.id === currentRevealingPick.id ? { ...p, reveal_animation_played: true } : p
        )
      );

      // Sync to myPacks store (persists to localStorage)
      updatePick(packId, currentRevealingPick.id, { reveal_animation_played: true });

      setCurrentRevealIndex((prev) => prev + 1);
      setIsRevealing(false);

      return null;
    });
  }, [packId, updatePick]);

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
  const correctCount = picks.filter((p) => p.is_correct && p.reveal_animation_played).length;

  // Check if next card can be revealed
  const nextPick = picks[currentRevealIndex];
  const canReveal = nextPick?.is_resolved && !nextPick?.reveal_animation_played;

  const handleReveal = () => {
    if (!canReveal || !nextPick) return;

    setIsRevealing(true);
    setRevealingPick(nextPick);
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
            <p className="text-xs text-gray-400">USD</p>
            <p className="text-lg font-bold text-game-gold">
              ${totalPoints.toFixed(2)}
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

      {/* Pack complete indicator (shows when summary is dismissed) */}
      {currentRevealIndex >= picks.length && !showSummary && (
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
            {correctCount}/{picks.length} correct • ${totalPoints.toFixed(2)} USD
          </p>
          <button
            onClick={() => setShowSummary(true)}
            className="mt-3 text-game-gold text-sm underline"
          >
            View Summary
          </button>
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
              onReveal={index === currentRevealIndex ? handleReveal : undefined}
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

      {/* Pack Summary Overlay */}
      <AnimatePresence>
        {showSummary && (
          <PackSummary
            correctCount={correctCount}
            totalPicks={picks.length}
            totalUSD={totalPoints}
            onClose={handleViewMyPacks}
            onOpenAnother={handleOpenAnotherPack}
            skipAnimations={wasAlreadyComplete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PackSprite } from '@/components/sprites/PackSprite';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PackListItem } from '@/components/packs';
import { useSessionStore, usePackSummaries, useTotalPendingReveals } from '@/stores';

interface WeeklyPackStatus {
  packsOpenedThisWeek: number;
  packsRemaining: number;
  canOpenPack: boolean;
  weeklyLimit: number;
  weekEndsAt?: string;
}

export default function GameHomePage() {
  const profile = useSessionStore((state) => state.profile);
  const anonymousId = useSessionStore((state) => state.anonymousId);
  const isProfileSynced = useSessionStore((state) => state.isProfileSynced);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredPack, setHoveredPack] = useState<'left' | 'right' | null>(null);
  const [showBuyToast, setShowBuyToast] = useState(false);
  const [weeklyStatus, setWeeklyStatus] = useState<WeeklyPackStatus | null>(null);

  // Get active packs from myPacks store
  const packSummaries = usePackSummaries();
  const pendingReveals = useTotalPendingReveals();

  // Filter active (non-completed) packs
  const activePacks = packSummaries.filter((p) => p.status !== 'completed');
  const previewPacks = activePacks.slice(0, 2); // Show max 2 on home
  const remainingActivePacks = activePacks.length - previewPacks.length;
  const hasActivePacks = activePacks.length > 0;

  const weeklyPoints = profile?.total_points ?? 0;
  const weeklyRank = profile?.best_weekly_rank ?? '-';

  // Count packs opened this week from local storage (for instant feedback)
  const localPacksThisWeek = (() => {
    // Get start of current week (Monday 00:00:00 UTC)
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
  })();

  // Fetch weekly pack status from API
  useEffect(() => {
    async function fetchWeeklyStatus() {
      if (!anonymousId || !isProfileSynced) return;

      try {
        const response = await fetch(
          `/api/packs/availability?anonymousId=${encodeURIComponent(anonymousId)}`
        );
        if (response.ok) {
          const data = await response.json();
          setWeeklyStatus(data);
        }
      } catch (error) {
        console.error('Error fetching weekly status:', error);
      }
    }

    fetchWeeklyStatus();
  }, [anonymousId, isProfileSynced]);

  // Use the maximum of local count and API count (most restrictive)
  const weeklyLimit = weeklyStatus?.weeklyLimit ?? 2;
  const apiPacksOpened = weeklyStatus?.packsOpenedThisWeek ?? 0;
  const packsOpenedThisWeek = Math.max(localPacksThisWeek, apiPacksOpened);
  const packsRemaining = Math.max(0, weeklyLimit - packsOpenedThisWeek);

  // Handle buy pack click
  const handleBuyPack = () => {
    setShowBuyToast(true);
    setTimeout(() => setShowBuyToast(false), 3000);
    console.log('[Analytics] User clicked "Buy Pack" on Home');
  };

  return (
    <main className="flex-1 flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-20">
        {/* Weekly Stats */}
        <div className="w-full max-w-sm mb-8">
          <div className="card-pixel">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">This Week</p>
                <p className="text-2xl font-bold text-game-gold">${weeklyPoints}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Rank</p>
                <p className="text-2xl font-bold">#{weeklyRank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pack Area */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center w-full max-w-sm">
            {/* Pack Display - Visual stack based on packs remaining */}
            {packsRemaining > 0 ? (
              // Has packs to open - show as card hand
              <>
                <p className="text-sm text-gray-400 mb-6">Weekly Packs Available!</p>

                {/* Card hand layout */}
                <div className="relative flex justify-center items-end h-48 mb-4">
                  {/* Left card (main/front card) */}
                  <Link href="/pack/open/sports" className="absolute z-[2]">
                    <motion.div
                      className="cursor-pointer origin-bottom"
                      style={{ rotate: packsRemaining >= 2 ? -8 : 0, x: packsRemaining >= 2 ? -50 : 0 }}
                      whileHover={{ y: -20, rotate: packsRemaining >= 2 ? -5 : 0, scale: 1.05, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      onHoverStart={() => setHoveredPack('left')}
                      onHoverEnd={() => setHoveredPack(null)}
                    >
                      <PackSprite type="sports" size="lg" glowing={hoveredPack === 'left' || hoveredPack === null} />
                    </motion.div>
                  </Link>

                  {packsRemaining >= 2 && (
                    // Right card (back card)
                    <Link href="/pack/open/sports" className="absolute z-[1]">
                      <motion.div
                        className="cursor-pointer origin-bottom"
                        style={{ rotate: 8, x: 50 }}
                        whileHover={{ y: -20, rotate: 5, scale: 1.05, zIndex: 10 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onHoverStart={() => setHoveredPack('right')}
                        onHoverEnd={() => setHoveredPack(null)}
                      >
                        <PackSprite type="sports" size="lg" glowing={hoveredPack === 'right'} />
                      </motion.div>
                    </Link>
                  )}
                </div>

                <motion.p
                  className="text-lg font-bold"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Tap to Open
                </motion.p>

                <p className="mt-2 text-xs text-gray-500">
                  5 events • Make your picks • Win USD
                </p>
              </>
            ) : (
              // No packs remaining - show Buy New Pack
              <>
                <motion.div
                  className="cursor-pointer relative inline-block mb-4"
                  onHoverStart={() => setIsHovering(true)}
                  onHoverEnd={() => setIsHovering(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBuyPack}
                >
                  <PackSprite
                    type="sports"
                    size="lg"
                    glowing={isHovering}
                  />
                  {/* Buy New Pack tag */}
                  <motion.div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-game-gold text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg whitespace-nowrap"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Buy New Pack
                  </motion.div>
                </motion.div>

                <p className="text-sm text-gray-400 mt-4">
                  Come back next Monday for free packs!
                </p>
              </>
            )}

            {/* Active Packs Preview */}
            {hasActivePacks && (
              <div className="mt-8">
                <p className="text-sm text-gray-400 mb-3">
                  Games in progress
                  {pendingReveals > 0 && (
                    <span className="text-game-gold font-bold ml-2">
                      • {pendingReveals} ready!
                    </span>
                  )}
                </p>

                <div className="space-y-2 mb-4">
                  {previewPacks.map((pack, index) => (
                    <PackListItem key={pack.id} pack={pack} index={index} />
                  ))}
                </div>

                {remainingActivePacks > 0 && (
                  <Link
                    href="/my-packs"
                    className="btn-pixel inline-block"
                  >
                    View More ({remainingActivePacks} more)
                  </Link>
                )}
              </div>
            )}

            {/* Link to pack history if no active packs but has opened some */}
            {!hasActivePacks && packSummaries.length > 0 && (
              <Link
                href="/my-packs"
                className="mt-8 text-sm text-gray-400 hover:text-white inline-block"
              >
                View pack history →
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="w-full max-w-sm mt-8">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="card-pixel py-2">
              <p className="text-lg font-bold">{profile?.total_packs_opened ?? 0}</p>
              <p className="text-xs text-gray-400">Packs</p>
            </div>
            <div className="card-pixel py-2">
              <p className="text-lg font-bold">{profile?.total_correct_picks ?? 0}</p>
              <p className="text-xs text-gray-400">Correct</p>
            </div>
            <div className="card-pixel py-2">
              <p className="text-lg font-bold">{profile?.current_streak ?? 0}</p>
              <p className="text-xs text-gray-400">Streak</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Buy Pack Toast Notification */}
      <AnimatePresence>
        {showBuyToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-50 md:left-1/2 md:-translate-x-1/2 md:max-w-[398px]"
          >
            <div className="bg-game-primary border-2 border-game-gold rounded-xl p-4 shadow-lg max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <div className="flex-1">
                  <p className="font-bold text-game-gold">Coming Soon!</p>
                  <p className="text-sm text-gray-300">Pack purchases will be available soon.</p>
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
    </main>
  );
}

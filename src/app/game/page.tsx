'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackSprite } from '@/components/sprites/PackSprite';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';
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
  const router = useRouter();
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

  // PSG1 navigation
  const psg1 = isPSG1();
  const [menuView, setMenuView] = useState<'main' | 'packs'>('main');

  // PSG1 menu items
  const psg1MenuItems = [
    { label: 'Open Packs', icon: '📦', badge: packsRemaining > 0 ? packsRemaining : undefined },
    { label: 'My Picks', icon: '📋', badge: pendingReveals > 0 ? pendingReveals : undefined },
    { label: 'Leaderboard', icon: '🏆' },
    { label: 'Profile', icon: '👤' },
  ];

  // Web mode: Build navigable items list for pack sprites + active packs
  const packSpriteCount = packsRemaining > 0 ? Math.min(packsRemaining, 2) : 1; // 1 for buy button

  // PSG1: item count depends on current view
  const psg1PackCount = Math.max(packsRemaining, 0);
  const psg1NavItemCount = menuView === 'main'
    ? psg1MenuItems.length
    : Math.max(psg1PackCount, 1); // at least 1 for "no packs" state
  const navItemCount = psg1
    ? psg1NavItemCount
    : packSpriteCount + previewPacks.length + (remainingActivePacks > 0 ? 1 : 0);

  const handleMenuSelect = useCallback((index: number) => {
    switch (index) {
      case 0: setMenuView('packs'); break;
      case 1: router.push('/my-packs'); break;
      case 2: router.push('/leaderboard'); break;
      case 3: router.push('/profile'); break;
    }
  }, [router]);

  const handlePackSelect = useCallback(() => {
    if (packsRemaining > 0) {
      router.push('/pack/open/sports');
    }
  }, [router, packsRemaining]);

  const handleNavSelect = useCallback((index: number) => {
    if (!psg1) {
      if (index < packSpriteCount) {
        if (packsRemaining > 0) {
          router.push('/pack/open/sports');
        } else {
          handleBuyPack();
        }
      } else if (index < packSpriteCount + previewPacks.length) {
        const packIndex = index - packSpriteCount;
        router.push(`/pack/${previewPacks[packIndex].id}`);
      } else {
        router.push('/my-packs');
      }
      return;
    }
    if (menuView === 'main') {
      handleMenuSelect(index);
    } else {
      handlePackSelect();
    }
  }, [psg1, menuView, packsRemaining, packSpriteCount, previewPacks, router, handleMenuSelect, handlePackSelect]);

  const handleNavBack = useCallback(() => {
    if (psg1 && menuView === 'packs') {
      setMenuView('main');
      return;
    }
    router.push('/');
  }, [psg1, menuView, router]);

  const { focusedIndex } = usePSG1Navigation({
    enabled: psg1,
    itemCount: navItemCount,
    columns: menuView === 'packs' && packsRemaining >= 2 ? 2 : 1,
    onSelect: handleNavSelect,
    onBack: handleNavBack,
  });

  // Auto-scroll focused item into view
  const focusedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (psg1 && focusedRef.current) {
      focusedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [psg1, focusedIndex]);

  return (
    <main className="flex-1 flex flex-col">
      {/* PSG1: Custom minimal header (Explore-style) */}
      {psg1 ? (
        <div className="sticky top-0 z-20 bg-game-bg/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={handleNavBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold font-pixel-heading"
            >
              PLAY DRAFT
            </motion.h1>
            <div className="flex-1" />
            <span className="text-xs text-game-gold">
              ${weeklyPoints}
            </span>
            <span className="text-xs text-gray-400">
              #{weeklyRank}
            </span>
          </div>
        </div>
      ) : (
        <Header />
      )}

      {/* PSG1: Full-screen menu */}
      {psg1 ? (
        <>
          <div className="flex-1 flex flex-col p-4 pb-16">
            {menuView === 'main' ? (
              /* Main menu */
              <div className="space-y-2">
                {psg1MenuItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    ref={focusedIndex === i ? focusedRef : undefined}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                      focusedIndex === i
                        ? 'border-game-accent bg-game-accent/10 psg1-focus'
                        : 'border-card-border bg-white/5'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleMenuSelect(i)}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="flex-1 text-lg font-bold">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-game-gold text-black text-xs font-bold px-2">
                        {item.badge}
                      </span>
                    )}
                    <span className="text-gray-500">{'\u203A'}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Pack sprites view */
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-sm text-gray-400 mb-6">
                  {packsRemaining > 0
                    ? `${packsRemaining} pack${packsRemaining > 1 ? 's' : ''} remaining`
                    : 'No packs available'}
                </p>

                {packsRemaining > 0 ? (
                  <>
                    <div className="relative flex justify-center items-end h-48 mb-4">
                      {/* First pack */}
                      <motion.div
                        ref={focusedIndex === 0 ? focusedRef : undefined}
                        className={`cursor-pointer origin-bottom ${focusedIndex === 0 ? 'psg1-focus rounded-lg' : ''}`}
                        style={{
                          rotate: packsRemaining >= 2 ? -8 : 0,
                          x: packsRemaining >= 2 ? -50 : 0,
                          zIndex: focusedIndex === 0 ? 10 : 2,
                        }}
                        animate={focusedIndex === 0 ? { y: -15, scale: 1.05 } : { y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={handlePackSelect}
                      >
                        <PackSprite type="sports" size="lg" glowing={focusedIndex === 0} />
                      </motion.div>

                      {packsRemaining >= 2 && (
                        <motion.div
                          ref={focusedIndex === 1 ? focusedRef : undefined}
                          className={`absolute cursor-pointer origin-bottom ${focusedIndex === 1 ? 'psg1-focus rounded-lg' : ''}`}
                          style={{
                            rotate: 8,
                            x: 50,
                            zIndex: focusedIndex === 1 ? 10 : 1,
                          }}
                          animate={focusedIndex === 1 ? { y: -15, scale: 1.05 } : { y: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          onClick={handlePackSelect}
                        >
                          <PackSprite type="sports" size="lg" glowing={focusedIndex === 1} />
                        </motion.div>
                      )}
                    </div>

                    <motion.p
                      className="text-lg font-bold"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Press B to Open
                    </motion.p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-gray-400">Come back next Monday!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PSG1: Button hints bar */}
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-game-bg/95 border-t border-white/10 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>[A] Back</span>
              <span>[B] {menuView === 'main' ? 'Select' : 'Open'}</span>
            </div>
          </div>
        </>
      ) : (
        <>
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
                        <div key={pack.id}>
                          <PackListItem pack={pack} index={index} />
                        </div>
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
        </>
      )}

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

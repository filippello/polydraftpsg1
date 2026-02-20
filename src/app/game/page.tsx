'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackSprite } from '@/components/sprites/PackSprite';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';
import { PSG1BackButton } from '@/components/layout/PSG1BackButton';
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

  // Handle buy pack click — navigate to premium pack purchase
  const handleBuyPack = () => {
    router.push('/pack/open/sports?premium=true');
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
      {/* PSG1: Custom minimal header */}
      {psg1 ? (
        <div className="pt-3 px-4 pb-1">
          <div className="flex items-center justify-between">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-balatro-lg font-pixel-heading text-white"
              style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.8), 4px 4px 0 rgba(0,0,0,0.4)' }}
            >
              PLAY DRAFT
            </motion.h1>
            <div className="flex items-center gap-3">
              <span className="text-balatro-sm font-pixel-body text-emerald-400" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}>
                ${weeklyPoints}
              </span>
              <span className="text-balatro-sm font-pixel-body text-gray-500" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.8)' }}>
                #{weeklyRank}
              </span>
              <PSG1BackButton onClick={handleNavBack} />
            </div>
          </div>
        </div>
      ) : (
        <Header />
      )}

      {/* PSG1: Full-screen menu */}
      {psg1 ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
            {menuView === 'main' ? (
              /* Main menu */
              <div className="w-full max-w-xs bg-white/[0.03] rounded-2xl border border-white/[0.06] p-3 space-y-1.5 backdrop-blur-sm">
                {psg1MenuItems.map((item, i) => {
                  const isFocused = focusedIndex === i;
                  return (
                    <motion.div
                      key={item.label}
                      ref={isFocused ? focusedRef : undefined}
                      className={`relative flex items-center justify-center py-3.5 px-4 rounded-xl cursor-pointer transition-all ${
                        isFocused
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                          : 'bg-white/[0.04] border border-white/[0.06]'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: isFocused ? 1.02 : 1,
                      }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={() => handleMenuSelect(i)}
                    >
                      <span
                        className={`text-balatro-base font-pixel-heading tracking-wide ${
                          isFocused ? 'text-black' : 'text-gray-300'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span className={`absolute right-3 min-w-[22px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                          isFocused
                            ? 'bg-black/20 text-white'
                            : 'bg-emerald-500/80 text-black'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              /* Pack sprites view */
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-balatro-base font-pixel-heading text-gray-300 mb-6"
                >
                  {packsRemaining > 0
                    ? `${packsRemaining} pack${packsRemaining > 1 ? 's' : ''} remaining`
                    : 'No packs available'}
                </motion.p>

                {packsRemaining > 0 ? (
                  <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-6 backdrop-blur-sm">
                    <div className="relative flex justify-center items-end h-48 mb-4">
                      {/* First pack */}
                      <motion.div
                        ref={focusedIndex === 0 ? focusedRef : undefined}
                        className="cursor-pointer origin-bottom"
                        style={{
                          rotate: packsRemaining >= 2 ? -8 : 0,
                          x: packsRemaining >= 2 ? -50 : 0,
                          zIndex: focusedIndex === 0 ? 10 : 2,
                        }}
                        animate={focusedIndex === 0
                          ? { y: -15, scale: 1.08, filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.5))' }
                          : { y: 0, scale: 1, filter: 'drop-shadow(0 0 0 transparent)' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        onClick={handlePackSelect}
                      >
                        <PackSprite type="sports" size="lg" glowing={focusedIndex === 0} />
                      </motion.div>

                      {packsRemaining >= 2 && (
                        <motion.div
                          ref={focusedIndex === 1 ? focusedRef : undefined}
                          className="absolute cursor-pointer origin-bottom"
                          style={{
                            rotate: 8,
                            x: 50,
                            zIndex: focusedIndex === 1 ? 10 : 1,
                          }}
                          animate={focusedIndex === 1
                            ? { y: -15, scale: 1.08, filter: 'drop-shadow(0 0 16px rgba(16,185,129,0.5))' }
                            : { y: 0, scale: 1, filter: 'drop-shadow(0 0 0 transparent)' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                          onClick={handlePackSelect}
                        >
                          <PackSprite type="sports" size="lg" glowing={focusedIndex === 1} />
                        </motion.div>
                      )}
                    </div>

                    <motion.p
                      className="text-balatro-sm font-pixel-body text-emerald-400 text-center"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Press B to Open
                    </motion.p>
                  </div>
                ) : (
                  <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 backdrop-blur-sm text-center">
                    <p className="text-4xl mb-4">📭</p>
                    <p className="text-balatro-sm font-pixel-body text-gray-500">
                      Come back next Monday!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PSG1: Button hints bar */}
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-black/40 border-t border-white/[0.06] backdrop-blur-sm px-6 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-balatro-xs font-pixel-body text-gray-500">
                [A] Back
              </span>
              <span className="text-balatro-xs font-pixel-body text-emerald-400">
                [B] {menuView === 'main' ? 'Select' : 'Open'}
              </span>
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
                {/* Pack Display - Free packs left, Premium pack right */}
                <div className="flex items-end justify-center gap-10 mb-4">
                  {/* Free packs group (left side) */}
                  <div className="flex flex-col items-center">
                    {packsRemaining > 0 ? (
                      <>
                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Free Packs</p>
                        <div className="relative flex justify-center items-end h-48">
                          {/* First free pack */}
                          <Link href="/pack/open/sports" className="absolute z-[2]">
                            <motion.div
                              className="cursor-pointer origin-bottom"
                              style={{ rotate: packsRemaining >= 2 ? -8 : 0, x: packsRemaining >= 2 ? -30 : 0 }}
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
                            <Link href="/pack/open/sports" className="absolute z-[1]">
                              <motion.div
                                className="cursor-pointer origin-bottom"
                                style={{ rotate: 8, x: 30 }}
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
                          className="text-sm font-bold mt-2"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Tap to Open
                        </motion.p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">Free Packs</p>
                        <div className="flex items-end justify-center h-48">
                          <div className="opacity-40">
                            <PackSprite type="sports" size="lg" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Next Monday!
                        </p>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-48 w-px bg-white/10 self-center" />

                  {/* Premium pack (right side) */}
                  <div className="flex flex-col items-center">
                    <p className="text-xs text-game-gold mb-3 uppercase tracking-wider font-bold">Premium</p>
                    <div className="flex items-end justify-center h-48">
                      <motion.div
                        className="cursor-pointer relative"
                        onHoverStart={() => setIsHovering(true)}
                        onHoverEnd={() => setIsHovering(false)}
                        whileHover={{ y: -10, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBuyPack}
                      >
                        <PackSprite type="sports" size="lg" premium glowing={isHovering} />
                      </motion.div>
                    </div>
                    <motion.div
                      className="mt-2 bg-game-gold text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap cursor-pointer"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      onClick={handleBuyPack}
                    >
                      $1 USDC
                    </motion.div>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  5 events • Make your picks • Win USD
                </p>

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

    </main>
  );
}

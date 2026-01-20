'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { PackSprite } from '@/components/sprites/PackSprite';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PackListItem } from '@/components/packs';
import { useSessionStore, usePackSummaries, useTotalPendingReveals } from '@/stores';

export default function HomePage() {
  const profile = useSessionStore((state) => state.profile);
  const [isHovering, setIsHovering] = useState(false);
  const [showBuyToast, setShowBuyToast] = useState(false);

  // Get active packs from myPacks store
  const packSummaries = usePackSummaries();
  const pendingReveals = useTotalPendingReveals();

  // Filter active (non-completed) packs
  const activePacks = packSummaries.filter((p) => p.status !== 'completed');
  const previewPacks = activePacks.slice(0, 2); // Show max 2 on home
  const remainingPacks = activePacks.length - previewPacks.length;
  const hasActivePacks = activePacks.length > 0;
  const hasAnyPacks = packSummaries.length > 0;

  const weeklyPoints = profile?.total_points ?? 0;
  const weeklyRank = profile?.best_weekly_rank ?? '-';

  // Handle buy pack click
  const handleBuyPack = () => {
    setShowBuyToast(true);
    setTimeout(() => setShowBuyToast(false), 3000);
    // TODO: Track for analytics
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
          {hasAnyPacks ? (
            // Has packs - show Buy New Pack CTA + active packs preview
            <div className="text-center w-full max-w-sm">
              {/* Pack with Buy New Pack overlay */}
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
                  glowing={isHovering || (hasActivePacks && pendingReveals > 0)}
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

              {/* Active Packs Preview */}
              {hasActivePacks && (
                <>
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

                  {remainingPacks > 0 && (
                    <Link
                      href="/my-packs"
                      className="btn-pixel inline-block"
                    >
                      View More ({remainingPacks} more)
                    </Link>
                  )}
                </>
              )}

              {/* No active packs - just link to history */}
              {!hasActivePacks && (
                <Link
                  href="/my-packs"
                  className="mt-4 text-sm text-gray-400 hover:text-white inline-block"
                >
                  View pack history →
                </Link>
              )}
            </div>
          ) : (
            // No packs at all - show free weekly pack
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">Weekly Pack Available!</p>

              <motion.div
                className="cursor-pointer"
                onHoverStart={() => setIsHovering(true)}
                onHoverEnd={() => setIsHovering(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isHovering ? { y: [0, -5, 0] } : {}}
                transition={{ duration: 0.5, repeat: isHovering ? Infinity : 0 }}
              >
                <Link href="/pack/open/sports">
                  <PackSprite
                    type="sports"
                    size="lg"
                    glowing={isHovering}
                  />
                </Link>
              </motion.div>

              <motion.p
                className="mt-6 text-lg font-bold"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Tap to Open
              </motion.p>

              <p className="mt-2 text-xs text-gray-500">
                5 events • Make your picks • Win USD
              </p>
            </div>
          )}
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
            className="fixed bottom-24 left-4 right-4 z-50"
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

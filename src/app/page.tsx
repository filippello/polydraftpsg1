'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PackSprite } from '@/components/sprites/PackSprite';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSessionStore } from '@/stores';

export default function HomePage() {
  const profile = useSessionStore((state) => state.profile);
  const [isHovering, setIsHovering] = useState(false);

  // Mock data for now - will be replaced with real data
  const hasActivePack = false;
  const weeklyPoints = profile?.total_points ?? 0;
  const weeklyRank = profile?.best_weekly_rank ?? '-';

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
                <p className="text-2xl font-bold text-game-gold">{weeklyPoints} pts</p>
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
          {hasActivePack ? (
            // Active pack - show progress
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">Pack in progress</p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <PackSprite type="sports" size="lg" glowing />
              </motion.div>
              <p className="mt-4 text-lg font-bold">2/5 resolved</p>
              <Link
                href="/queue"
                className="mt-4 btn-pixel inline-block"
              >
                View Queue
              </Link>
            </div>
          ) : (
            // No active pack - show open button
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
                5 events • Make your picks • Win points
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
    </main>
  );
}

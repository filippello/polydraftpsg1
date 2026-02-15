'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSessionStore } from '@/stores';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';
import { usePSG1Scroll } from '@/hooks/usePSG1Scroll';
import { PSG1ScrollIndicator } from '@/components/layout/PSG1ScrollIndicator';
import { PSG1BackButton } from '@/components/layout/PSG1BackButton';

export default function ProfilePage() {
  const router = useRouter();
  const profile = useSessionStore((state) => state.profile);
  const anonymousId = useSessionStore((state) => state.anonymousId);
  const isProfileSynced = useSessionStore((state) => state.isProfileSynced);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [weeklyRank, setWeeklyRank] = useState<number | null>(null);
  const psg1 = isPSG1();

  const handleNavBack = useCallback(() => {
    router.push('/game');
  }, [router]);

  usePSG1Navigation({
    enabled: psg1,
    itemCount: 0,
    onBack: handleNavBack,
  });

  const { scrollPercent, isScrollable } = usePSG1Scroll(psg1);

  // Fetch weekly rank
  useEffect(() => {
    async function fetchWeeklyRank() {
      if (!anonymousId) return;

      try {
        const response = await fetch(
          `/api/leaderboard?limit=1&offset=0&anonymousId=${encodeURIComponent(anonymousId)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.userRank) {
            setWeeklyRank(data.userRank);
          }
        }
      } catch (error) {
        console.error('Error fetching weekly rank:', error);
      }
    }

    if (isProfileSynced) {
      fetchWeeklyRank();
    }
  }, [anonymousId, isProfileSynced]);

  const handleResetData = () => {
    // Clear all localStorage data
    localStorage.removeItem('polydraft-session');
    localStorage.removeItem('polydraft-my-packs');
    // Reload the page to reinitialize
    window.location.reload();
  };

  // Use profile stats from database, fallback to 0
  const stats = {
    totalPoints: profile?.total_points ?? 0,
    packsOpened: profile?.total_packs_opened ?? 0,
    correctPicks: profile?.total_correct_picks ?? 0,
    totalPicks: profile?.total_picks_made ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    longestStreak: profile?.longest_streak ?? 0,
    bestRank: profile?.best_weekly_rank ?? '-',
    accuracy: profile?.total_picks_made && profile.total_picks_made > 0
      ? ((profile.total_correct_picks / profile.total_picks_made) * 100).toFixed(1)
      : '0',
  };

  // Display name from database or fallback
  const displayName = profile?.display_name ?? profile?.username ?? 'Anonymous Player';

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {psg1 ? (
        <div className="sticky top-0 z-20 bg-game-bg/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3 p-4">
            <h1 className="text-xl font-bold font-pixel-heading">PROFILE</h1>
            <div className="flex-1" />
            <PSG1BackButton onClick={handleNavBack} />
          </div>
        </div>
      ) : (
        <Header />
      )}

      <div className="flex-1 flex flex-col p-4 pb-20">
        {/* Avatar & Name */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-3 bg-game-secondary rounded-full flex items-center justify-center border-4 border-game-accent">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-xs text-gray-500 mt-1">
            ID: {anonymousId?.slice(0, 8)}...
          </p>
          {!isProfileSynced && (
            <p className="text-xs text-yellow-500 mt-1">
              Syncing profile...
            </p>
          )}
        </motion.div>

        {/* Main Stats */}
        <motion.div
          className="card-pixel mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-game-gold">{stats.totalPoints.toFixed(1)}</p>
              <p className="text-xs text-gray-400">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{stats.packsOpened}</p>
              <p className="text-xs text-gray-400">Packs Opened</p>
            </div>
          </div>
        </motion.div>

        {/* Accuracy & Streaks */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-pixel text-center">
            <p className="text-2xl font-bold">{stats.accuracy}%</p>
            <p className="text-xs text-gray-400">Accuracy</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.correctPicks}/{stats.totalPicks} picks
            </p>
          </div>
          <div className="card-pixel text-center">
            <p className="text-2xl font-bold">{stats.currentStreak}</p>
            <p className="text-xs text-gray-400">Current Streak</p>
            <p className="text-xs text-gray-500 mt-1">
              Best: {stats.longestStreak}
            </p>
          </div>
        </motion.div>

        {/* Best Performance */}
        <motion.div
          className="card-pixel mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-bold mb-3">Best Performance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Best Weekly Rank</p>
              <p className="text-lg font-bold">
                {typeof stats.bestRank === 'number' ? `#${stats.bestRank}` : stats.bestRank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Current Week Rank</p>
              <p className="text-lg font-bold text-game-gold">
                {weeklyRank ? `#${weeklyRank}` : '-'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="card-pixel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-bold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {stats.packsOpened > 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                {stats.packsOpened} packs opened this week
              </p>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity yet
              </p>
            )}
          </div>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          className="mt-6 space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button className="w-full btn-pixel-secondary" disabled>
            Create Account (Coming Soon)
          </button>
          <p className="text-xs text-center text-gray-500">
            Save your progress and compete on the leaderboard
          </p>
        </motion.div>

        {/* Dev: Reset Data */}
        <motion.div
          className="mt-8 pt-6 border-t border-card-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-gray-500 text-center mb-3">Developer Options</p>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 px-4 text-sm text-game-error border border-game-error/30 rounded-lg hover:bg-game-error/10 transition-colors"
            >
              Reset All Data
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-game-error">
                This will delete all your local packs and progress!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2 px-4 text-sm border border-card-border rounded-lg hover:bg-card-border/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  className="flex-1 py-2 px-4 text-sm bg-game-error text-white rounded-lg hover:bg-game-error/80 transition-colors"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
      {psg1 && <PSG1ScrollIndicator scrollPercent={scrollPercent} isScrollable={isScrollable} />}
    </main>
  );
}

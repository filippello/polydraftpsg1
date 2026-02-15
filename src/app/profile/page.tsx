'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNavBack = useCallback(() => {
    router.push('/game');
  }, [router]);

  usePSG1Navigation({
    enabled: psg1,
    itemCount: 0,
    onBack: handleNavBack,
  });

  const { scrollPercent, isScrollable } = usePSG1Scroll(psg1, psg1 ? scrollRef : undefined);

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

  const glassCard = 'bg-white/[0.03] rounded-2xl border border-white/[0.06] backdrop-blur-sm p-4';

  const content = (
    <>
      <div className={psg1 ? 'p-4 pb-20' : 'flex-1 flex flex-col p-4 pb-20'}>
        {/* Avatar & Name */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={`w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center border-4 ${
            psg1 ? 'bg-white/[0.06] border-emerald-400/50' : 'bg-game-secondary border-game-accent'
          }`}>
            <span className="text-3xl">👤</span>
          </div>
          <h1 className={psg1 ? 'text-balatro-lg font-pixel-heading text-white' : 'text-xl font-bold'}>{displayName}</h1>
          <p className={psg1 ? 'text-balatro-sm font-pixel-body text-gray-500 mt-1' : 'text-xs text-gray-500 mt-1'}>
            ID: {anonymousId?.slice(0, 8)}...
          </p>
          {!isProfileSynced && (
            <p className={psg1 ? 'text-balatro-sm font-pixel-body text-yellow-500 mt-1' : 'text-xs text-yellow-500 mt-1'}>
              Syncing profile...
            </p>
          )}
        </motion.div>

        {/* Main Stats */}
        <motion.div
          className={psg1 ? `${glassCard} mb-4` : 'card-pixel mb-4'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className={psg1 ? 'text-balatro-xl font-pixel-heading text-emerald-400' : 'text-3xl font-bold text-game-gold'}>{stats.totalPoints.toFixed(1)}</p>
              <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>Total Points</p>
            </div>
            <div className="text-center">
              <p className={psg1 ? 'text-balatro-xl font-pixel-heading text-white' : 'text-3xl font-bold'}>{stats.packsOpened}</p>
              <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>Packs Opened</p>
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
          <div className={psg1 ? `${glassCard} text-center` : 'card-pixel text-center'}>
            <p className={psg1 ? 'text-balatro-xl font-pixel-heading text-white' : 'text-2xl font-bold'}>{stats.accuracy}%</p>
            <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>Accuracy</p>
            <p className={psg1 ? 'text-balatro-sm font-pixel-body text-gray-600 mt-1' : 'text-xs text-gray-500 mt-1'}>
              {stats.correctPicks}/{stats.totalPicks} picks
            </p>
          </div>
          <div className={psg1 ? `${glassCard} text-center` : 'card-pixel text-center'}>
            <p className={psg1 ? 'text-balatro-xl font-pixel-heading text-white' : 'text-2xl font-bold'}>{stats.currentStreak}</p>
            <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>Current Streak</p>
            <p className={psg1 ? 'text-balatro-sm font-pixel-body text-gray-600 mt-1' : 'text-xs text-gray-500 mt-1'}>
              Best: {stats.longestStreak}
            </p>
          </div>
        </motion.div>

        {/* Best Performance */}
        <motion.div
          className={psg1 ? `${glassCard} mb-4` : 'card-pixel mb-4'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className={psg1 ? 'text-balatro-base font-pixel-heading text-white mb-3' : 'text-sm font-bold mb-3'}>Best Performance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>Best Weekly Rank</p>
              <p className={psg1 ? 'text-balatro-lg font-pixel-heading text-white' : 'text-lg font-bold'}>
                {typeof stats.bestRank === 'number' ? `#${stats.bestRank}` : stats.bestRank}
              </p>
            </div>
            <div className="text-right">
              <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>Current Week Rank</p>
              <p className={psg1 ? 'text-balatro-lg font-pixel-heading text-emerald-400' : 'text-lg font-bold text-game-gold'}>
                {weeklyRank ? `#${weeklyRank}` : '-'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className={psg1 ? glassCard : 'card-pixel'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className={psg1 ? 'text-balatro-base font-pixel-heading text-white mb-3' : 'text-sm font-bold mb-3'}>Recent Activity</h3>
          <div className="space-y-2">
            {stats.packsOpened > 0 ? (
              <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500 text-center py-2' : 'text-sm text-gray-400 text-center py-2'}>
                {stats.packsOpened} packs opened this week
              </p>
            ) : (
              <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500 text-center py-4' : 'text-sm text-gray-500 text-center py-4'}>
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
          <button className={psg1
            ? `w-full ${glassCard} text-balatro-base font-pixel-body text-gray-500`
            : 'w-full btn-pixel-secondary'
          } disabled>
            Create Account (Coming Soon)
          </button>
          <p className={psg1 ? 'text-balatro-sm font-pixel-body text-center text-gray-600' : 'text-xs text-center text-gray-500'}>
            Save your progress and compete on the leaderboard
          </p>
        </motion.div>

        {/* Dev: Reset Data */}
        <motion.div
          className={psg1 ? 'mt-8 pt-6 border-t border-white/[0.06]' : 'mt-8 pt-6 border-t border-card-border'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className={psg1 ? 'text-balatro-sm font-pixel-body text-gray-600 text-center mb-3' : 'text-xs text-gray-500 text-center mb-3'}>Developer Options</p>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className={psg1
                ? 'w-full py-2 px-4 text-balatro-base font-pixel-body text-red-400 rounded-2xl border border-red-500/30 hover:bg-red-500/10 transition-colors'
                : 'w-full py-2 px-4 text-sm text-game-error border border-game-error/30 rounded-lg hover:bg-game-error/10 transition-colors'
              }
            >
              Reset All Data
            </button>
          ) : (
            <div className="space-y-2">
              <p className={psg1
                ? 'text-balatro-sm font-pixel-body text-center text-red-400'
                : 'text-xs text-center text-game-error'
              }>
                This will delete all your local packs and progress!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className={psg1
                    ? 'flex-1 py-2 px-4 rounded-2xl border border-white/[0.06] text-balatro-base font-pixel-body hover:bg-white/[0.06] transition-colors'
                    : 'flex-1 py-2 px-4 text-sm border border-card-border rounded-lg hover:bg-card-border/20 transition-colors'
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  className={psg1
                    ? 'flex-1 py-2 px-4 bg-red-500 text-white rounded-2xl text-balatro-base font-pixel-body hover:bg-red-500/80 transition-colors'
                    : 'flex-1 py-2 px-4 text-sm bg-game-error text-white rounded-lg hover:bg-game-error/80 transition-colors'
                  }
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav />
    </>
  );

  return (
    <main className="relative flex-1 flex flex-col min-h-screen overflow-hidden">
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

      {psg1 ? (
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
          {content}
        </div>
      ) : (
        content
      )}

      {psg1 && <PSG1ScrollIndicator scrollPercent={scrollPercent} isScrollable={isScrollable} />}
    </main>
  );
}

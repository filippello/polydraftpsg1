'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSessionStore } from '@/stores';

interface LeaderboardEntry {
  rank: number;
  profileId: string;
  displayName: string;
  totalPoints: number;
  packsOpened: number;
  accuracy: number;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  entries: LeaderboardEntry[];
  totalPlayers: number;
  userRank?: number;
  userPoints?: number;
}

export default function LeaderboardPage() {
  const anonymousId = useSessionStore((state) => state.anonymousId);
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!anonymousId) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/leaderboard?limit=10&offset=0&anonymousId=${encodeURIComponent(anonymousId)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [anonymousId]);

  const myRank = data?.userRank ?? '-';
  const myPoints = data?.userPoints ?? 0;

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <Header />

      <div className="flex-1 flex flex-col p-4 pb-20">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Weekly Leaderboard</h1>
          <p className="text-sm text-gray-400">Top players this week</p>
        </div>

        {/* My Position Card */}
        <motion.div
          className="card-pixel mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Your Position</p>
              <p className="text-2xl font-bold">
                {typeof myRank === 'number' ? `#${myRank}` : myRank}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Points</p>
              <p className="text-2xl font-bold text-game-gold">{myPoints}</p>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-game-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading leaderboard...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-game-error mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-game-accent underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && data.entries.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-4xl mb-4">🏆</p>
              <p className="text-sm text-gray-400">No players yet this week.</p>
              <p className="text-sm text-gray-500 mt-1">
                Be the first to open a pack!
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {!isLoading && !error && data && data.entries.length > 0 && (
          <>
            <div className="flex-1 space-y-2">
              {data.entries.map((entry, index) => (
                <motion.div
                  key={entry.profileId}
                  className={`p-3 rounded border-2 ${
                    entry.rank <= 3
                      ? 'border-game-gold bg-game-gold/10'
                      : entry.isCurrentUser
                        ? 'border-game-accent bg-game-accent/10'
                        : 'border-card-border'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        entry.rank === 1
                          ? 'bg-yellow-500 text-black'
                          : entry.rank === 2
                            ? 'bg-gray-300 text-black'
                            : entry.rank === 3
                              ? 'bg-amber-600 text-white'
                              : 'bg-game-secondary text-white'
                      }`}
                    >
                      {entry.rank}
                    </div>

                    {/* User info */}
                    <div className="flex-1">
                      <p className="font-bold text-sm">
                        {entry.displayName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs text-game-accent">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.packsOpened} packs • {(entry.accuracy * 100).toFixed(0)}% accuracy
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className="font-bold text-game-gold">{entry.totalPoints.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">pts</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Total players info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Showing top {data.entries.length} of {data.totalPlayers.toLocaleString()} players
              </p>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

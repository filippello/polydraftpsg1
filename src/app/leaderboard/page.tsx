'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

// Mock leaderboard data
const MOCK_LEADERBOARD = [
  { rank: 1, username: 'CryptoKing', points: 892.5, packs: 12, accuracy: 0.72 },
  { rank: 2, username: 'SportsGuru', points: 756.3, packs: 10, accuracy: 0.68 },
  { rank: 3, username: 'LuckyPicker', points: 645.8, packs: 8, accuracy: 0.75 },
  { rank: 4, username: 'UnderdogFan', points: 589.2, packs: 11, accuracy: 0.54 },
  { rank: 5, username: 'StatsNerd', points: 534.1, packs: 9, accuracy: 0.66 },
  { rank: 6, username: 'BettingPro', points: 498.7, packs: 7, accuracy: 0.71 },
  { rank: 7, username: 'NightOwl', points: 456.3, packs: 8, accuracy: 0.63 },
  { rank: 8, username: 'FastPicker', points: 423.9, packs: 6, accuracy: 0.70 },
  { rank: 9, username: 'RiskTaker', points: 398.5, packs: 10, accuracy: 0.48 },
  { rank: 10, username: 'CalmPlayer', points: 367.2, packs: 5, accuracy: 0.80 },
];

export default function LeaderboardPage() {
  const myRank = 42;
  const myPoints = 125.5;

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
              <p className="text-2xl font-bold">#{myRank}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Points</p>
              <p className="text-2xl font-bold text-game-gold">{myPoints}</p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard */}
        <div className="flex-1 space-y-2">
          {MOCK_LEADERBOARD.map((entry, index) => (
            <motion.div
              key={entry.rank}
              className={`p-3 rounded border-2 ${
                entry.rank <= 3
                  ? 'border-game-gold bg-game-gold/10'
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
                  <p className="font-bold text-sm">{entry.username}</p>
                  <p className="text-xs text-gray-500">
                    {entry.packs} packs • {(entry.accuracy * 100).toFixed(0)}% accuracy
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="font-bold text-game-gold">{entry.points}</p>
                  <p className="text-xs text-gray-500">pts</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View all link */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing top 10 of 1,234 players
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

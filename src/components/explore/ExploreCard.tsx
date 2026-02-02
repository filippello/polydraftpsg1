'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ExploreMarket } from '@/lib/jupiter/types';
import { useExploreStore } from '@/stores/explore';

interface ExploreCardProps {
  market: ExploreMarket;
  index?: number;
}

function formatProbability(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(1)}K`;
  }
  return `$${volume}`;
}

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('sport') || lower.includes('nba') || lower.includes('nfl')) return '🏀';
  if (lower.includes('politic') || lower.includes('election')) return '🗳️';
  if (lower.includes('crypto') || lower.includes('bitcoin')) return '₿';
  if (lower.includes('econ') || lower.includes('finance')) return '📈';
  if (lower.includes('entertain') || lower.includes('oscar')) return '🎬';
  if (lower.includes('tech')) return '💻';
  if (lower.includes('weather') || lower.includes('climate')) return '🌡️';
  return '🎯';
}

export function ExploreCard({ market, index = 0 }: ExploreCardProps) {
  const pendingBets = useExploreStore((state) => state.pendingBets);

  // Check if user has any bets on this market
  const hasBets = pendingBets.some((b) => b.marketId === market.id);

  const isBinary = market.is_binary;
  const topOutcomes = market.outcomes.slice(0, 3);
  const hasMoreOutcomes = market.outcomes.length > 3;

  return (
    <Link href={`/explore/${market.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative group cursor-pointer"
      >
        <div className={`bg-card-bg border-balatro border-white/20 rounded-balatro-card p-4 h-full min-h-[180px] flex flex-col shadow-hard overflow-hidden ${hasBets ? 'ring-2 ring-yellow-500/30' : ''}`}>
          {/* Inner border */}
          <div className="balatro-card-inner" />

          {/* Completed medal */}
          {hasBets && (
            <motion.div
              className="absolute -top-1 -right-1 z-10"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300">
                <span className="text-sm">✓</span>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            {/* Category emoji */}
            <div className="w-12 h-12 rounded-lg bg-game-secondary/50 flex items-center justify-center text-2xl flex-shrink-0">
              {getCategoryEmoji(market.category)}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight line-clamp-2">
                {market.title}
              </h3>
              {market.volume > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Vol: {formatVolume(market.volume)}
                </p>
              )}
            </div>
          </div>

          {/* Outcomes */}
          <div className="flex-1 flex flex-col justify-end">
            {isBinary && market.outcomes.length === 2 ? (
              // Binary market - show Yes/No buttons inline
              <div className="flex gap-2">
                <button className="flex-1 bg-green-600/20 border border-green-500/40 rounded px-2 py-1.5 text-xs font-medium hover:bg-green-600/30 transition-colors">
                  <span className="text-green-400">Yes</span>
                  <span className="text-white ml-1">{formatProbability(market.outcomes[0].probability)}</span>
                </button>
                <button className="flex-1 bg-red-600/20 border border-red-500/40 rounded px-2 py-1.5 text-xs font-medium hover:bg-red-600/30 transition-colors">
                  <span className="text-red-400">No</span>
                  <span className="text-white ml-1">{formatProbability(market.outcomes[1].probability)}</span>
                </button>
              </div>
            ) : (
              // Multi-outcome - show top outcomes
              <div className="space-y-1.5">
                {topOutcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-300 truncate flex-1 mr-2">
                      {outcome.label}
                    </span>
                    <span className="text-white font-medium">
                      {formatProbability(outcome.probability)}
                    </span>
                  </div>
                ))}
                {hasMoreOutcomes && (
                  <p className="text-[10px] text-purple-400 font-medium">
                    +{market.outcomes.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Status indicator */}
          {market.status !== 'active' && (
            <div className="absolute top-2 right-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  market.status === 'resolved'
                    ? 'bg-gray-600/80 text-gray-300'
                    : 'bg-yellow-600/80 text-yellow-200'
                }`}
              >
                {market.status === 'resolved' ? 'Ended' : 'Closed'}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

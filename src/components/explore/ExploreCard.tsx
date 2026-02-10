'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { ExploreMarket } from '@/lib/jupiter/types';
import { useExploreStore } from '@/stores/explore';

interface ExploreCardProps {
  market: ExploreMarket;
  index?: number;
  focused?: boolean;
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
  if (lower.includes('business') || lower.includes('m&a')) return '🏢';
  return '🎯';
}

export function ExploreCard({ market, index = 0, focused = false }: ExploreCardProps) {
  const pendingBets = useExploreStore((state) => state.pendingBets);
  const [imageError, setImageError] = useState(false);
  const hasValidImage = market.image_url && !imageError;
  const hasBets = pendingBets.some((b) => b.marketId === market.id);

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
        {/* Badge for markets with bets */}
        {hasBets && (
          <div className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-300">
            <span className="text-sm">✓</span>
          </div>
        )}

        <div className={`bg-card-bg border-balatro border-white/20 rounded-balatro-card overflow-hidden shadow-hard ${hasBets ? 'ring-2 ring-yellow-500/30' : ''} ${focused ? 'psg1-focus scale-[1.03]' : ''}`}>
          {/* Image */}
          <div className="aspect-[4/3] w-full bg-game-secondary/50 flex items-center justify-center">
            {hasValidImage ? (
              <Image
                src={market.image_url!}
                alt={market.title}
                width={400}
                height={300}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-5xl">{getCategoryEmoji(market.category)}</span>
            )}
          </div>

          {/* Title */}
          <div className="p-3">
            <h3 className="font-bold text-sm leading-tight line-clamp-2">
              {market.title}
            </h3>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

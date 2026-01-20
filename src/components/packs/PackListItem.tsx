'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackSprite } from '@/components/sprites/PackSprite';
import { PickChip } from './PickChip';
import type { PackSummary } from '@/stores/myPacks';

interface PackListItemProps {
  pack: PackSummary;
  index: number;
}

function getStatusBadge(status: PackSummary['status']) {
  switch (status) {
    case 'drafting':
      return { label: 'Drafting', className: 'bg-gray-500/20 text-gray-400' };
    case 'waiting':
      return { label: 'Waiting', className: 'bg-card-border/50 text-gray-400' };
    case 'has_reveals':
      return { label: 'Ready!', className: 'bg-game-gold/20 text-game-gold' };
    case 'completed':
      return { label: 'Complete', className: 'bg-game-success/20 text-game-success' };
  }
}

export function PackListItem({ pack, index }: PackListItemProps) {
  const statusBadge = getStatusBadge(pack.status);
  const pendingReveals = pack.resolvedCount - pack.revealedCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/pack/${pack.id}`}>
        <div
          className={`bg-card-bg border rounded-lg p-4 hover:border-game-accent transition-colors ${
            pack.status === 'has_reveals'
              ? 'border-game-gold'
              : 'border-card-border'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Pack Icon */}
            <div className="flex-shrink-0">
              <PackSprite
                type={pack.packTypeSlug as 'sports'}
                size="sm"
                glowing={pack.status === 'has_reveals'}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm capitalize">
                  {pack.packTypeSlug} Pack
                </h3>
                <span className="text-game-gold font-bold text-sm">
                  {pack.totalPoints.toFixed(1)} pts
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-card-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-game-gold transition-all duration-300"
                    style={{
                      width: `${(pack.revealedCount / pack.totalPicks) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {pack.revealedCount}/{pack.totalPicks}
                </span>
              </div>

              {/* Pick chips */}
              <div className="flex flex-wrap gap-1 mb-2">
                {pack.pickPreviews.map((pick) => (
                  <PickChip key={pick.eventId} pick={pick} />
                ))}
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusBadge.className}`}
                >
                  {statusBadge.label}
                </span>

                {pendingReveals > 0 && (
                  <motion.span
                    className="text-[10px] text-game-gold font-bold"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {pendingReveals} ready to reveal
                  </motion.span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-gray-500 self-center">
              →
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

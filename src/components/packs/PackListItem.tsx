'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackSprite } from '@/components/sprites/PackSprite';
import { PickChip } from './PickChip';
import { isPSG1 } from '@/lib/platform';
import type { PackSummary } from '@/stores/myPacks';

interface PackListItemProps {
  pack: PackSummary;
  index: number;
  focused?: boolean;
}

function getStatusBadge(status: PackSummary['status'], psg1: boolean) {
  switch (status) {
    case 'drafting':
      return { label: 'Drafting', className: psg1 ? 'bg-white/[0.06] text-gray-500' : 'bg-gray-500/20 text-gray-400' };
    case 'waiting':
      return { label: 'Waiting', className: psg1 ? 'bg-white/[0.06] text-gray-500' : 'bg-card-border/50 text-gray-400' };
    case 'has_reveals':
      return { label: 'Ready!', className: psg1 ? 'bg-emerald-400/20 text-emerald-400' : 'bg-game-gold/20 text-game-gold' };
    case 'completed':
      return { label: 'Complete', className: psg1 ? 'bg-emerald-400/10 text-emerald-400/70' : 'bg-game-success/20 text-game-success' };
  }
}

export function PackListItem({ pack, index, focused }: PackListItemProps) {
  const psg1 = isPSG1();
  const statusBadge = getStatusBadge(pack.status, psg1);
  const pendingReveals = pack.resolvedCount - pack.revealedCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/pack/${pack.id}`}>
        <div
          className={psg1
            ? `bg-white/[0.03] rounded-2xl border backdrop-blur-sm p-4 hover:border-emerald-400/40 transition-colors ${
                pack.status === 'has_reveals'
                  ? 'border-emerald-400/50'
                  : 'border-white/[0.06]'
              } ${focused ? 'psg1-focus' : ''}`
            : `bg-card-bg border rounded-lg p-4 hover:border-game-accent transition-colors ${
                pack.status === 'has_reveals'
                  ? 'border-game-gold'
                  : 'border-card-border'
              } ${focused ? 'psg1-focus' : ''}`
          }
        >
          <div className="flex items-start gap-3">
            {/* Pack Icon */}
            <div className="flex-shrink-0">
              <PackSprite
                type={pack.packTypeSlug as 'sports'}
                size="sm"
                glowing={pack.status === 'has_reveals'}
                premium={pack.isPremium}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center justify-between mb-1">
                <h3 className={psg1 ? 'font-pixel-heading text-balatro-base capitalize text-white' : 'font-bold text-sm capitalize'}>
                  {pack.packTypeSlug} Pack
                </h3>
                <span className={psg1 ? 'text-emerald-400 font-pixel-heading text-balatro-base' : 'text-game-gold font-bold text-sm'}>
                  ${pack.totalPoints.toFixed(2)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${psg1 ? 'bg-white/[0.06]' : 'bg-card-border'}`}>
                  <div
                    className={`h-full transition-all duration-300 ${psg1 ? 'bg-emerald-400' : 'bg-game-gold'}`}
                    style={{
                      width: `${(pack.revealedCount / pack.totalPicks) * 100}%`,
                    }}
                  />
                </div>
                <span className={psg1 ? 'text-balatro-sm font-pixel-body text-gray-500' : 'text-xs text-gray-400'}>
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
                  className={psg1
                    ? `text-balatro-xs font-pixel-body px-2 py-0.5 rounded-full ${statusBadge.className}`
                    : `text-[10px] px-2 py-0.5 rounded-full font-bold ${statusBadge.className}`
                  }
                >
                  {statusBadge.label}
                </span>

                {pendingReveals > 0 && (
                  <motion.span
                    className={psg1
                      ? 'text-balatro-sm font-pixel-body text-emerald-400'
                      : 'text-[10px] text-game-gold font-bold'
                    }
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {pendingReveals} ready to reveal
                  </motion.span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className={`flex-shrink-0 self-center ${psg1 ? 'text-gray-600 font-pixel-body' : 'text-gray-500'}`}>
              →
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

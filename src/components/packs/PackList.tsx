'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackListItem } from './PackListItem';
import type { PackSummary } from '@/stores/myPacks';

interface PackListProps {
  packs: PackSummary[];
}

export function PackList({ packs }: PackListProps) {
  if (packs.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-12 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold mb-2">No Packs Yet</h2>
        <p className="text-gray-400 text-center mb-6">
          Open your first pack to start making picks!
        </p>
        <Link href="/pack/open/sports" className="btn-pixel-gold">
          Open Sports Pack
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {packs.map((pack, index) => (
        <PackListItem key={pack.id} pack={pack} index={index} />
      ))}
    </div>
  );
}

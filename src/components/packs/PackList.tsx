'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackListItem } from './PackListItem';
import type { PackSummary } from '@/stores/myPacks';

interface PackListProps {
  packs: PackSummary[];
  focusedIndex?: number;
}

export function PackList({ packs, focusedIndex }: PackListProps) {
  const focusedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll focused item into view
  useEffect(() => {
    if (focusedIndex !== undefined && focusedRef.current) {
      focusedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

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
        <div
          key={pack.id}
          ref={focusedIndex === index ? focusedRef : undefined}
        >
          <PackListItem pack={pack} index={index} focused={focusedIndex === index} />
        </div>
      ))}
    </div>
  );
}

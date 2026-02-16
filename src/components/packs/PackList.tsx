'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PackListItem } from './PackListItem';
import { isPSG1 } from '@/lib/platform';
import type { PackSummary } from '@/stores/myPacks';

interface PackListProps {
  packs: PackSummary[];
  focusedIndex?: number;
}

export function PackList({ packs, focusedIndex }: PackListProps) {
  const focusedRef = useRef<HTMLDivElement>(null);
  const psg1 = isPSG1();

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
        <h2 className={psg1 ? 'text-balatro-lg font-pixel-heading text-white mb-2' : 'text-xl font-bold mb-2'}>No Packs Yet</h2>
        <p className={psg1 ? 'text-balatro-base font-pixel-body text-gray-500 text-center mb-6' : 'text-gray-400 text-center mb-6'}>
          Open your first pack to start making picks!
        </p>
        <Link
          href="/pack/open/sports"
          className={psg1
            ? 'bg-emerald-400 text-black rounded-2xl font-pixel-heading text-balatro-base px-6 py-3'
            : 'btn-pixel-gold'
          }
        >
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

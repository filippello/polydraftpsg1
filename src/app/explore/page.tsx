'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExploreGrid } from '@/components/explore';
import { PSG1BackButton } from '@/components/layout/PSG1BackButton';
import { useExploreStore } from '@/stores/explore';

export default function ExplorePage() {
  const router = useRouter();
  const { reset } = useExploreStore();

  const handleBack = () => {
    reset();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-game-bg overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-game-bg/95 backdrop-blur-sm border-b border-white/10 safe-area-inset-top">
        <div className="flex items-center gap-3 p-4">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold font-pixel-heading"
          >
            EXPLORE
          </motion.h1>
          <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
            Jupiter
          </span>
          <div className="flex-1" />
          <PSG1BackButton onClick={handleBack} />
        </div>
      </div>

      {/* Grid */}
      <div className="pb-safe">
        <ExploreGrid onBack={handleBack} />
      </div>
    </main>
  );
}

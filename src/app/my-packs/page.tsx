'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PackList } from '@/components/packs';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';
import { usePackSummaries, useTotalPendingReveals } from '@/stores';

export default function MyPacksPage() {
  const router = useRouter();
  const packSummaries = usePackSummaries();
  const pendingReveals = useTotalPendingReveals();
  const psg1 = isPSG1();

  const handleNavSelect = useCallback((index: number) => {
    const pack = packSummaries[index];
    if (pack) router.push(`/pack/${pack.id}`);
  }, [packSummaries, router]);

  const handleNavBack = useCallback(() => {
    router.push('/game');
  }, [router]);

  const { focusedIndex } = usePSG1Navigation({
    enabled: psg1 && packSummaries.length > 0,
    itemCount: packSummaries.length,
    onSelect: handleNavSelect,
    onBack: handleNavBack,
  });

  return (
    <main className={`min-h-screen min-h-dvh bg-game-bg ${psg1 ? 'pb-16' : 'pb-24'}`}>
      {/* PSG1: Custom minimal header */}
      {psg1 ? (
        <div className="sticky top-0 z-20 bg-game-bg/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3 p-4">
            <button
              onClick={handleNavBack}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold font-pixel-heading"
            >
              MY PACKS
            </motion.h1>
            <div className="flex-1" />
            <span className="text-xs text-gray-400">
              {packSummaries.length} pack{packSummaries.length !== 1 ? 's' : ''}
            </span>
            {pendingReveals > 0 && (
              <span className="text-xs text-game-gold font-bold">
                {pendingReveals} ready
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <Header />

          {/* Page Header */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">My Packs</h1>
              {pendingReveals > 0 && (
                <span className="bg-game-gold/20 text-game-gold text-xs font-bold px-2 py-1 rounded-full">
                  {pendingReveals} ready
                </span>
              )}
            </div>
            {packSummaries.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                {packSummaries.length} pack{packSummaries.length !== 1 ? 's' : ''} total
              </p>
            )}
          </div>
        </>
      )}

      {/* Pack List */}
      <div className="px-4 py-2">
        <PackList packs={packSummaries} focusedIndex={psg1 ? focusedIndex : undefined} />
      </div>

      {/* PSG1: Button hints bar */}
      {psg1 ? (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-game-bg/95 border-t border-white/10 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>[A] Back</span>
            <span>[B] View Pack</span>
          </div>
        </div>
      ) : (
        <BottomNav />
      )}
    </main>
  );
}

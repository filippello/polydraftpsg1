'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PackList } from '@/components/packs';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';
import { usePSG1Scroll } from '@/hooks/usePSG1Scroll';
import { PSG1ScrollIndicator } from '@/components/layout/PSG1ScrollIndicator';
import { PSG1BackButton } from '@/components/layout/PSG1BackButton';
import { usePackSummaries, useTotalPendingReveals } from '@/stores';

export default function MyPacksPage() {
  const router = useRouter();
  const packSummaries = usePackSummaries();
  const pendingReveals = useTotalPendingReveals();
  const psg1 = isPSG1();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNavSelect = useCallback((index: number) => {
    const pack = packSummaries[index];
    if (pack) router.push(`/pack/${pack.id}`);
  }, [packSummaries, router]);

  const handleNavBack = useCallback(() => {
    router.push('/game');
  }, [router]);

  const { focusedIndex } = usePSG1Navigation({
    enabled: psg1,
    itemCount: packSummaries.length,
    onSelect: handleNavSelect,
    onBack: handleNavBack,
  });

  const { scrollPercent, isScrollable } = usePSG1Scroll(psg1, psg1 ? scrollRef : undefined);

  const content = (
    <>
      {/* PSG1: Custom minimal header */}
      {psg1 ? (
        <div className="sticky top-0 z-20 bg-game-bg/95 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-3 p-4">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold font-pixel-heading"
            >
              MY PACKS
            </motion.h1>
            <span className="text-balatro-sm font-pixel-body text-gray-500">
              {packSummaries.length} pack{packSummaries.length !== 1 ? 's' : ''}
            </span>
            {pendingReveals > 0 && (
              <span className="text-balatro-sm font-pixel-body text-emerald-400 font-bold">
                {pendingReveals} ready
              </span>
            )}
            <div className="flex-1" />
            <PSG1BackButton onClick={handleNavBack} />
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
          <div className="flex items-center justify-between text-balatro-sm font-pixel-body text-gray-500">
            <span>[A] Back</span>
            <span>[B] View Pack</span>
          </div>
        </div>
      ) : (
        <BottomNav />
      )}
    </>
  );

  return (
    <main className={`relative min-h-screen min-h-dvh bg-game-bg overflow-hidden ${psg1 ? 'pb-16' : 'pb-24'}`}>
      {psg1 ? (
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide h-screen">
          {content}
        </div>
      ) : (
        content
      )}

      {psg1 && <PSG1ScrollIndicator scrollPercent={scrollPercent} isScrollable={isScrollable} />}
    </main>
  );
}

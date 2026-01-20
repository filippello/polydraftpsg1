'use client';

import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { PackList } from '@/components/packs';
import { usePackSummaries, useTotalPendingReveals } from '@/stores';

export default function MyPacksPage() {
  const packSummaries = usePackSummaries();
  const pendingReveals = useTotalPendingReveals();

  return (
    <main className="min-h-screen min-h-dvh bg-game-bg pb-24">
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

      {/* Pack List */}
      <div className="px-4 py-2">
        <PackList packs={packSummaries} />
      </div>

      <BottomNav />
    </main>
  );
}

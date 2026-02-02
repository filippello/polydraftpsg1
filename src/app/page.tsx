'use client';

import { ModeSelector } from '@/components/explore';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col min-h-screen bg-game-bg balatro-noise balatro-vignette">
      <div className="flex-1 flex items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
        <ModeSelector />
      </div>
    </main>
  );
}

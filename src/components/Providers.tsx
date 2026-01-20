'use client';

import { useEffect, type ReactNode } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { useSessionStore } from '@/stores/session';

interface ProvidersProps {
  children: ReactNode;
}

function SessionInitializer({ children }: { children: ReactNode }) {
  const initialize = useSessionStore((state) => state.initialize);
  const isInitialized = useSessionStore((state) => state.isInitialized);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show nothing while initializing to prevent hydration mismatch
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-game-bg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-game-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <JotaiProvider>
      <SessionInitializer>{children}</SessionInitializer>
    </JotaiProvider>
  );
}

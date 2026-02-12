'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { useSessionStore } from '@/stores/session';
import { useWalletAuthStore } from '@/stores/walletAuth';
import { SolanaWalletProvider } from '@/providers/WalletProvider';
import { WalletGate } from '@/components/auth/WalletGate';
import { isPSG1 } from '@/lib/platform';

interface ProvidersProps {
  children: ReactNode;
}

function SessionInitializer({ children }: { children: ReactNode }) {
  const initialize = useSessionStore((state) => state.initialize);
  const isInitialized = useSessionStore((state) => state.isInitialized);
  const anonymousId = useSessionStore((state) => state.anonymousId);
  const isProfileSynced = useSessionStore((state) => state.isProfileSynced);
  const setProfile = useSessionStore((state) => state.setProfile);
  const setProfileId = useSessionStore((state) => state.setProfileId);
  const setProfileSynced = useSessionStore((state) => state.setProfileSynced);

  // On PSG1, read wallet-linked profileId
  const walletProfileId = useWalletAuthStore((state) => state.profileId);

  // Initialize the local session (anonymousId generation)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync profile to database after session is initialized
  const initializeProfile = useCallback(async () => {
    // PSG1: use wallet-linked profile, skip anonymous sync
    if (isPSG1()) {
      if (walletProfileId && !isProfileSynced) {
        setProfileId(walletProfileId);
        setProfileSynced(true);
      }
      return;
    }

    // Web: anonymous profile sync
    if (!anonymousId || isProfileSynced) return;

    try {
      const response = await fetch(`/api/profile?anonymousId=${encodeURIComponent(anonymousId)}`);

      if (!response.ok) {
        console.error('Failed to initialize profile:', response.statusText);
        // Still mark as synced to avoid infinite retries
        setProfileSynced(true);
        return;
      }

      const data = await response.json();

      if (data.profileId && data.profile) {
        setProfileId(data.profileId);
        setProfile(data.profile);
      }

      setProfileSynced(true);
    } catch (error) {
      console.error('Error initializing profile:', error);
      // Still mark as synced to avoid infinite retries
      // The app will work in local-first mode
      setProfileSynced(true);
    }
  }, [anonymousId, isProfileSynced, walletProfileId, setProfile, setProfileId, setProfileSynced]);

  // Initialize profile when ready
  useEffect(() => {
    if (!isInitialized) return;

    if (isPSG1()) {
      // On PSG1, sync when wallet profile is available
      if (walletProfileId && !isProfileSynced) {
        initializeProfile();
      }
    } else {
      // On web, sync when anonymousId is available
      if (anonymousId && !isProfileSynced) {
        initializeProfile();
      }
    }
  }, [isInitialized, anonymousId, walletProfileId, isProfileSynced, initializeProfile]);

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
      <SolanaWalletProvider>
        <WalletGate>
          <SessionInitializer>{children}</SessionInitializer>
        </WalletGate>
      </SolanaWalletProvider>
    </JotaiProvider>
  );
}

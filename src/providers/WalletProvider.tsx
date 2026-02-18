'use client';

import { useMemo, useEffect, type ReactNode } from 'react';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const endpoint = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    return 'https://api.mainnet-beta.solana.com';
  }, []);

  // Fix MWA 404 on Android: Jupiter Mobile returns wallet_uri_base "https://jup.ag"
  // after authorize(). MWA caches this and uses it for the next transact() call
  // (e.g. signMessage), building https://jup.ag/v1/associate/local?... which 404s.
  // We intercept localStorage.setItem to strip wallet_uri_base from ALL cache writes,
  // forcing MWA to always use solana-wallet:// intent protocol.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!/android/i.test(navigator.userAgent)) return;

    const cacheKey = 'SolanaMobileWalletAdapterDefaultAuthorizationCache';

    // Save original before patching
    const originalSetItem = Storage.prototype.setItem;

    // Clear any existing cached wallet_uri_base
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.wallet_uri_base) {
          delete parsed.wallet_uri_base;
          originalSetItem.call(localStorage, cacheKey, JSON.stringify(parsed));
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    // Intercept future writes to strip wallet_uri_base before it gets persisted
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === cacheKey) {
        try {
          const parsed = JSON.parse(value);
          if (parsed?.wallet_uri_base) {
            delete parsed.wallet_uri_base;
            value = JSON.stringify(parsed);
          }
        } catch {
          // pass through
        }
      }
      originalSetItem.call(this, key, value);
    };

    return () => {
      Storage.prototype.setItem = originalSetItem;
    };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: 'mainnet-beta',
          metadata: {
            name: 'Polydraft',
            description: 'Prediction Markets on Jupiter',
            url: 'https://polydraftpsg1.vercel.app/',
            iconUrls: ['https://polydraftpsg1.vercel.app/icon.png'],
          },
          theme: 'jupiter',
          lang: 'en',
        }}
      >
        {children}
      </UnifiedWalletProvider>
    </ConnectionProvider>
  );
}

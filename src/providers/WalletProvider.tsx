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

  // Fix MWA 404 on Android: Jupiter Mobile caches wallet_uri_base as "https://jup.ag"
  // which causes subsequent connections to navigate to https://jup.ag/v1/associate/local?...
  // instead of using the solana-wallet:// intent protocol. Stripping wallet_uri_base
  // forces MWA to always use solana-wallet:// which properly launches the Android intent.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!/android/i.test(navigator.userAgent)) return;

    const cacheKey = 'SolanaMobileWalletAdapterDefaultAuthorizationCache';
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached);
      if (parsed?.wallet_uri_base) {
        delete parsed.wallet_uri_base;
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
      }
    } catch {
      localStorage.removeItem(cacheKey);
    }
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

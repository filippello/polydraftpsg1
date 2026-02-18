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

  // Fix MWA 404 on Android: After authorize(), Jupiter Mobile returns
  // wallet_uri_base "https://jup.ag/solana-wallet-adapter" which is stored
  // in-memory on the wallet object. When signMessage() triggers a new transact(),
  // it reads wallet_uri_base from memory and calls:
  //   window.location.assign("https://jup.ag/solana-wallet-adapter/v1/associate/local?...")
  // This navigates to jup.ag which returns 404.
  //
  // Fix: Intercept Location.prototype.assign and rewrite any HTTPS MWA association
  // URLs to use the solana-wallet:// intent protocol instead.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!/android/i.test(navigator.userAgent)) return;

    const originalAssign = Location.prototype.assign;
    Location.prototype.assign = function (url: string | URL) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      // Detect MWA association URLs that use HTTPS instead of solana-wallet://
      if (urlStr.includes('/v1/associate/local')) {
        try {
          const parsed = new URL(urlStr);
          if (parsed.protocol === 'https:') {
            // Rewrite to solana-wallet:// so Android fires the intent
            const rewritten = new URL('solana-wallet:/v1/associate/local');
            rewritten.search = parsed.search;
            return originalAssign.call(this, rewritten.toString());
          }
        } catch {
          // fall through to original
        }
      }
      return originalAssign.call(this, url);
    };

    return () => {
      Location.prototype.assign = originalAssign;
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

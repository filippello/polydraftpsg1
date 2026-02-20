'use client';

import { useMemo, useEffect, type ReactNode } from 'react';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const paymentMethod = process.env.NEXT_PUBLIC_PAYMENT_METHOD || 'program';

  const endpoint = useMemo(() => {
    // Transfer mode always uses mainnet
    if (paymentMethod === 'transfer') {
      return process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';
    }
    if (process.env.NEXT_PUBLIC_SOLANA_RPC_URL) {
      return process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    }
    return process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';
  }, [paymentMethod]);

  // Fix MWA 404 on Android: After authorize(), Jupiter Mobile returns
  // wallet_uri_base "https://jup.ag/solana-wallet-adapter" stored in-memory.
  // When signMessage() triggers a new transact(), MWA calls:
  //   window.location.assign("https://jup.ag/solana-wallet-adapter/v1/associate/local?...")
  // This navigates to jup.ag → 404.
  //
  // Fix: Use the Navigation API (Chrome 102+) to intercept the navigation
  // and rewrite it to solana-wallet:// intent protocol. Also patch
  // Location.prototype.assign as a fallback.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!/android/i.test(navigator.userAgent)) return;

    function rewriteMwaUrl(urlStr: string): string | null {
      if (!urlStr.includes('/v1/associate/local')) return null;
      try {
        const parsed = new URL(urlStr);
        if (parsed.protocol === 'https:') {
          const rewritten = new URL('solana-wallet:/v1/associate/local');
          rewritten.search = parsed.search;
          return rewritten.toString();
        }
      } catch {
        // not a valid URL
      }
      return null;
    }

    // Strategy 1: Navigation API (Chrome 102+) - intercepts programmatic navigations
    let navController: AbortController | undefined;
    if ('navigation' in window) {
      navController = new AbortController();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).navigation.addEventListener('navigate', (event: any) => {
        const rewritten = rewriteMwaUrl(event.destination.url);
        if (rewritten) {
          event.preventDefault();
          // Use location.href for custom protocol (intent)
          window.location.href = rewritten;
        }
      }, { signal: navController.signal });
    }

    // Strategy 2: Patch Location.prototype.assign as fallback
    const originalAssign = Location.prototype.assign;
    try {
      Location.prototype.assign = function (url: string | URL) {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const rewritten = rewriteMwaUrl(urlStr);
        if (rewritten) {
          window.location.href = rewritten;
          return;
        }
        return originalAssign.call(this, url);
      };
    } catch {
      // Some browsers may not allow patching Location.prototype
    }

    return () => {
      navController?.abort();
      try { Location.prototype.assign = originalAssign; } catch { /* noop */ }
    };
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <UnifiedWalletProvider
        wallets={[]}
        config={{
          autoConnect: true,
          env: (paymentMethod === 'transfer' ? 'mainnet-beta' : process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.includes('devnet') ? 'devnet' : 'mainnet-beta') as 'mainnet-beta' | 'devnet',
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

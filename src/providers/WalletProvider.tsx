'use client';

import { useMemo, type ReactNode } from 'react';
import { ConnectionProvider } from '@solana/wallet-adapter-react';
import { UnifiedWalletProvider, type Adapter } from '@jup-ag/wallet-adapter';
import { useWrappedReownAdapter } from '@jup-ag/jup-mobile-adapter';

interface SolanaWalletProviderProps {
  children: ReactNode;
}

export function SolanaWalletProvider({ children }: SolanaWalletProviderProps) {
  const endpoint = useMemo(() => {
    return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  }, []);

  const { jupiterAdapter } = useWrappedReownAdapter({
    appKitOptions: {
      metadata: {
        name: 'Polydraft',
        description: 'Fantasy betting with pixel art packs',
        url: 'https://polydraftpsg1.vercel.app/',
        icons: ['https://polydraftpsg1.vercel.app/icons/icon-192x192.png'],
      },
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '01b9a854692b1f29a6aa2bb46f8c0520',
      features: {
        analytics: false,
        socials: false,
        email: false,
      },
      enableWallets: false,
    },
  });

  const wallets: Adapter[] = useMemo(() => {
    return [jupiterAdapter].filter((item) => item && item.name && item.icon) as Adapter[];
  }, [jupiterAdapter]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <UnifiedWalletProvider
        wallets={wallets}
        config={{
          autoConnect: true,
          env: 'mainnet-beta',
          metadata: {
            name: 'Polydraft',
            description: 'Prediction Markets on Jupiter',
            url: 'https://polydraftpsg1.vercel.app/',
            iconUrls: ['https://polydraftpsg1.vercel.app/icons/icon-192x192.png'],
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

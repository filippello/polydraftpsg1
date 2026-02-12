'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { isPSG1 } from '@/lib/platform';
import { useWalletAuthStore } from '@/stores/walletAuth';
import { WalletButton } from '@/components/WalletButton';

const AUTH_MESSAGE_PREFIX = 'Sign this message to authenticate with Polydraft.\n\nNonce: ';

interface WalletGateProps {
  children: ReactNode;
}

function WalletAuthFlow({ children }: { children: ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const status = useWalletAuthStore((s) => s.status);
  const error = useWalletAuthStore((s) => s.error);
  const isTokenValid = useWalletAuthStore((s) => s.isTokenValid);
  const setStatus = useWalletAuthStore((s) => s.setStatus);
  const setAuthenticated = useWalletAuthStore((s) => s.setAuthenticated);

  const authenticate = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    const address = publicKey.toBase58();

    try {
      // 1. Fetch nonce
      setStatus('signing');
      const nonceRes = await fetch(`/api/auth/nonce?address=${encodeURIComponent(address)}`);
      if (!nonceRes.ok) {
        const data = await nonceRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get nonce');
      }
      const { nonce } = await nonceRes.json();

      // 2. Sign message
      const message = new TextEncoder().encode(`${AUTH_MESSAGE_PREFIX}${nonce}`);
      const signatureBytes = await signMessage(message);
      const signature = bs58.encode(signatureBytes);

      // 3. Verify
      setStatus('verifying');
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, nonce }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.error || 'Verification failed');
      }

      const { token, profileId } = await verifyRes.json();
      setAuthenticated(token, address, profileId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setStatus('error', message);
    }
  }, [publicKey, signMessage, setStatus, setAuthenticated]);

  // Check persisted token on mount
  useEffect(() => {
    if (isTokenValid()) {
      setStatus('authenticated');
    }
  }, [isTokenValid, setStatus]);

  // Auto-trigger auth when wallet connects
  useEffect(() => {
    if (connected && publicKey && signMessage && status === 'idle') {
      if (!isTokenValid()) {
        setStatus('connecting');
        authenticate();
      }
    }
  }, [connected, publicKey, signMessage, status, isTokenValid, setStatus, authenticate]);

  // Authenticated — render app
  if (status === 'authenticated' && isTokenValid()) {
    return <>{children}</>;
  }

  // Gate UI
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-game-bg text-foreground p-8">
      <div className="text-center max-w-md">
        <h1 className="font-pixel-heading text-xl mb-2">Polydraft</h1>
        <p className="font-pixel-body text-lg text-gray-400 mb-8">
          Connect your wallet to play
        </p>

        {status === 'error' && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error || 'Something went wrong'}
          </div>
        )}

        {(status === 'signing' || status === 'verifying' || status === 'connecting') ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-game-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">
              {status === 'signing' && 'Sign the message in your wallet...'}
              {status === 'verifying' && 'Verifying signature...'}
              {status === 'connecting' && 'Connecting...'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <WalletButton />
            {status === 'error' && (
              <button
                onClick={() => {
                  setStatus('idle');
                  authenticate();
                }}
                className="text-sm text-game-accent hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function WalletGate({ children }: WalletGateProps) {
  // On web, pass through — no gate
  if (!isPSG1()) {
    return <>{children}</>;
  }

  return <WalletAuthFlow>{children}</WalletAuthFlow>;
}

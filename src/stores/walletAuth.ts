import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthStatus =
  | 'idle'
  | 'connecting'
  | 'signing'
  | 'verifying'
  | 'authenticated'
  | 'error';

interface WalletAuthState {
  jwt: string | null;
  walletAddress: string | null;
  profileId: string | null;
  status: AuthStatus;
  error: string | null;

  isTokenValid: () => boolean;
  setStatus: (status: AuthStatus, error?: string) => void;
  setAuthenticated: (jwt: string, walletAddress: string, profileId: string) => void;
  logout: () => void;
}

function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export const useWalletAuthStore = create<WalletAuthState>()(
  persist(
    (set, get) => ({
      jwt: null,
      walletAddress: null,
      profileId: null,
      status: 'idle',
      error: null,

      isTokenValid: () => {
        const { jwt } = get();
        if (!jwt) return false;
        const exp = parseJwtExp(jwt);
        if (!exp) return false;
        // Valid if expiry is more than 60s from now
        return exp > Math.floor(Date.now() / 1000) + 60;
      },

      setStatus: (status, error) => {
        set({ status, error: error ?? null });
      },

      setAuthenticated: (jwt, walletAddress, profileId) => {
        set({
          jwt,
          walletAddress,
          profileId,
          status: 'authenticated',
          error: null,
        });
      },

      logout: () => {
        set({
          jwt: null,
          walletAddress: null,
          profileId: null,
          status: 'idle',
          error: null,
        });
      },
    }),
    {
      name: 'polydraft-wallet-auth',
      partialize: (state) => ({
        jwt: state.jwt,
        walletAddress: state.walletAddress,
        profileId: state.profileId,
      }),
    }
  )
);

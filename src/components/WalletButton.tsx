'use client';

import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';

// Wrapper component to handle Jupiter wallet adapter type issues
export function WalletButton() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Button = UnifiedWalletButton as any;
  return <Button />;
}

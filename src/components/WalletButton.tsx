'use client';

import { UnifiedWalletButton, useUnifiedWalletContext } from '@jup-ag/wallet-adapter';
import { isPSG1 } from '@/lib/platform';

// On PSG1 (Android), skip MWA auto-detect and force the wallet modal open
// so the user can pick Jupiter Mobile via WalletConnect
function PSG1WalletButton() {
  const { setShowModal } = useUnifiedWalletContext();

  return (
    <button
      onClick={() => setShowModal(true)}
      className="rounded-lg text-xs py-3 px-5 font-semibold cursor-pointer text-center bg-black text-white"
    >
      Connect Wallet
    </button>
  );
}

// Wrapper component to handle Jupiter wallet adapter type issues
export function WalletButton() {
  if (isPSG1()) {
    return <PSG1WalletButton />;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Button = UnifiedWalletButton as any;
  return <Button />;
}

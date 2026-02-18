'use client';

import { UnifiedWalletButton } from '@jup-ag/wallet-adapter';
import { isPSG1 } from '@/lib/platform';

function PSG1WalletButton() {
  const handleConnect = () => {
    // Android intent to open current URL in Jupiter Mobile's dApp browser
    window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=ag.jup.jupiter.android;end`;
  };

  return (
    <button
      onClick={handleConnect}
      className="rounded-lg text-xs py-3 px-5 font-semibold cursor-pointer text-center bg-black text-white"
    >
      Connect with Jupiter
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

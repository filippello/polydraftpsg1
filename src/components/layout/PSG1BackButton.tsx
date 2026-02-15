'use client';

interface PSG1BackButtonProps {
  onClick: () => void;
}

/**
 * Pixel-art back button for PSG1 headers.
 * Shows ← arrow + square "A" gamepad key. Positioned by parent (top-right).
 */
export function PSG1BackButton({ onClick }: PSG1BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors"
    >
      <span className="text-xs text-gray-400">←</span>
      <span className="inline-flex items-center justify-center w-5 h-5 bg-white/10 border border-white/[0.15] rounded font-pixel-body text-[9px] font-bold text-gray-300">
        A
      </span>
    </button>
  );
}

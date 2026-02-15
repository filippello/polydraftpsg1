'use client';

interface PSG1BackButtonProps {
  onClick: () => void;
}

/**
 * Pixel-art back button for PSG1 headers.
 * Shows rounded "A" gamepad key + bold "BACK" label.
 */
export function PSG1BackButton({ onClick }: PSG1BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.1] rounded-full hover:bg-white/[0.1] transition-colors"
    >
      <span className="inline-flex items-center justify-center w-6 h-6 bg-white/[0.12] border border-white/[0.18] rounded-full font-pixel-heading text-[11px] text-gray-200">
        A
      </span>
      <span className="font-pixel-heading text-[11px] font-bold text-gray-200 tracking-wide">
        BACK
      </span>
    </button>
  );
}

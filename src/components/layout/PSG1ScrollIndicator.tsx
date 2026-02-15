'use client';

interface PSG1ScrollIndicatorProps {
  scrollPercent: number;
  isScrollable: boolean;
}

export function PSG1ScrollIndicator({ scrollPercent, isScrollable }: PSG1ScrollIndicatorProps) {
  if (!isScrollable) return null;

  // Clamp thumb position so it doesn't overflow the track
  const thumbPercent = Math.min(scrollPercent, 100);

  return (
    <div className="absolute right-2 top-16 bottom-16 w-2 z-40 pointer-events-none flex flex-col items-center">
      <span className="font-pixel-body text-balatro-xs text-emerald-400/50 mb-1">▲</span>
      <div className="flex-1 w-full bg-white/10 rounded-full relative">
        <div
          className="absolute w-full h-10 bg-emerald-400/70 rounded-full transition-[top] duration-150"
          style={{ top: `calc(${thumbPercent}% - ${thumbPercent * 0.4}px)` }}
        />
      </div>
      <span className="font-pixel-body text-balatro-xs text-emerald-400/50 mt-1">▼</span>
    </div>
  );
}

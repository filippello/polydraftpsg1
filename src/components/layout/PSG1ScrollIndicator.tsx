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
    <div className="fixed right-1 top-16 bottom-16 w-1.5 z-40 pointer-events-none">
      <div className="h-full bg-white/10 rounded-full relative">
        <div
          className="absolute w-full h-8 bg-game-accent/60 rounded-full transition-[top] duration-150"
          style={{ top: `calc(${thumbPercent}% - ${thumbPercent * 0.32}px)` }}
        />
      </div>
    </div>
  );
}

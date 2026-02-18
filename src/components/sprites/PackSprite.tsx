'use client';

import Image from 'next/image';

interface PackSpriteProps {
  type: 'sports' | 'economy' | 'politics' | 'crypto' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowing?: boolean;
  className?: string;
}

const sizeDimensions = {
  sm: { w: 80, h: 100, classes: 'w-20 h-[100px]' },
  md: { w: 112, h: 140, classes: 'w-28 h-[140px]' },
  lg: { w: 144, h: 180, classes: 'w-36 h-[180px]' },
  xl: { w: 256, h: 320, classes: 'w-64 h-[320px]' },
};

export function PackSprite({ size = 'md', glowing = false, className = '' }: PackSpriteProps) {
  const dim = sizeDimensions[size];

  return (
    <div
      className={`
        relative ${dim.classes} ${className}
        ${glowing ? 'pack-glow' : ''}
      `}
    >
      <Image
        src="/images/packs/sportpack_1.png"
        alt="Booster Pack"
        width={dim.w}
        height={dim.h}
        className="w-full h-full object-contain drop-shadow-[0_4px_0_rgba(0,0,0,0.3)]"
        draggable={false}
      />
    </div>
  );
}

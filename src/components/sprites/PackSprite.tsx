'use client';

import { motion } from 'framer-motion';

interface PackSpriteProps {
  type: 'sports' | 'economy' | 'politics' | 'crypto' | 'default';
  size?: 'sm' | 'md' | 'lg';
  glowing?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-20 h-28',
  md: 'w-28 h-40',
  lg: 'w-36 h-52',
};

const typeColors = {
  sports: {
    primary: '#16213e',
    accent: '#e94560',
    icon: '⚽',
    gradient: 'from-blue-900 via-blue-800 to-blue-900',
  },
  economy: {
    primary: '#1a4731',
    accent: '#22c55e',
    icon: '📈',
    gradient: 'from-green-900 via-green-800 to-green-900',
  },
  politics: {
    primary: '#3f1d4e',
    accent: '#a855f7',
    icon: '🗳️',
    gradient: 'from-purple-900 via-purple-800 to-purple-900',
  },
  crypto: {
    primary: '#4a3f00',
    accent: '#fbbf24',
    icon: '₿',
    gradient: 'from-yellow-900 via-yellow-800 to-yellow-900',
  },
  default: {
    primary: '#16213e',
    accent: '#e94560',
    icon: '🎴',
    gradient: 'from-slate-900 via-slate-800 to-slate-900',
  },
};

export function PackSprite({ type, size = 'md', glowing = false, className = '' }: PackSpriteProps) {
  const config = typeColors[type] || typeColors.default;
  const sizeClass = sizeClasses[size];

  return (
    <motion.div
      className={`
        relative ${sizeClass} ${className}
        rounded-lg overflow-hidden
        border-4 border-white/20
        shadow-pixel-lg
        ${glowing ? 'glow-gold' : ''}
      `}
      style={{
        background: `linear-gradient(135deg, ${config.primary} 0%, ${config.primary}dd 50%, ${config.primary} 100%)`,
      }}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            )`,
          }}
        />
      </div>

      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: config.accent }}
      />

      {/* Pack content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
        {/* Icon */}
        <div
          className="text-4xl mb-2"
          style={{
            filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.5))',
          }}
        >
          {config.icon}
        </div>

        {/* Pack type label */}
        <div
          className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: config.accent,
            color: '#fff',
          }}
        >
          {type}
        </div>

        {/* Card count */}
        <div className="mt-2 text-white/60 text-xs">
          5 cards
        </div>
      </div>

      {/* Bottom decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />

      {/* Corner decorations */}
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: config.accent }}
      />
      <div
        className="absolute bottom-2 left-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: config.accent }}
      />

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
}

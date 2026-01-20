'use client';

import { motion } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';

interface CoinBurstProps {
  count?: number;
  emojis?: string[];
  origin?: { x: number; y: number };
  radius?: number;
  duration?: number;
  delay?: number;
  onComplete?: () => void;
  active?: boolean;
}

const DEFAULT_EMOJIS = ['💰', '🪙', '✨', '⭐', '💎'];

export function CoinBurst({
  count = 12,
  emojis = DEFAULT_EMOJIS,
  origin = { x: 50, y: 50 },
  radius = 150,
  duration = 1.5,
  delay = 0,
  onComplete,
  active = true,
}: CoinBurstProps) {
  const [hasCompleted, setHasCompleted] = useState(false);

  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const randomRadius = radius * (0.6 + Math.random() * 0.4);
      const targetX = Math.cos(angle) * randomRadius;
      const targetY = Math.sin(angle) * randomRadius;
      const emoji = emojis[i % emojis.length];
      const particleDelay = delay + Math.random() * 0.15;
      const scale = 0.8 + Math.random() * 0.6;

      return {
        id: i,
        emoji,
        targetX,
        targetY,
        particleDelay,
        scale,
      };
    });
  }, [count, emojis, radius, delay]);

  useEffect(() => {
    if (!active || hasCompleted) return;

    const timer = setTimeout(() => {
      setHasCompleted(true);
      onComplete?.();
    }, (delay + duration) * 1000 + 200);

    return () => clearTimeout(timer);
  }, [active, delay, duration, onComplete, hasCompleted]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute"
        style={{
          left: `${origin.x}%`,
          top: `${origin.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute text-2xl"
            style={{
              left: 0,
              top: 0,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              x: particle.targetX,
              y: particle.targetY,
              scale: [0, particle.scale, particle.scale * 0.5],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: duration,
              delay: particle.particleDelay,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.3, 1],
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Golden coins burst
export function GoldCoinBurst(props: Partial<CoinBurstProps>) {
  return (
    <CoinBurst
      count={16}
      emojis={['💰', '🪙', '💰', '🪙', '✨']}
      radius={180}
      {...props}
    />
  );
}

// Mini burst for point counting
export function MiniCoinBurst(props: Partial<CoinBurstProps>) {
  return (
    <CoinBurst
      count={6}
      emojis={['✨', '⭐', '💫']}
      radius={60}
      duration={0.8}
      {...props}
    />
  );
}

// Trophy celebration burst
export function TrophyBurst(props: Partial<CoinBurstProps>) {
  return (
    <CoinBurst
      count={8}
      emojis={['🏆', '🎉', '🌟', '💎']}
      radius={120}
      {...props}
    />
  );
}

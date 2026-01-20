'use client';

import { motion } from 'framer-motion';
import { useMemo, useState, useEffect } from 'react';

interface ConfettiProps {
  count?: number;
  colors?: string[];
  shapes?: ('circle' | 'square' | 'rectangle')[];
  duration?: number;
  spread?: number;
  delay?: number;
  active?: boolean;
}

const DEFAULT_COLORS = [
  '#ffd700', // gold
  '#ff6b6b', // red
  '#4ecdc4', // teal
  '#45b7d1', // blue
  '#f7dc6f', // yellow
  '#a855f7', // purple
  '#22c55e', // green
];

export function Confetti({
  count = 30,
  colors = DEFAULT_COLORS,
  shapes = ['circle', 'square', 'rectangle'],
  duration = 3,
  spread = 400,
  delay = 0,
  active = true,
}: ConfettiProps) {
  const [windowHeight, setWindowHeight] = useState(800);

  useEffect(() => {
    setWindowHeight(window.innerHeight);
  }, []);

  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => {
      const color = colors[i % colors.length];
      const shape = shapes[i % shapes.length];
      const startX = Math.random() * 100;
      const horizontalDrift = (Math.random() - 0.5) * spread;
      const particleDelay = delay + Math.random() * 0.5;
      const particleDuration = duration + Math.random() * 1.5;
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const size = shape === 'rectangle' ? { w: 4, h: 12 } : { w: 8 + Math.random() * 6, h: 8 + Math.random() * 6 };

      return {
        id: i,
        color,
        shape,
        startX,
        horizontalDrift,
        particleDelay,
        particleDuration,
        rotationDirection,
        size,
      };
    });
  }, [count, colors, shapes, spread, delay, duration]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={particle.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}
          style={{
            position: 'absolute',
            backgroundColor: particle.color,
            width: particle.size.w,
            height: particle.size.h,
            left: `${particle.startX}%`,
            top: -20,
          }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            y: [0, windowHeight + 100],
            x: [0, particle.horizontalDrift],
            rotate: [0, 360 * 3 * particle.rotationDirection],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: particle.particleDuration,
            delay: particle.particleDelay,
            ease: [0.25, 0.46, 0.45, 0.94],
            times: [0, 0.1, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
}

// Pre-configured variants for convenience
export function GoldConfetti({ count = 50, ...props }: Partial<ConfettiProps>) {
  return (
    <Confetti
      count={count}
      colors={['#ffd700', '#ffed4a', '#f7dc6f', '#ffc107', '#ffb300']}
      {...props}
    />
  );
}

export function VictoryConfetti({ count = 100, ...props }: Partial<ConfettiProps>) {
  return <Confetti count={count} duration={4} spread={500} {...props} />;
}

import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface CoinBurstProps {
  emojis?: string[];
  count?: number;
  radius?: number;
  startFrame?: number;
  duration?: number;
  originX?: number;
  originY?: number;
}

export const CoinBurst: React.FC<CoinBurstProps> = ({
  emojis = ["💰", "🪙", "✨", "⭐", "💎"],
  count = 12,
  radius = 150,
  startFrame = 0,
  duration = 45, // 1.5 seconds at 30fps
  originX = 50,
  originY = 50,
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const randomRadius = radius * (0.6 + Math.random() * 0.4);
      const targetX = Math.cos(angle) * randomRadius;
      const targetY = Math.sin(angle) * randomRadius;
      const emoji = emojis[i % emojis.length];
      const delay = Math.random() * 5; // frames
      const scale = 0.8 + Math.random() * 0.6;

      return {
        id: i,
        emoji,
        targetX,
        targetY,
        delay,
        scale,
      };
    });
  }, [count, emojis, radius]);

  if (relativeFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: `${originX}%`,
          top: `${originY}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {particles.map((particle) => {
          const particleFrame = relativeFrame - particle.delay;
          if (particleFrame < 0 || particleFrame > duration) return null;

          const progress = particleFrame / duration;

          const x = interpolate(progress, [0, 0.3, 1], [0, particle.targetX, particle.targetX]);
          const y = interpolate(progress, [0, 0.3, 1], [0, particle.targetY, particle.targetY]);
          const scale = interpolate(
            progress,
            [0, 0.3, 1],
            [0, particle.scale, particle.scale * 0.5]
          );
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 0]);

          return (
            <div
              key={particle.id}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                fontSize: 32,
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`,
                opacity,
              }}
            >
              {particle.emoji}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const GoldCoinBurst: React.FC<Partial<CoinBurstProps>> = (props) => (
  <CoinBurst
    count={16}
    emojis={["💰", "🪙", "💰", "🪙", "✨"]}
    radius={180}
    {...props}
  />
);

export const TrophyBurst: React.FC<Partial<CoinBurstProps>> = (props) => (
  <CoinBurst
    count={8}
    emojis={["🏆", "🎉", "🌟", "💎"]}
    radius={120}
    {...props}
  />
);

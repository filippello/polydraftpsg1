import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface ConfettiProps {
  count?: number;
  colors?: string[];
  startFrame?: number;
  duration?: number;
}

const DEFAULT_COLORS = [
  "#ffd700", // gold
  "#ff6b6b", // red
  "#4ecdc4", // teal
  "#45b7d1", // blue
  "#f7dc6f", // yellow
  "#a855f7", // purple
  "#22c55e", // green
];

export const Confetti: React.FC<ConfettiProps> = ({
  count = 50,
  colors = DEFAULT_COLORS,
  startFrame = 0,
  duration = 90, // 3 seconds at 30fps
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => {
      const color = colors[i % colors.length];
      const startX = Math.random() * 100;
      const horizontalDrift = (Math.random() - 0.5) * 300;
      const delay = Math.random() * 15; // frames
      const particleDuration = duration * (0.7 + Math.random() * 0.5);
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;
      const size = 6 + Math.random() * 8;
      const shape = Math.random() > 0.5 ? "circle" : "rect";

      return {
        id: i,
        color,
        startX,
        horizontalDrift,
        delay,
        particleDuration,
        rotationDirection,
        size,
        shape,
      };
    });
  }, [count, colors, duration]);

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
      {particles.map((particle) => {
        const particleFrame = relativeFrame - particle.delay;
        if (particleFrame < 0 || particleFrame > particle.particleDuration)
          return null;

        const progress = particleFrame / particle.particleDuration;

        const y = interpolate(progress, [0, 1], [-20, 2000]);
        const x = interpolate(progress, [0, 1], [0, particle.horizontalDrift]);
        const rotation = interpolate(
          progress,
          [0, 1],
          [0, 360 * 3 * particle.rotationDirection]
        );
        const opacity = interpolate(
          progress,
          [0, 0.1, 0.7, 1],
          [0, 1, 1, 0]
        );

        return (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              left: `${particle.startX}%`,
              top: 0,
              width: particle.size,
              height: particle.shape === "rect" ? particle.size * 2 : particle.size,
              backgroundColor: particle.color,
              borderRadius: particle.shape === "circle" ? "50%" : 2,
              transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

export const GoldConfetti: React.FC<Partial<ConfettiProps>> = (props) => (
  <Confetti
    count={60}
    colors={["#ffd700", "#ffed4a", "#f7dc6f", "#ffc107", "#ffb300"]}
    {...props}
  />
);

export const VictoryConfetti: React.FC<Partial<ConfettiProps>> = (props) => (
  <Confetti count={100} duration={120} {...props} />
);

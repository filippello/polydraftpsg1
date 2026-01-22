import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface CardSpriteProps {
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  scale?: number;
  enterDelay?: number;
}

const rarityColors = {
  common: { border: "#6b7280", glow: "none" },
  uncommon: { border: "#22c55e", glow: "0 0 10px rgba(34, 197, 94, 0.5)" },
  rare: { border: "#3b82f6", glow: "0 0 15px rgba(59, 130, 246, 0.6)" },
  epic: { border: "#a855f7", glow: "0 0 20px rgba(168, 85, 247, 0.7)" },
  legendary: { border: "#f97316", glow: "0 0 25px rgba(249, 115, 22, 0.8)" },
};

export const CardSprite: React.FC<CardSpriteProps> = ({
  emoji,
  rarity,
  scale = 1,
  enterDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const config = rarityColors[rarity];

  // Entrance animation
  const enterProgress = interpolate(
    frame - enterDelay,
    [0, 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const enterScale = interpolate(
    enterProgress,
    [0, 0.5, 0.7, 1],
    [0, 1.2, 0.95, 1]
  );
  const enterY = interpolate(enterProgress, [0, 1], [100, 0]);
  const enterOpacity = interpolate(enterProgress, [0, 0.3], [0, 1]);

  // Idle floating animation
  const floatY = Math.sin(frame * 0.1) * 3;

  const width = 60 * scale;
  const height = 84 * scale;

  return (
    <div
      style={{
        width,
        height,
        transform: `translateY(${enterY + floatY}px) scale(${enterScale})`,
        opacity: enterOpacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: 8 * scale,
          border: `3px solid ${config.border}`,
          boxShadow: `4px 4px 0 0 rgba(0,0,0,0.5), ${config.glow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Shine effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
          }}
        />

        {/* Emoji */}
        <span style={{ fontSize: 28 * scale }}>{emoji}</span>
      </div>
    </div>
  );
};

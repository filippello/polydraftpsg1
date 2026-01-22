import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface PackSpriteProps {
  type?: "sports" | "economy" | "politics" | "crypto" | "default";
  shake?: boolean;
  glow?: boolean;
  scale?: number;
  opening?: boolean;
  openProgress?: number;
}

const typeColors = {
  sports: {
    primary: "#16213e",
    accent: "#e94560",
    icon: "⚽",
  },
  economy: {
    primary: "#1a4731",
    accent: "#22c55e",
    icon: "📈",
  },
  politics: {
    primary: "#3f1d4e",
    accent: "#a855f7",
    icon: "🗳️",
  },
  crypto: {
    primary: "#4a3f00",
    accent: "#fbbf24",
    icon: "₿",
  },
  default: {
    primary: "#16213e",
    accent: "#e94560",
    icon: "🎴",
  },
};

export const PackSprite: React.FC<PackSpriteProps> = ({
  type = "sports",
  shake = false,
  glow = false,
  scale = 1,
  opening = false,
  openProgress = 0,
}) => {
  const frame = useCurrentFrame();
  const config = typeColors[type];

  // Shake animation
  const shakeX = shake ? Math.sin(frame * 1.5) * 8 : 0;
  const shakeY = shake ? Math.cos(frame * 2) * 4 : 0;
  const shakeRotate = shake ? Math.sin(frame * 1.8) * 3 : 0;

  // Glow animation
  const glowIntensity = glow
    ? interpolate(Math.sin(frame * 0.15), [-1, 1], [20, 40])
    : 0;

  // Opening animation
  const openScale = opening
    ? interpolate(openProgress, [0, 0.5, 1], [1, 1.2, 0])
    : 1;
  const openRotate = opening
    ? interpolate(openProgress, [0, 1], [0, 15])
    : 0;
  const openOpacity = opening
    ? interpolate(openProgress, [0.7, 1], [1, 0])
    : 1;

  const width = 140 * scale;
  const height = 200 * scale;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeRotate + openRotate}deg) scale(${openScale})`,
        opacity: openOpacity,
        filter: glow
          ? `drop-shadow(0 0 ${glowIntensity}px ${config.accent})`
          : "none",
      }}
    >
      {/* Main pack body */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12 * scale,
          background: `linear-gradient(135deg, ${config.primary} 0%, ${config.primary}dd 50%, ${config.primary} 100%)`,
          border: `4px solid rgba(255,255,255,0.2)`,
          boxShadow: `8px 8px 0 0 rgba(0,0,0,0.3)`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            )`,
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8 * scale,
            backgroundColor: config.accent,
          }}
        />

        {/* Pack content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: 48 * scale,
              marginBottom: 8 * scale,
              filter: "drop-shadow(2px 2px 0 rgba(0,0,0,0.5))",
            }}
          >
            {config.icon}
          </div>

          {/* Pack type label */}
          <div
            style={{
              padding: `${4 * scale}px ${8 * scale}px`,
              borderRadius: 4 * scale,
              backgroundColor: config.accent,
              color: "#fff",
              fontSize: 12 * scale,
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {type}
          </div>

          {/* Card count */}
          <div
            style={{
              marginTop: 8 * scale,
              color: "rgba(255,255,255,0.6)",
              fontSize: 10 * scale,
            }}
          >
            5 cards
          </div>
        </div>

        {/* Bottom gradient */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 32,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
          }}
        />

        {/* Corner decorations */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: config.accent,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: config.accent,
          }}
        />

        {/* Shine effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

import React from "react";
import { Img, staticFile, interpolate, useCurrentFrame } from "remotion";
import { PixelText } from "./PixelFont";

interface GameCardProps {
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  title: string;
  teamA: string;
  teamB: string;
  oddsA: string;
  oddsB: string;
  image?: string;
  category?: string;
  scale?: number;
  swipeDirection?: "left" | "right" | null;
  swipeProgress?: number;
}

const rarityColors = {
  common: { hex: "#9ca3af", glow: "rgba(156, 163, 175, 0.5)" },
  uncommon: { hex: "#22c55e", glow: "rgba(34, 197, 94, 0.5)" },
  rare: { hex: "#3b82f6", glow: "rgba(59, 130, 246, 0.6)" },
  epic: { hex: "#a855f7", glow: "rgba(168, 85, 247, 0.7)" },
  legendary: { hex: "#f97316", glow: "rgba(249, 115, 22, 0.8)" },
};

export const GameCard: React.FC<GameCardProps> = ({
  rarity,
  title,
  teamA,
  teamB,
  oddsA,
  oddsB,
  image,
  category = "Sports",
  scale = 1,
  swipeDirection = null,
  swipeProgress = 0,
}) => {
  const frame = useCurrentFrame();
  const config = rarityColors[rarity];

  // Swipe animation
  const swipeX = swipeDirection
    ? interpolate(swipeProgress, [0, 1], [0, swipeDirection === "right" ? 600 : -600])
    : 0;
  const swipeRotate = swipeDirection
    ? interpolate(swipeProgress, [0, 1], [0, swipeDirection === "right" ? 30 : -30])
    : 0;
  const swipeOpacity = swipeDirection
    ? interpolate(swipeProgress, [0.5, 1], [1, 0])
    : 1;

  // Glow animation for rare+
  const showGlow = rarity === "rare" || rarity === "epic" || rarity === "legendary";
  const glowIntensity = showGlow
    ? interpolate(Math.sin(frame * 0.1), [-1, 1], [20, 40])
    : 0;

  // Card dimensions - MUCH BIGGER
  const width = 420 * scale;
  const height = 620 * scale;

  // Overlay opacity based on swipe
  const rightOverlayOpacity = swipeDirection === "right"
    ? interpolate(swipeProgress, [0, 0.2], [0, 0.9])
    : 0;
  const leftOverlayOpacity = swipeDirection === "left"
    ? interpolate(swipeProgress, [0, 0.2], [0, 0.9])
    : 0;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        transform: `translateX(${swipeX}px) rotate(${swipeRotate}deg)`,
        opacity: swipeOpacity,
        filter: showGlow ? `drop-shadow(0 0 ${glowIntensity}px ${config.glow})` : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1e293b",
          borderRadius: 24 * scale,
          border: `6px solid ${config.hex}`,
          boxShadow: `10px 10px 0 0 rgba(0,0,0,0.6)`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Foil effect for rare+ */}
        {(rarity === "rare" || rarity === "epic") && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)`,
              backgroundSize: "200% 200%",
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Holo effect for legendary */}
        {rarity === "legendary" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg,
                rgba(255,0,0,0.12) 0%,
                rgba(255,165,0,0.12) 20%,
                rgba(255,255,0,0.12) 40%,
                rgba(0,255,0,0.12) 60%,
                rgba(0,0,255,0.12) 80%,
                rgba(255,0,255,0.12) 100%
              )`,
              backgroundSize: "400% 400%",
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Right swipe overlay (Option A - blue) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(59, 130, 246, 0.5)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: rightOverlayOpacity,
          }}
        >
          <div
            style={{
              background: "#3b82f6",
              padding: "20px 40px",
              borderRadius: 16,
              transform: "rotate(15deg)",
              border: "5px solid white",
              boxShadow: "6px 6px 0 rgba(0,0,0,0.4)",
            }}
          >
            <PixelText size={28} color="white">
              {teamA}
            </PixelText>
          </div>
        </div>

        {/* Left swipe overlay (Option B - red) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(239, 68, 68, 0.5)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: leftOverlayOpacity,
          }}
        >
          <div
            style={{
              background: "#ef4444",
              padding: "20px 40px",
              borderRadius: 16,
              transform: "rotate(-15deg)",
              border: "5px solid white",
              boxShadow: "6px 6px 0 rgba(0,0,0,0.4)",
            }}
          >
            <PixelText size={28} color="white">
              {teamB}
            </PixelText>
          </div>
        </div>

        {/* Header badges */}
        <div
          style={{
            position: "absolute",
            top: 16 * scale,
            left: 16 * scale,
            right: 16 * scale,
            display: "flex",
            justifyContent: "space-between",
            zIndex: 15,
          }}
        >
          <div style={{ display: "flex", gap: 10 * scale }}>
            <div
              style={{
                padding: `${10 * scale}px ${16 * scale}px`,
                background: "rgba(0,0,0,0.8)",
                borderRadius: 10 * scale,
                boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              }}
            >
              <PixelText size={12 * scale} color="white">
                {category.toUpperCase()}
              </PixelText>
            </div>
            <div
              style={{
                padding: `${10 * scale}px ${16 * scale}px`,
                background: config.hex,
                borderRadius: 10 * scale,
                boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              }}
            >
              <PixelText size={12 * scale} color="white">
                {rarity.toUpperCase()}
              </PixelText>
            </div>
          </div>
        </div>

        {/* Image area */}
        <div
          style={{
            width: "100%",
            height: "45%",
            background: "#0f3460",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {image ? (
            <Img
              src={staticFile(image)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span style={{ fontSize: 80 * scale }}>⚽</span>
          )}
          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: "linear-gradient(to top, #1e293b, transparent)",
            }}
          />
        </div>

        {/* Content area */}
        <div
          style={{
            padding: 24 * scale,
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 24 * scale }}>
            <PixelText size={20 * scale} color="white">
              {title}
            </PixelText>
          </div>

          {/* VS Display */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 24 * scale,
              flex: 1,
            }}
          >
            {/* Team B - Left */}
            <div style={{ textAlign: "right", flex: 1 }}>
              <PixelText size={18 * scale} color="#ef4444">
                {teamB}
              </PixelText>
              <div style={{ marginTop: 8 * scale }}>
                <PixelText size={28 * scale} color="white">
                  {oddsB}
                </PixelText>
              </div>
            </div>

            {/* VS */}
            <PixelText size={32 * scale} color="#6b7280">
              VS
            </PixelText>

            {/* Team A - Right */}
            <div style={{ textAlign: "left", flex: 1 }}>
              <PixelText size={18 * scale} color="#3b82f6">
                {teamA}
              </PixelText>
              <div style={{ marginTop: 8 * scale }}>
                <PixelText size={28 * scale} color="white">
                  {oddsA}
                </PixelText>
              </div>
            </div>
          </div>

          {/* Swipe hints */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 20 * scale,
              padding: `${12 * scale}px`,
              background: "rgba(0,0,0,0.3)",
              borderRadius: 12 * scale,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PixelText size={20 * scale} color="#ef4444">←</PixelText>
              <PixelText size={12 * scale} color="#ef4444">{teamB}</PixelText>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PixelText size={12 * scale} color="#3b82f6">{teamA}</PixelText>
              <PixelText size={20 * scale} color="#3b82f6">→</PixelText>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

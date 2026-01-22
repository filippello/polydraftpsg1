import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CardSprite } from "../../components/CardSprite";
import { GoldConfetti } from "../../components/Confetti";
import { PixelText } from "../../components/PixelFont";

const CARDS = [
  { emoji: "⚽", rarity: "common" as const },
  { emoji: "🏀", rarity: "uncommon" as const },
  { emoji: "🏈", rarity: "rare" as const },
  { emoji: "⚾", rarity: "epic" as const },
  { emoji: "🏆", rarity: "legendary" as const },
];

export const Scene2CardReveals: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing: 75 frames (~2.5 seconds)
  // Cards appear one by one every 10 frames

  // Flash at the beginning
  const flashOpacity = interpolate(frame, [0, 5], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Progress counter
  const visibleCards = Math.min(5, Math.floor((frame + 5) / 10));
  const counterScale = interpolate(Math.sin(frame * 0.3), [-1, 1], [1, 1.05]);

  return (
    <AbsoluteFill
      style={{
        background: "#1a1a2e",
      }}
    >
      {/* Radial gradient background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 45%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)",
        }}
      />

      {/* Flash effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "white",
          opacity: flashOpacity,
        }}
      />

      {/* Confetti on legendary reveal */}
      {frame >= 42 && <GoldConfetti startFrame={42} count={50} />}

      {/* Cards container - adjusted for square format */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 12,
        }}
      >
        {CARDS.map((card, i) => (
          <CardSprite
            key={i}
            emoji={card.emoji}
            rarity={card.rarity}
            scale={1.0}
            enterDelay={i * 10}
          />
        ))}
      </div>

      {/* Progress counter */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          transform: `translateX(-50%) scale(${counterScale})`,
        }}
      >
        <div
          style={{
            background: "rgba(0, 0, 0, 0.7)",
            padding: "14px 28px",
            borderRadius: 12,
            border: "3px solid rgba(255, 215, 0, 0.4)",
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.2)",
          }}
        >
          <PixelText size={20} color="#ffd700">
            {visibleCards}
          </PixelText>
          <PixelText size={20} color="rgba(255, 255, 255, 0.5)">
            {" "}/ 5 cards
          </PixelText>
        </div>
      </div>

      {/* "Make your picks" hint */}
      {frame > 55 && (
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: interpolate(frame, [55, 65], [0, 1]),
          }}
        >
          <PixelText size={14} color="rgba(255, 255, 255, 0.7)">
            Swipe to make your picks! 🎯
          </PixelText>
        </div>
      )}
    </AbsoluteFill>
  );
};

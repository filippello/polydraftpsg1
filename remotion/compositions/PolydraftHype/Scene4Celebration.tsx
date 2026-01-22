import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { VictoryConfetti } from "../../components/Confetti";
import { GoldCoinBurst, TrophyBurst } from "../../components/CoinBurst";
import { PixelText } from "../../components/PixelFont";

export const Scene4Celebration: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing: 150 frames (5 seconds)
  // 0-30: Initial explosion
  // 30-90: Jackpot card reveal with counter
  // 90-150: CTA and final celebration

  // Initial flash
  const flashOpacity = interpolate(frame, [0, 12], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Jackpot card entrance
  const cardEnterProgress = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardScale = interpolate(
    cardEnterProgress,
    [0, 0.5, 0.7, 1],
    [0, 1.15, 0.95, 1]
  );
  const cardY = interpolate(cardEnterProgress, [0, 1], [80, 0]);

  // Shimmer effect
  const shimmerX = interpolate(frame, [0, 50], [-100, 200], {
    extrapolateRight: "extend",
  });

  // USD counter animation
  const maxUSD = 127.5;
  const counterProgress = interpolate(frame, [40, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayUSD = (maxUSD * counterProgress).toFixed(2);

  // Probability display
  const probOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  // CTA button
  const ctaProgress = interpolate(frame, [95, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = interpolate(ctaProgress, [0, 0.6, 1], [0, 1.15, 1]);
  const ctaPulse = interpolate(
    Math.sin((frame - 115) * 0.2),
    [-1, 1],
    [1, 1.08]
  );

  // Floating emojis
  const emojis = ["🎉", "💰", "🏆", "⭐", "💎", "🔥"];

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 40%, rgba(255, 215, 0, 0.2) 0%, #1a1a2e 60%)",
      }}
    >
      {/* Victory confetti */}
      <VictoryConfetti startFrame={0} />

      {/* Coin bursts */}
      <GoldCoinBurst startFrame={5} originY={45} />
      <TrophyBurst startFrame={12} originY={50} />

      {/* Flash effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffd700",
          opacity: flashOpacity,
        }}
      />

      {/* Jackpot card - adjusted for square format */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${cardY}px) scale(${cardScale})`,
        }}
      >
        <div
          style={{
            width: 380,
            padding: 28,
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: 20,
            border: "5px solid #ffd700",
            boxShadow:
              "0 0 50px rgba(255, 215, 0, 0.5), 8px 8px 0 0 rgba(0,0,0,0.4)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Shimmer effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: shimmerX,
              width: 80,
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              transform: "skewX(-20deg)",
            }}
          />

          {/* Header */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <PixelText size={12} color="#ffd700" glow="#ffd700">
              ✨ POTENTIAL JACKPOT ✨
            </PixelText>
          </div>

          {/* USD Amount */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <PixelText size={36} color="#22c55e" glow="#22c55e">
              ${displayUSD}
            </PixelText>
            <div style={{ marginTop: 8 }}>
              <PixelText size={10} color="rgba(255, 255, 255, 0.6)">
                if all picks hit!
              </PixelText>
            </div>
          </div>

          {/* Combined probability */}
          <div
            style={{
              textAlign: "center",
              opacity: probOpacity,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "rgba(255, 215, 0, 0.2)",
                borderRadius: 10,
                border: "2px solid rgba(255, 215, 0, 0.4)",
              }}
            >
              <PixelText size={10} color="rgba(255,255,255,0.7)">
                Combined odds:{" "}
              </PixelText>
              <PixelText size={12} color="#ffd700">
                7.8%
              </PixelText>
            </div>
          </div>

          {/* Mini pick chips */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 18,
              opacity: probOpacity,
            }}
          >
            {["Argentina", "Celtics", "Yes"].map((pick, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 12px",
                  background: "rgba(59, 130, 246, 0.4)",
                  border: "2px solid #3b82f6",
                  borderRadius: 8,
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                }}
              >
                <PixelText size={8} color="white">
                  {pick}
                </PixelText>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          transform: `translate(-50%, 0) scale(${ctaScale * (frame > 115 ? ctaPulse : 1)})`,
          opacity: ctaProgress,
        }}
      >
        <div
          style={{
            padding: "18px 50px",
            background: "linear-gradient(135deg, #e94560 0%, #c73e54 100%)",
            borderRadius: 16,
            border: "4px solid rgba(255,255,255,0.4)",
            boxShadow:
              "0 0 40px rgba(233, 69, 96, 0.6), 6px 6px 0 0 rgba(0,0,0,0.4)",
          }}
        >
          <PixelText size={18} color="white">
            PLAY NOW! 🚀
          </PixelText>
        </div>
      </div>

      {/* Floating celebration emojis */}
      {frame > 25 &&
        emojis.map((emoji, i) => {
          const delay = i * 6;
          const emojiFrame = frame - 25 - delay;
          if (emojiFrame < 0) return null;

          const startX = 10 + ((i * 15) % 80);
          const y = interpolate(emojiFrame, [0, 100], [105, -5]);
          const x = startX + Math.sin(emojiFrame * 0.06 + i) * 12;
          const opacity = interpolate(emojiFrame, [0, 15, 80, 100], [0, 1, 1, 0]);
          const scale = 0.9 + Math.sin(emojiFrame * 0.12) * 0.2;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                fontSize: 36,
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              {emoji}
            </div>
          );
        })}

      {/* "Download now" text at bottom */}
      {frame > 125 && (
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: interpolate(frame, [125, 140], [0, 1]),
          }}
        >
          <PixelText size={10} color="rgba(255, 255, 255, 0.7)">
            App Store & Play Store
          </PixelText>
        </div>
      )}
    </AbsoluteFill>
  );
};

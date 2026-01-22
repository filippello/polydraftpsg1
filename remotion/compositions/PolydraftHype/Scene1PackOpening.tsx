import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PackSprite } from "../../components/PackSprite";
import { PixelText } from "../../components/PixelFont";

export const Scene1PackOpening: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing: 100 frames (~3.3 seconds)
  // 0-20: Pack enters
  // 20-70: Shaking and glowing
  // 70-100: Opening explosion

  // Background pulse
  const bgPulse = interpolate(Math.sin(frame * 0.15), [-1, 1], [0.03, 0.1]);

  // Pack entrance
  const packEnterProgress = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const packY = interpolate(packEnterProgress, [0, 1], [200, 0]);
  const packScale = interpolate(packEnterProgress, [0, 0.7, 1], [0.5, 1.15, 1]);

  // Shake intensity increases over time
  const shakePhase = frame >= 20 && frame < 70;
  const shakeIntensity = shakePhase ? interpolate(frame, [20, 70], [0, 1]) : 0;

  // Opening phase
  const openingPhase = frame >= 70;
  const openProgress = openingPhase
    ? interpolate(frame, [70, 100], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  // "Opening..." text
  const textOpacity = interpolate(frame, [25, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textPulse = interpolate(Math.sin(frame * 0.25), [-1, 1], [0.9, 1.1]);

  // Light rays on opening
  const rayOpacity = openingPhase
    ? interpolate(openProgress, [0, 0.5, 1], [0, 1, 0])
    : 0;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(233, 69, 96, ${bgPulse}) 0%, #1a1a2e 70%)`,
      }}
    >
      {/* Light rays */}
      {openingPhase && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            opacity: rayOpacity,
          }}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 6,
                height: 300,
                background:
                  "linear-gradient(to top, transparent, #ffd700, transparent)",
                transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                transformOrigin: "bottom center",
              }}
            />
          ))}
        </div>
      )}

      {/* Pack container */}
      <div
        style={{
          position: "absolute",
          top: "45%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${packY}px) scale(${packScale})`,
        }}
      >
        <PackSprite
          type="sports"
          shake={shakePhase}
          glow={shakePhase || openingPhase}
          scale={1.3}
          opening={openingPhase}
          openProgress={openProgress}
        />
      </div>

      {/* "Opening..." text */}
      {!openingPhase && (
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "50%",
            transform: `translateX(-50%) scale(${textPulse})`,
            opacity: textOpacity,
          }}
        >
          <PixelText size={24} color="#ffd700" glow="#ffd700">
            OPENING...
          </PixelText>
        </div>
      )}

      {/* Sparkles around pack */}
      {shakePhase &&
        [...Array(10)].map((_, i) => {
          const angle = (i / 10) * Math.PI * 2 + frame * 0.06;
          const radius = 140 + Math.sin(frame * 0.2 + i) * 25;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const sparkleOpacity = interpolate(
            Math.sin(frame * 0.35 + i),
            [-1, 1],
            [0.3, 1]
          );

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                fontSize: 24,
                opacity: sparkleOpacity * shakeIntensity,
              }}
            >
              ✨
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

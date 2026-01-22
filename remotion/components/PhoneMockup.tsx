import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

interface PhoneMockupProps {
  children: React.ReactNode;
  scale?: number;
  floating?: boolean;
  glowing?: boolean;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  scale = 1,
  floating = false,
  glowing = false,
}) => {
  const frame = useCurrentFrame();

  // Floating animation
  const floatY = floating ? Math.sin(frame * 0.08) * 8 : 0;
  const floatRotate = floating ? Math.sin(frame * 0.05) * 1.5 : 0;

  // Glow pulse
  const glowIntensity = glowing
    ? interpolate(Math.sin(frame * 0.1), [-1, 1], [30, 50])
    : 0;

  const phoneWidth = 380 * scale;
  const phoneHeight = 780 * scale;
  const borderRadius = 50 * scale;
  const bezelWidth = 12 * scale;

  return (
    <div
      style={{
        width: phoneWidth,
        height: phoneHeight,
        position: "relative",
        transform: `translateY(${floatY}px) rotate(${floatRotate}deg)`,
        filter: glowing
          ? `drop-shadow(0 0 ${glowIntensity}px rgba(233, 69, 96, 0.6))`
          : "drop-shadow(0 30px 60px rgba(0,0,0,0.5))",
      }}
    >
      {/* Phone frame */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(145deg, #2a2a3a, #1a1a2a)",
          borderRadius,
          padding: bezelWidth,
          boxSizing: "border-box",
          position: "relative",
          boxShadow: `
            inset 0 2px 4px rgba(255,255,255,0.1),
            inset 0 -2px 4px rgba(0,0,0,0.3),
            0 20px 60px rgba(0,0,0,0.4)
          `,
        }}
      >
        {/* Side button (volume) */}
        <div
          style={{
            position: "absolute",
            left: -4 * scale,
            top: 120 * scale,
            width: 4 * scale,
            height: 30 * scale,
            background: "#3a3a4a",
            borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -4 * scale,
            top: 160 * scale,
            width: 4 * scale,
            height: 50 * scale,
            background: "#3a3a4a",
            borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
          }}
        />
        {/* Power button */}
        <div
          style={{
            position: "absolute",
            right: -4 * scale,
            top: 150 * scale,
            width: 4 * scale,
            height: 60 * scale,
            background: "#3a3a4a",
            borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
          }}
        />

        {/* Screen */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1a1a2e",
            borderRadius: borderRadius - bezelWidth,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Dynamic Island / Notch */}
          <div
            style={{
              position: "absolute",
              top: 12 * scale,
              left: "50%",
              transform: "translateX(-50%)",
              width: 100 * scale,
              height: 28 * scale,
              background: "#000",
              borderRadius: 20 * scale,
              zIndex: 100,
            }}
          />

          {/* Screen content */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {children}
          </div>

          {/* Home indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 8 * scale,
              left: "50%",
              transform: "translateX(-50%)",
              width: 120 * scale,
              height: 5 * scale,
              background: "rgba(255,255,255,0.3)",
              borderRadius: 3 * scale,
              zIndex: 100,
            }}
          />
        </div>

        {/* Screen reflection */}
        <div
          style={{
            position: "absolute",
            top: bezelWidth,
            left: bezelWidth,
            right: bezelWidth,
            bottom: bezelWidth,
            borderRadius: borderRadius - bezelWidth,
            background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

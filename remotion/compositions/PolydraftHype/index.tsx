import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Scene0Orderbook } from "./Scene0Orderbook";
import { Scene1PackOpening } from "./Scene1PackOpening";
import { Scene2CardReveals } from "./Scene2CardReveals";
import { Scene3SwipePicks } from "./Scene3SwipePicks";
import { Scene4Celebration } from "./Scene4Celebration";
import { PixelText } from "../../components/PixelFont";

// Total duration: 610 frames (~20 seconds at 30fps)
// Scene 0: Polymarket Orderbook - 0-120 (4s)
// Scene 1: Pack Opening - 145-245 (3.3s)
// Scene 2: Card Reveals - 240-315 (2.5s)
// Scene 3: Swipe Picks - 310-465 (5s)
// Scene 4: Celebration - 460-610 (5s)

export const PolydraftHype: React.FC = () => {
  const frame = useCurrentFrame();

  // Determine if we're past the orderbook intro
  const isGameMode = frame >= 120;

  return (
    <AbsoluteFill style={{ background: "#1a1a2e" }}>
      {/* Load Google Font globally */}
      <link
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
        rel="stylesheet"
      />

      {/* Scene 0: Polymarket Orderbook */}
      <Sequence from={0} durationInFrames={125}>
        <Scene0Orderbook />
      </Sequence>

      {/* "What if..." transition text */}
      {frame >= 115 && frame <= 150 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a2e",
            zIndex: 100,
            opacity: interpolate(frame, [115, 125, 145, 150], [0, 1, 1, 0]),
          }}
        >
          <PixelText size={32} color="#ffd700" glow="#ffd700">
            What if trading was fun? 🎮
          </PixelText>
        </div>
      )}

      {/* Logo watermark (only in game mode) */}
      {isGameMode && (
        <div
          style={{
            position: "absolute",
            top: 30,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: interpolate(frame, [150, 165], [0, 1], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "linear-gradient(135deg, #e94560, #c73e54)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "4px 4px 0 0 rgba(0,0,0,0.4)",
            }}
          >
            <PixelText size={20} color="white">
              P
            </PixelText>
          </div>
          <PixelText size={18} color="white">
            Poly<span style={{ color: "#e94560" }}>draft</span>
          </PixelText>
        </div>
      )}

      {/* Scene 1: Pack Opening */}
      <Sequence from={145} durationInFrames={100}>
        <Scene1PackOpening />
      </Sequence>

      {/* Scene 2: Card Reveals */}
      <Sequence from={240} durationInFrames={75}>
        <Scene2CardReveals />
      </Sequence>

      {/* Scene 3: Swipe Picks */}
      <Sequence from={310} durationInFrames={155}>
        <Scene3SwipePicks />
      </Sequence>

      {/* Scene 4: Celebration */}
      <Sequence from={460} durationInFrames={150}>
        <Scene4Celebration />
      </Sequence>

      {/* Scene transition flashes */}
      {frame >= 235 && frame <= 250 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: interpolate(frame, [235, 240, 245, 250], [0, 0.7, 0.7, 0]),
            zIndex: 500,
          }}
        />
      )}

      {frame >= 305 && frame <= 320 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: interpolate(frame, [305, 310, 315, 320], [0, 0.5, 0.5, 0]),
            zIndex: 500,
          }}
        />
      )}

      {frame >= 455 && frame <= 470 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#ffd700",
            opacity: interpolate(frame, [455, 460, 465, 470], [0, 0.8, 0.8, 0]),
            zIndex: 500,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

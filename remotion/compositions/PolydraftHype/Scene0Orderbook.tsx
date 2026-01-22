import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PixelText } from "../../components/PixelFont";

// Simulated orderbook data
const ORDERBOOK_BIDS = [
  { price: 0.67, size: 12500, total: 12500 },
  { price: 0.66, size: 8200, total: 20700 },
  { price: 0.65, size: 15000, total: 35700 },
  { price: 0.64, size: 6800, total: 42500 },
  { price: 0.63, size: 9100, total: 51600 },
];

const ORDERBOOK_ASKS = [
  { price: 0.68, size: 11000, total: 11000 },
  { price: 0.69, size: 7500, total: 18500 },
  { price: 0.70, size: 13200, total: 31700 },
  { price: 0.71, size: 5400, total: 37100 },
  { price: 0.72, size: 8900, total: 46000 },
];

export const Scene0Orderbook: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing: 120 frames (4 seconds)
  const entranceOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Browser entrance animation
  const browserY = interpolate(frame, [0, 20], [50, 0], {
    extrapolateRight: "clamp",
  });
  const browserScale = interpolate(frame, [0, 20], [0.95, 1], {
    extrapolateRight: "clamp",
  });

  // Simulated price updates (flicker)
  const priceFlicker = Math.sin(frame * 0.5) > 0.7;
  const priceFlicker2 = Math.sin(frame * 0.7 + 1) > 0.6;

  // Cursor animation
  const cursorX = interpolate(frame, [30, 50, 70], [200, 350, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(frame, [30, 50, 70], [400, 450, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorVisible = frame > 25 && frame < 85;

  // Glitch effect at the end
  const glitchPhase = frame >= 90;
  const glitchIntensity = glitchPhase
    ? interpolate(frame, [90, 120], [0, 1])
    : 0;
  const glitchX = glitchPhase ? Math.sin(frame * 2) * 15 * glitchIntensity : 0;
  const glitchY = glitchPhase ? Math.cos(frame * 3) * 8 * glitchIntensity : 0;

  // RGB split effect
  const rgbSplit = glitchIntensity * 10;

  // "Boring" text that appears
  const boringOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const boringScale = interpolate(frame, [55, 70], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Screen shake
  const screenShake = glitchPhase
    ? {
        x: Math.sin(frame * 5) * 8 * glitchIntensity,
        y: Math.cos(frame * 7) * 8 * glitchIntensity,
      }
    : { x: 0, y: 0 };

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
        transform: `translate(${screenShake.x}px, ${screenShake.y}px)`,
      }}
    >
      {/* Desk/table surface gradient */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "30%",
          background: "linear-gradient(to top, rgba(40, 30, 20, 0.3), transparent)",
        }}
      />

      {/* Mac Browser Window */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: `translateX(-50%) translateY(${browserY}px) scale(${browserScale}) translateX(${glitchX}px) translateY(${glitchY}px)`,
          width: "92%",
          height: "80%",
          opacity: entranceOpacity,
        }}
      >
        {/* Browser chrome/frame */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1c1c1e",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 25px 80px rgba(0, 0, 0, 0.6), 0 10px 30px rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Title bar - Mac style */}
          <div
            style={{
              height: 52,
              background: "linear-gradient(to bottom, #3a3a3c, #2c2c2e)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              borderBottom: "1px solid #1c1c1e",
            }}
          >
            {/* Traffic lights */}
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#ff5f57",
                  boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2)",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#febc2e",
                  boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2)",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#28c840",
                  boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>

            {/* URL bar */}
            <div
              style={{
                flex: 1,
                marginLeft: 80,
                marginRight: 80,
                height: 32,
                background: "#1c1c1e",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                P
              </div>
              <span
                style={{
                  fontSize: 13,
                  color: "#8e8e93",
                  fontFamily: "system-ui",
                }}
              >
                polymarket.com/event/presidential-election
              </span>
            </div>
          </div>

          {/* Browser content */}
          <div
            style={{
              flex: 1,
              background: "#0d1117",
              padding: 24,
              height: "calc(100% - 52px)",
              overflow: "hidden",
            }}
          >
            {/* Polymarket header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#6366f1",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: "bold", color: "white" }}>
                  P
                </span>
              </div>
              <span
                style={{
                  fontSize: 26,
                  fontWeight: "bold",
                  color: "white",
                  fontFamily: "system-ui",
                }}
              >
                Polymarket
              </span>
            </div>

            {/* Event title */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 14,
                  color: "#8b949e",
                  fontFamily: "system-ui",
                  marginBottom: 6,
                }}
              >
                2024 US Presidential Election
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "white",
                  fontFamily: "system-ui",
                }}
              >
                Who will win?
              </div>
            </div>

            {/* Orderbook container */}
            <div
              style={{
                background: "#161b22",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #30363d",
              }}
            >
              {/* Orderbook header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderBottom: "1px solid #30363d",
                }}
              >
                <span style={{ color: "#8b949e", fontSize: 12, fontFamily: "system-ui" }}>
                  ORDER BOOK
                </span>
                <span style={{ color: "#8b949e", fontSize: 12, fontFamily: "system-ui" }}>
                  SPREAD: 1.0%
                </span>
              </div>

              {/* Column headers */}
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderBottom: "1px solid #30363d",
                  fontSize: 10,
                  color: "#8b949e",
                  fontFamily: "monospace",
                }}
              >
                <div style={{ flex: 1 }}>PRICE</div>
                <div style={{ flex: 1, textAlign: "center" }}>SIZE</div>
                <div style={{ flex: 1, textAlign: "right" }}>TOTAL</div>
              </div>

              {/* Asks (sells) - red */}
              {[...ORDERBOOK_ASKS].reverse().map((ask, i) => {
                const rowDelay = i * 3;
                const rowOpacity = interpolate(frame, [rowDelay + 5, rowDelay + 12], [0, 1], {
                  extrapolateRight: "clamp",
                });
                const depthWidth = (ask.total / 50000) * 100;
                const isFlickering = i === 2 && priceFlicker2;

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      padding: "6px 16px",
                      position: "relative",
                      opacity: rowOpacity,
                      fontFamily: "monospace",
                      fontSize: 13,
                      background: isFlickering ? "rgba(248, 81, 73, 0.1)" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${depthWidth}%`,
                        background: "rgba(248, 81, 73, 0.15)",
                      }}
                    />
                    <div style={{ flex: 1, color: "#f85149", zIndex: 1 }}>
                      ${ask.price.toFixed(2)}
                    </div>
                    <div style={{ flex: 1, textAlign: "center", color: "#c9d1d9", zIndex: 1 }}>
                      {(isFlickering ? ask.size + 500 : ask.size).toLocaleString()}
                    </div>
                    <div style={{ flex: 1, textAlign: "right", color: "#8b949e", zIndex: 1 }}>
                      {ask.total.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              {/* Current price */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "10px 16px",
                  background: "#21262d",
                  borderTop: "1px solid #30363d",
                  borderBottom: "1px solid #30363d",
                }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: priceFlicker ? "#3fb950" : "#58a6ff",
                    fontFamily: "monospace",
                  }}
                >
                  $0.67
                </span>
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 13,
                    color: "#3fb950",
                    fontFamily: "monospace",
                  }}
                >
                  +2.3%
                </span>
              </div>

              {/* Bids (buys) - green */}
              {ORDERBOOK_BIDS.map((bid, i) => {
                const rowDelay = 18 + i * 3;
                const rowOpacity = interpolate(frame, [rowDelay, rowDelay + 8], [0, 1], {
                  extrapolateRight: "clamp",
                });
                const depthWidth = (bid.total / 55000) * 100;
                const isFlickering = i === 1 && priceFlicker;

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      padding: "6px 16px",
                      position: "relative",
                      opacity: rowOpacity,
                      fontFamily: "monospace",
                      fontSize: 13,
                      background: isFlickering ? "rgba(63, 185, 80, 0.1)" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${depthWidth}%`,
                        background: "rgba(63, 185, 80, 0.15)",
                      }}
                    />
                    <div style={{ flex: 1, color: "#3fb950", zIndex: 1 }}>
                      ${bid.price.toFixed(2)}
                    </div>
                    <div style={{ flex: 1, textAlign: "center", color: "#c9d1d9", zIndex: 1 }}>
                      {(isFlickering ? bid.size - 300 : bid.size).toLocaleString()}
                    </div>
                    <div style={{ flex: 1, textAlign: "right", color: "#8b949e", zIndex: 1 }}>
                      {bid.total.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Animated cursor */}
      {cursorVisible && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            width: 20,
            height: 20,
            zIndex: 100,
          }}
        >
          <svg viewBox="0 0 24 24" fill="white" style={{ filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.5))" }}>
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 4.702z" />
          </svg>
        </div>
      )}

      {/* "Boring..." text */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: `translateX(-50%) scale(${boringScale})`,
          opacity: boringOpacity * (1 - glitchIntensity),
          zIndex: 200,
        }}
      >
        <PixelText size={32} color="#8b949e">
          Boring... 😴
        </PixelText>
      </div>

      {/* Glitch overlay */}
      {glitchPhase && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255, 0, 0, 0.15)",
              transform: `translateX(${rgbSplit}px)`,
              mixBlendMode: "screen",
              opacity: glitchIntensity * 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 255, 255, 0.15)",
              transform: `translateX(-${rgbSplit}px)`,
              mixBlendMode: "screen",
              opacity: glitchIntensity * 0.6,
            }}
          />

          {/* Scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.4) 2px,
                rgba(0, 0, 0, 0.4) 4px
              )`,
              opacity: glitchIntensity * 0.8,
            }}
          />

          {/* Glitch bars */}
          {[...Array(5)].map((_, i) => {
            const barY = (frame * 3 + i * 200) % 1100;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: barY,
                  height: 4 + (i % 3) * 4,
                  background: `rgba(${i % 2 === 0 ? "255,0,0" : "0,255,255"}, 0.3)`,
                  opacity: glitchIntensity * 0.7,
                }}
              />
            );
          })}

          {/* Flash to white */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "white",
              opacity: interpolate(frame, [115, 120], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

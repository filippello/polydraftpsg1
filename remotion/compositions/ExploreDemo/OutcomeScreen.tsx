import React from "react";
import { Img, interpolate, staticFile } from "remotion";

interface OutcomeScreenProps {
  marketTitle: string;
  marketCategory: string;
  outcomeLabel: string;
  probability: string;
  outcomeImage: string;
  current: number;
  total: number;
  /** "right" = YES, "left" = NO, "down" = PASS, null = idle */
  swipeDir: "right" | "left" | "down" | null;
  /** 0-1 swipe animation progress */
  swipeProgress: number;
  /** Show a bet-confirmed badge */
  showConfirm?: boolean;
  confirmProgress?: number;
}

export const OutcomeScreen: React.FC<OutcomeScreenProps> = ({
  marketTitle,
  marketCategory,
  outcomeLabel,
  probability,
  outcomeImage,
  current,
  total,
  swipeDir,
  swipeProgress,
  showConfirm = false,
  confirmProgress = 0,
}) => {
  // Card animation
  const cardX =
    swipeDir === "right"
      ? interpolate(swipeProgress, [0, 1], [0, 400])
      : swipeDir === "left"
        ? interpolate(swipeProgress, [0, 1], [0, -400])
        : 0;
  const cardY =
    swipeDir === "down"
      ? interpolate(swipeProgress, [0, 1], [0, 500])
      : 0;
  const cardRotate =
    swipeDir === "right"
      ? interpolate(swipeProgress, [0, 1], [0, 15])
      : swipeDir === "left"
        ? interpolate(swipeProgress, [0, 1], [0, -15])
        : 0;
  const cardOpacity =
    swipeDir
      ? interpolate(swipeProgress, [0, 0.6, 1], [1, 1, 0])
      : 1;

  // Overlay opacity
  const overlayOpacity = swipeDir
    ? interpolate(swipeProgress, [0, 0.3], [0, 0.9], {
        extrapolateRight: "clamp",
      })
    : 0;

  const overlayColor =
    swipeDir === "right"
      ? "rgba(34,197,94,0.4)"
      : swipeDir === "left"
        ? "rgba(239,68,68,0.4)"
        : "rgba(107,114,128,0.4)";

  const overlayLabel =
    swipeDir === "right" ? "YES" : swipeDir === "left" ? "NO" : "PASS";
  const overlayLabelColor =
    swipeDir === "right" ? "#22c55e" : swipeDir === "left" ? "#ef4444" : "#6b7280";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1a1a2e",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "48px 12px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "white",
          }}
        >
          ←
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 7,
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontFamily: "system-ui",
            }}
          >
            {marketCategory}
          </div>
          <div
            style={{
              fontSize: 9,
              color: "white",
              fontFamily: "system-ui",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {marketTitle}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: "4px 8px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#a855f7",
              fontFamily: "system-ui",
            }}
          >
            {current}
          </span>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontFamily: "system-ui" }}>/</span>
          <span
            style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: "system-ui" }}
          >
            {total}
          </span>
        </div>
      </div>

      {/* Card area */}
      <div
        style={{
          position: "relative",
          margin: 12,
          flex: 1,
          height: "calc(100% - 160px)",
        }}
      >
        {/* Card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            overflow: "hidden",
            background: "#16213e",
            border: "3px solid rgba(168,85,247,0.4)",
            boxShadow: "6px 6px 0 rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            transform: `translateX(${cardX}px) translateY(${cardY}px) rotate(${cardRotate}deg)`,
            opacity: cardOpacity,
          }}
        >
          {/* Market question */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "2px solid rgba(168,85,247,0.3)",
              background: "rgba(0,0,0,0.3)",
            }}
          >
            <p
              style={{
                fontSize: 8,
                color: "white",
                fontFamily: '"Press Start 2P", monospace',
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {marketTitle}
            </p>
          </div>

          {/* Image */}
          <div
            style={{
              flex: 1,
              position: "relative",
              borderBottom: "4px solid rgba(168,85,247,0.3)",
            }}
          >
            <Img
              src={staticFile(outcomeImage)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* Swipe overlay */}
            {swipeDir && overlayOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: overlayColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: overlayOpacity,
                }}
              >
                <div
                  style={{
                    background: overlayLabelColor,
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: 12,
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 18,
                    fontWeight: 700,
                    border: "3px solid white",
                    boxShadow: "4px 4px 0 rgba(0,0,0,0.4)",
                    transform:
                      swipeDir === "right"
                        ? "rotate(12deg)"
                        : swipeDir === "left"
                          ? "rotate(-12deg)"
                          : "none",
                  }}
                >
                  {overlayLabel}
                </div>
              </div>
            )}
          </div>

          {/* Bottom info */}
          <div style={{ padding: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "white",
                textAlign: "center",
                fontFamily: "system-ui",
                marginBottom: 4,
              }}
            >
              {outcomeLabel}
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#a855f7",
                textAlign: "center",
                fontFamily: '"Press Start 2P", monospace',
                marginBottom: 8,
              }}
            >
              {probability}
            </div>

            {/* Swipe hints */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                fontSize: 9,
                fontFamily: "system-ui",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#ef4444" }}>← NO</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>↓ PASS</span>
              <span style={{ color: "#22c55e" }}>YES →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          paddingBottom: 16,
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background:
                i + 1 === current
                  ? "#a855f7"
                  : i + 1 < current
                    ? "rgba(168,85,247,0.5)"
                    : "rgba(255,255,255,0.15)",
              transform: i + 1 === current ? "scale(1.25)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Bet confirmed overlay — pixel art / gaming style */}
      {showConfirm && confirmProgress > 0 && (() => {
        const pop = interpolate(confirmProgress, [0, 0.15, 0.25], [0, 1.25, 1], { extrapolateRight: "clamp" });
        const fadeAll = interpolate(confirmProgress, [0, 0.1, 0.75, 1], [0, 1, 1, 0]);
        const coinSpin = interpolate(confirmProgress, [0.1, 0.6], [0, 720], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const sparkShow = interpolate(confirmProgress, [0.15, 0.3, 0.7, 0.85], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const textSlide = interpolate(confirmProgress, [0.1, 0.25], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const amountSlide = interpolate(confirmProgress, [0.2, 0.35], [15, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        // Pixel spark positions (8 sparks around center)
        const sparks = Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const dist = interpolate(confirmProgress, [0.15, 0.5], [0, 55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, delay: i * 0.02 };
        });

        return (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: fadeAll,
              zIndex: 50,
            }}
          >
            {/* Pixel sparks */}
            {sparks.map((s, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 6,
                  height: 6,
                  marginTop: -50 + s.y,
                  marginLeft: s.x,
                  background: i % 2 === 0 ? "#ffd700" : "#22c55e",
                  boxShadow: `0 0 8px ${i % 2 === 0 ? "#ffd700" : "#22c55e"}`,
                  opacity: sparkShow,
                  borderRadius: 1,
                }}
              />
            ))}

            {/* Pixel art card frame */}
            <div
              style={{
                transform: `scale(${pop})`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0,
              }}
            >
              {/* Coin with spin */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "linear-gradient(135deg, #ffd700, #f59e0b)",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "4px 4px 0 rgba(0,0,0,0.6), 0 0 25px rgba(255,215,0,0.5)",
                  border: "3px solid #fbbf24",
                  transform: `rotateY(${coinSpin}deg)`,
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 18,
                    color: "#92400e",
                    textShadow: "1px 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  $
                </span>
              </div>

              {/* Main label box — Balatro style hard shadow */}
              <div
                style={{
                  background: "#16213e",
                  border: "3px solid #22c55e",
                  borderRadius: 4,
                  padding: "10px 20px",
                  boxShadow: "5px 5px 0 rgba(0,0,0,0.6), 0 0 20px rgba(34,197,94,0.3)",
                  transform: `translateY(${textSlide}px)`,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 11,
                    color: "#22c55e",
                    textShadow: "0 0 12px rgba(34,197,94,0.6), 3px 3px 0 rgba(0,0,0,0.8)",
                    letterSpacing: "0.1em",
                    lineHeight: 1.6,
                  }}
                >
                  BET PLACED!
                </div>
              </div>

              {/* Amount badge */}
              <div
                style={{
                  marginTop: 10,
                  background: "rgba(255,215,0,0.15)",
                  border: "2px solid rgba(255,215,0,0.4)",
                  borderRadius: 4,
                  padding: "5px 14px",
                  boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
                  transform: `translateY(${amountSlide}px)`,
                  opacity: interpolate(confirmProgress, [0.2, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                <span
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: 8,
                    color: "#ffd700",
                    textShadow: "2px 2px 0 rgba(0,0,0,0.8)",
                  }}
                >
                  $5 ON YES
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

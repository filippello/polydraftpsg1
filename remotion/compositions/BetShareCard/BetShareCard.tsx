import React from "react";
import { Img, AbsoluteFill } from "remotion";
import { PixelText, loadFonts } from "../../components/PixelFont";

// Load fonts on mount
loadFonts();

export interface BetShareCardProps {
  outcome?: string;
  probability?: number;
  direction?: "yes" | "no";
  market?: string;
  amount?: number;
  imageUrl?: string;
}

// Default values for the composition
const defaultProps: Required<Pick<BetShareCardProps, 'outcome' | 'probability' | 'direction' | 'market'>> = {
  outcome: "JD Vance",
  probability: 0.25,
  direction: "yes",
  market: "Presidential Election 2028",
};

function getCategoryEmoji(market: string): string {
  const lower = market.toLowerCase();
  if (lower.includes("sport") || lower.includes("nba") || lower.includes("nfl") || lower.includes("soccer")) return "⚽";
  if (lower.includes("politic") || lower.includes("election") || lower.includes("president")) return "🗳️";
  if (lower.includes("crypto") || lower.includes("bitcoin") || lower.includes("ethereum")) return "₿";
  if (lower.includes("econ") || lower.includes("finance") || lower.includes("stock")) return "📈";
  if (lower.includes("entertain") || lower.includes("oscar") || lower.includes("movie")) return "🎬";
  if (lower.includes("tech") || lower.includes("ai")) return "💻";
  if (lower.includes("business") || lower.includes("m&a")) return "🏢";
  return "🎯";
}

export const BetShareCard: React.FC<BetShareCardProps> = ({
  outcome = defaultProps.outcome,
  probability = defaultProps.probability,
  direction = defaultProps.direction,
  market = defaultProps.market,
  amount,
  imageUrl,
}) => {
  const isYes = direction === "yes";
  const borderColor = isYes ? "#22c55e" : "#ef4444";
  const badgeColor = isYes ? "#22c55e" : "#ef4444";
  const badgeText = isYes ? "YES" : "NO";
  const percentText = `${Math.round(probability * 100)}%`;

  // Progress bar width (max 80% of container)
  const progressWidth = Math.min(probability * 80, 80);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%)",
        padding: 40,
      }}
    >
      {/* Border frame */}
      <div
        style={{
          position: "absolute",
          inset: 20,
          border: `8px solid ${borderColor}`,
          borderRadius: 32,
          boxShadow: `0 0 60px ${borderColor}40, inset 0 0 60px ${borderColor}10`,
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 40,
        }}
      >
        {/* Top section: Image + Outcome info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            flex: 1,
          }}
        >
          {/* Outcome image */}
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: 20,
              overflow: "hidden",
              border: `4px solid ${borderColor}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${borderColor}30`,
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {imageUrl ? (
              <Img
                src={imageUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span style={{ fontSize: 80 }}>{getCategoryEmoji(market)}</span>
            )}
          </div>

          {/* Outcome details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              flex: 1,
            }}
          >
            {/* Outcome name */}
            <PixelText size={42} color="white" shadow>
              {outcome.toUpperCase()}
            </PixelText>

            {/* Probability bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 32,
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: `${progressWidth}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${borderColor}, ${borderColor}99)`,
                    borderRadius: 16,
                    boxShadow: `0 0 20px ${borderColor}60`,
                  }}
                />
              </div>
              <PixelText size={36} color={borderColor} shadow>
                {percentText}
              </PixelText>
            </div>
          </div>
        </div>

        {/* Market name */}
        <div
          style={{
            textAlign: "center",
            marginTop: 20,
            marginBottom: 20,
          }}
        >
          <PixelText size={24} color="#94a3b8">
            {market}
          </PixelText>
        </div>

        {/* Bet badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 48px",
              background: badgeColor,
              borderRadius: 16,
              boxShadow: `0 8px 32px ${badgeColor}60, 6px 6px 0 rgba(0,0,0,0.4)`,
              border: "4px solid white",
            }}
          >
            <PixelText size={28} color="white" shadow>
              BET {badgeText}
            </PixelText>
            {isYes ? (
              <span style={{ fontSize: 28 }}>✓</span>
            ) : (
              <span style={{ fontSize: 28 }}>✕</span>
            )}
            {amount && (
              <PixelText size={28} color="white" shadow>
                ${amount}
              </PixelText>
            )}
          </div>
        </div>

        {/* Footer with branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
          }}
        >
          <PixelText size={20} color="#6b7280">
            polydraft.app
          </PixelText>
        </div>
      </div>
    </AbsoluteFill>
  );
};

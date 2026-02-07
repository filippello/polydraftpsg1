import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";

interface MarketCard {
  title: string;
  image: string;
  emoji: string;
  category: string;
}

const MARKETS: MarketCard[] = [
  {
    title: "US Presidential Election 2028",
    image: "images/explore/events/presidential-election-winner-2028.png",
    emoji: "🗳️",
    category: "Politics",
  },
  {
    title: "UEFA Champions League Winner",
    image: "images/explore/events/uefa-champions-league-winner.png",
    emoji: "⚽",
    category: "Sports",
  },
  {
    title: "Fed Decision March 2026",
    image: "images/explore/events/fed-decision-march-2026.png",
    emoji: "📈",
    category: "Economy",
  },
  {
    title: "Russia Ukraine Ceasefire",
    image: "images/explore/events/russia-ukraine-ceasefire.jpeg",
    emoji: "🌍",
    category: "Geopolitics",
  },
  {
    title: "MicroStrategy Bitcoin",
    image: "images/explore/events/microstrategy-bitcoin.png",
    emoji: "₿",
    category: "Crypto",
  },
  {
    title: "US Strikes Iran",
    image: "images/explore/events/us-strikes-iran.png",
    emoji: "🌍",
    category: "Geopolitics",
  },
];

interface GridScreenProps {
  /** Which card index to highlight (cursor tap animation) */
  highlightIndex?: number;
  /** 0-1 progress of the tap animation */
  tapProgress?: number;
  /** 0-1 zoom transition into the highlighted card */
  zoomProgress?: number;
}

export const GridScreen: React.FC<GridScreenProps> = ({
  highlightIndex,
  tapProgress = 0,
  zoomProgress = 0,
}) => {
  const frame = useCurrentFrame();

  const cardH = 140;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#1a1a2e",
        overflow: "hidden",
        position: "relative",
        transform: zoomProgress > 0
          ? `scale(${1 + zoomProgress * 0.3})`
          : undefined,
        opacity: zoomProgress > 0.8 ? interpolate(zoomProgress, [0.8, 1], [1, 0]) : 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "48px 14px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          ←
        </div>
        <span
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: 11,
            color: "white",
            letterSpacing: "0.05em",
          }}
        >
          EXPLORE
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontSize: 8,
            color: "#a855f7",
            background: "rgba(168,85,247,0.2)",
            padding: "3px 6px",
            borderRadius: 4,
            fontFamily: "system-ui",
          }}
        >
          Jupiter
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          padding: "12px 10px",
        }}
      >
        {MARKETS.map((market, i) => {
          const isHighlighted = highlightIndex === i;
          const scale = isHighlighted && tapProgress > 0
            ? interpolate(tapProgress, [0, 0.5, 1], [1, 0.95, 1])
            : 1;
          const glow = isHighlighted && tapProgress > 0.3;

          return (
            <div
              key={i}
              style={{
                width: "calc(50% - 4px)",
                height: cardH,
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
                transform: `scale(${scale})`,
                boxShadow: glow
                  ? "0 0 20px rgba(168,85,247,0.6)"
                  : "0 4px 12px rgba(0,0,0,0.3)",
                border: glow ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.08)",
                transition: "box-shadow 0.1s",
              }}
            >
              <Img
                src={staticFile(market.image)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "60%",
                  background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
                }}
              />
              {/* Category badge */}
              <div
                style={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  fontSize: 7,
                  color: "white",
                  background: "rgba(0,0,0,0.6)",
                  padding: "2px 5px",
                  borderRadius: 4,
                  fontFamily: "system-ui",
                  fontWeight: 600,
                }}
              >
                {market.emoji} {market.category}
              </div>
              {/* Title */}
              <div
                style={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  right: 6,
                  fontSize: 8,
                  color: "white",
                  fontFamily: "system-ui",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}
              >
                {market.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

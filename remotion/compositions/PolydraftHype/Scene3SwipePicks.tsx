import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { GameCard } from "../../components/GameCard";
import { PixelText } from "../../components/PixelFont";

const SWIPE_CARDS = [
  {
    title: "Argentina vs Brazil",
    teamA: "Argentina",
    teamB: "Brazil",
    oddsA: "45%",
    oddsB: "55%",
    rarity: "epic" as const,
    image: "images/events/argentina-brazil.png",
    swipeDir: "right" as const,
  },
  {
    title: "Lakers vs Celtics",
    teamA: "Lakers",
    teamB: "Celtics",
    oddsA: "48%",
    oddsB: "52%",
    rarity: "rare" as const,
    image: "images/events/lakers-celtics.png",
    swipeDir: "left" as const,
  },
  {
    title: "Verstappen F1 Win",
    teamA: "Yes",
    teamB: "No",
    oddsA: "35%",
    oddsB: "65%",
    rarity: "legendary" as const,
    image: "images/events/verstappen-f1.png",
    swipeDir: "right" as const,
  },
];

export const Scene3SwipePicks: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing: 155 frames (~5 seconds)
  // Card 1: 0-50 (swipe at 40)
  // Card 2: 50-100 (swipe at 90)
  // Card 3: 100-155 (swipe at 140)

  const getCardState = (cardIndex: number) => {
    const cardStart = cardIndex * 50;
    const swipeStart = cardStart + 40;

    if (frame < cardStart) {
      return { visible: false, swipeProgress: 0, swipeDir: null };
    }

    if (frame >= swipeStart) {
      const swipeProgress = interpolate(
        frame,
        [swipeStart, swipeStart + 12],
        [0, 1],
        { extrapolateRight: "clamp" }
      );
      return {
        visible: true,
        swipeProgress,
        swipeDir: SWIPE_CARDS[cardIndex].swipeDir,
      };
    }

    return { visible: true, swipeProgress: 0, swipeDir: null };
  };

  // Progress dots
  const completedPicks =
    frame >= 52 ? (frame >= 102 ? (frame >= 152 ? 3 : 2) : 1) : 0;

  // Background gradient based on last swipe
  const bgColor =
    frame >= 140
      ? "rgba(59, 130, 246, 0.15)"
      : frame >= 90
        ? "rgba(239, 68, 68, 0.15)"
        : frame >= 40
          ? "rgba(59, 130, 246, 0.15)"
          : "transparent";

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, #1a1a2e 0%, ${bgColor} 50%, #1a1a2e 100%)`,
      }}
    >
      {/* Cards stack - FULL SCREEN */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {SWIPE_CARDS.map((card, i) => {
          const state = getCardState(i);
          if (!state.visible || state.swipeProgress >= 1) return null;

          // Stack effect - cards behind are slightly smaller and offset
          const stackIndex = SWIPE_CARDS.filter((_, j) => {
            const s = getCardState(j);
            return j > i && s.visible && s.swipeProgress < 1;
          }).length;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${1 - stackIndex * 0.05}) translateY(${stackIndex * 8}px)`,
                zIndex: 10 - stackIndex,
              }}
            >
              <GameCard
                title={card.title}
                teamA={card.teamA}
                teamB={card.teamB}
                oddsA={card.oddsA}
                oddsB={card.oddsB}
                rarity={card.rarity}
                image={card.image}
                scale={1.5}
                swipeDirection={state.swipeDir}
                swipeProgress={state.swipeProgress}
              />
            </div>
          );
        }).reverse()}
      </div>

      {/* Progress dots */}
      <div
        style={{
          position: "absolute",
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 16,
        }}
      >
        {[0, 1, 2].map((i) => {
          const isCompleted = i < completedPicks;
          const isCurrent = i === completedPicks && completedPicks < 3;

          return (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: isCompleted
                  ? "#22c55e"
                  : isCurrent
                    ? "#ffd700"
                    : "rgba(255, 255, 255, 0.3)",
                boxShadow: isCurrent ? "0 0 15px #ffd700" : "none",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            />
          );
        })}
      </div>

      {/* Picked cards summary at bottom */}
      {completedPicks > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "3%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 12,
          }}
        >
          {SWIPE_CARDS.slice(0, completedPicks).map((card, i) => (
            <div
              key={i}
              style={{
                padding: "10px 18px",
                background:
                  card.swipeDir === "right"
                    ? "rgba(59, 130, 246, 0.5)"
                    : "rgba(239, 68, 68, 0.5)",
                border: `3px solid ${card.swipeDir === "right" ? "#3b82f6" : "#ef4444"}`,
                borderRadius: 10,
                boxShadow: "4px 4px 0 rgba(0,0,0,0.5)",
              }}
            >
              <PixelText size={12} color="white">
                {card.swipeDir === "right" ? card.teamA : card.teamB}
              </PixelText>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

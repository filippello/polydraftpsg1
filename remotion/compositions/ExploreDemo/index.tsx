import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PhoneMockup } from "../../components/PhoneMockup";
import { PixelText } from "../../components/PixelFont";
import { GridScreen } from "./GridScreen";
import { OutcomeScreen } from "./OutcomeScreen";

// ═══════════════════════════════════════════════════════════════
// ExploreDemo — 750 frames = 25s @ 30fps  (1080x1080 for X)
// "Tinder for Polymarket" narrative
//
// INTRO
//   0-25     Purple flash + scanlines
//   25-65    Logo slam w/ bounce + particles
//   65-90    "TINDER" slam (pink #FE3C72, from right)
//   85-130   "FOR POLYMARKET" slam (white, from left)
//   120-140  Purple transition flash
//
// PHONE DEMO
//   130-155  Phone entrance (bounce up)
//   155-250  Grid → tap US Election  ("CHOOSE YOUR EVENT" big label 155-195)
//   250-335  US Election — AOC → PASS  ("SWIPE CANDIDATES" big label 255-290)
//   335-450  US Election — JD Vance → YES → BET PLACED  ("MATCH YOUR BETS" big label 340-375)
//   450-510  Back to Grid → tap UEFA
//   510-610  UEFA — Barcelona → YES → BET PLACED
//
// CTA
//   610-750  Swipe. Match. Win. → polydraft.app → "Tinder for Polymarket."
// ═══════════════════════════════════════════════════════════════

const PHONE_ENTER = 130;
const PHONE_SCALE = 1.22;

// Particles data (pre-computed random positions)
const PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  x: (i * 137.5) % 100,
  y: (i * 213.7) % 100,
  size: 3 + (i % 4) * 2,
  speed: 0.3 + (i % 5) * 0.15,
  hue: [270, 280, 320, 45, 160][i % 5],
}));

// Scanline overlay
const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,${opacity}) 2px,
        rgba(0,0,0,${opacity}) 4px
      )`,
      pointerEvents: "none",
      zIndex: 900,
    }}
  />
);

// Floating pixel particles background
const FloatingPixels: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {PARTICLES.map((p, i) => {
        const yOff = (frame * p.speed) % 120;
        const floatX = Math.sin(frame * 0.02 + i) * 15;
        const particleOpacity = interpolate(
          (yOff + i * 10) % 120,
          [0, 30, 90, 120],
          [0, 0.6, 0.6, 0]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x + floatX * 0.1}%`,
              top: `${p.y - yOff * 0.8}%`,
              width: p.size,
              height: p.size,
              background: `hsla(${p.hue}, 80%, 65%, ${particleOpacity})`,
              boxShadow: `0 0 ${p.size * 2}px hsla(${p.hue}, 80%, 65%, 0.4)`,
              borderRadius: 1,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

// ScreenShake helper
const withShake = (
  frame: number,
  shakeStart: number,
  shakeDuration: number,
  intensity: number
) => {
  if (frame < shakeStart || frame > shakeStart + shakeDuration) {
    return { x: 0, y: 0 };
  }
  const t = frame - shakeStart;
  const decay = interpolate(t, [0, shakeDuration], [1, 0]);
  return {
    x: Math.sin(t * 2.5) * intensity * decay,
    y: Math.cos(t * 3.1) * intensity * 0.6 * decay,
  };
};

export const ExploreDemo: React.FC = () => {
  const frame = useCurrentFrame();

  // Global screen shake
  const shake1 = withShake(frame, 25, 15, 12);
  const shake2 = withShake(frame, 65, 10, 10);
  const shake3 = withShake(frame, 85, 10, 10);
  const shakeX = shake1.x + shake2.x + shake3.x;
  const shakeY = shake1.y + shake2.y + shake3.y;

  // ── Scenes ─────────────────────────────────────────────────
  const isIntro = frame < PHONE_ENTER;
  const phoneVisible = frame >= PHONE_ENTER && frame < 610;
  const isCTA = frame >= 610;

  const isGrid1 = frame >= PHONE_ENTER && frame < 250;
  const isOutcomeAOC = frame >= 250 && frame < 335;
  const isOutcomeVance = frame >= 335 && frame < 450;
  const isGrid2 = frame >= 450 && frame < 510;
  const isOutcomeBarcelona = frame >= 510 && frame < 610;

  // ── Phone entrance ─────────────────────────────────────────
  const phoneY = phoneVisible
    ? interpolate(frame, [PHONE_ENTER, PHONE_ENTER + 18], [300, 0], {
        extrapolateRight: "clamp",
      })
    : 300;
  const phoneBounce = phoneVisible
    ? interpolate(
        frame,
        [PHONE_ENTER + 18, PHONE_ENTER + 22, PHONE_ENTER + 26],
        [0, -12, 0],
        { extrapolateRight: "clamp" }
      )
    : 0;
  const phoneOpacity = phoneVisible
    ? interpolate(frame, [PHONE_ENTER, PHONE_ENTER + 8], [0, 1], {
        extrapolateRight: "clamp",
      })
    : 0;

  // ── Context labels (big, centered overlay) ────────────────
  // All three labels slam in large over the phone and fade out quickly.
  const bigLabel =
    frame >= 155 && frame < 195
      ? "CHOOSE YOUR EVENT"
      : frame >= 255 && frame < 290
        ? "SWIPE CANDIDATES"
        : frame >= 340 && frame < 375
          ? "MATCH YOUR BETS"
          : null;

  const bigLabelOpacity = bigLabel
    ? frame >= 155 && frame < 195
      ? interpolate(frame, [155, 160, 183, 195], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : frame >= 255 && frame < 290
        ? interpolate(frame, [255, 260, 278, 290], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : interpolate(frame, [340, 345, 363, 375], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
    : 0;

  const bigLabelScale = bigLabel
    ? frame >= 155 && frame < 195
      ? interpolate(frame, [155, 162], [1.6, 1], {
          extrapolateRight: "clamp",
        })
      : frame >= 255 && frame < 290
        ? interpolate(frame, [255, 262], [1.6, 1], {
            extrapolateRight: "clamp",
          })
        : interpolate(frame, [340, 347], [1.6, 1], {
            extrapolateRight: "clamp",
          })
    : 1;

  // ── Phone content ──────────────────────────────────────────
  const renderPhoneContent = () => {
    if (isGrid1) {
      const localFrame = frame - PHONE_ENTER;
      const tapStart = 25;
      const tapProg =
        localFrame >= tapStart
          ? interpolate(localFrame, [tapStart, tapStart + 20], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      const zoomProg =
        localFrame >= tapStart + 20
          ? interpolate(localFrame, [tapStart + 20, tapStart + 35], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      return (
        <GridScreen
          highlightIndex={localFrame >= tapStart ? 0 : undefined}
          tapProgress={tapProg}
          zoomProgress={zoomProg}
        />
      );
    }

    if (isOutcomeAOC) {
      const localFrame = frame - 250;
      const swipeStart = 55;
      const swipeProg =
        localFrame >= swipeStart
          ? interpolate(localFrame, [swipeStart, swipeStart + 18], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      return (
        <OutcomeScreen
          marketTitle="US Presidential Election 2028"
          marketCategory="Politics"
          outcomeLabel="Alexandria Ocasio-Cortez"
          probability="7%"
          outcomeImage="images/explore/outcomes/presidential-election-winner-2028-aoc.jpg"
          current={1}
          total={3}
          swipeDir={localFrame >= swipeStart ? "down" : null}
          swipeProgress={swipeProg}
        />
      );
    }

    if (isOutcomeVance) {
      const localFrame = frame - 335;
      const swipeStart = 55;
      const swipeProg =
        localFrame >= swipeStart
          ? interpolate(localFrame, [swipeStart, swipeStart + 18], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      const confirmStart = 73;
      const showConfirm = localFrame >= confirmStart;
      const confirmProg = showConfirm
        ? interpolate(localFrame, [confirmStart, confirmStart + 45], [0, 1], {
            extrapolateRight: "clamp",
          })
        : 0;
      return (
        <OutcomeScreen
          marketTitle="US Presidential Election 2028"
          marketCategory="Politics"
          outcomeLabel="JD Vance"
          probability="25%"
          outcomeImage="images/explore/outcomes/presidential-election-winner-2028-jd-vance.jpg"
          current={2}
          total={3}
          swipeDir={localFrame >= swipeStart ? "right" : null}
          swipeProgress={swipeProg}
          showConfirm={showConfirm}
          confirmProgress={confirmProg}
        />
      );
    }

    if (isGrid2) {
      const localFrame = frame - 450;
      const tapStart = 30;
      const tapProg =
        localFrame >= tapStart
          ? interpolate(localFrame, [tapStart, tapStart + 20], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      const zoomProg =
        localFrame >= tapStart + 20
          ? interpolate(localFrame, [tapStart + 20, tapStart + 35], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      return (
        <GridScreen
          highlightIndex={localFrame >= tapStart ? 1 : undefined}
          tapProgress={tapProg}
          zoomProgress={zoomProg}
        />
      );
    }

    if (isOutcomeBarcelona) {
      const localFrame = frame - 510;
      const swipeStart = 50;
      const swipeProg =
        localFrame >= swipeStart
          ? interpolate(localFrame, [swipeStart, swipeStart + 18], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 0;
      const confirmStart = 68;
      const showConfirm = localFrame >= confirmStart;
      const confirmProg = showConfirm
        ? interpolate(localFrame, [confirmStart, confirmStart + 45], [0, 1], {
            extrapolateRight: "clamp",
          })
        : 0;
      return (
        <OutcomeScreen
          marketTitle="UEFA Champions League Winner"
          marketCategory="Sports"
          outcomeLabel="FC Barcelona"
          probability="18%"
          outcomeImage="images/explore/outcomes/uefa-champions-league-winner-Barcelona.png"
          current={1}
          total={4}
          swipeDir={localFrame >= swipeStart ? "right" : null}
          swipeProgress={swipeProg}
          showConfirm={showConfirm}
          confirmProgress={confirmProg}
        />
      );
    }

    return null;
  };

  // ── Intro animations ───────────────────────────────────────
  const logoScale = interpolate(frame, [25, 30, 35], [3, 0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoOpacity = interpolate(frame, [25, 30, 110, 125], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const haveFunX = interpolate(frame, [65, 70], [600, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const haveFunOpacity = interpolate(frame, [65, 68, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const whileBetX = interpolate(frame, [85, 90], [-600, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const whileBetOpacity = interpolate(frame, [85, 88, 110, 120], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashOpacity = interpolate(frame, [0, 8, 18, 25], [0, 0.9, 0.9, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "#0a0a18",
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
        rel="stylesheet"
      />

      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: -20,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(168,85,247,0.06) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <FloatingPixels />

      {/* ── INTRO: Purple flash ─────────────────────────── */}
      {frame < 30 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, #a855f7, #4c1d95)",
            opacity: flashOpacity,
            zIndex: 600,
          }}
        />
      )}

      {/* ── INTRO: Logo slam ────────────────────────────── */}
      {isIntro && frame >= 25 && (
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${logoScale})`,
            opacity: logoOpacity,
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, #a855f7, #7c3aed)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "6px 6px 0 rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.5)",
            }}
          >
            <PixelText size={28} color="white">
              P
            </PixelText>
          </div>
          <PixelText size={26} color="white">
            Poly<span style={{ color: "#a855f7" }}>draft</span>
          </PixelText>
        </div>
      )}

      {/* ── INTRO: "TINDER" ─────────────────────────────── */}
      {isIntro && frame >= 65 && (
        <div
          style={{
            position: "absolute",
            top: "48%",
            left: "50%",
            transform: `translate(calc(-50% + ${haveFunX}px), -50%)`,
            opacity: haveFunOpacity,
            zIndex: 100,
            whiteSpace: "nowrap",
          }}
        >
          <PixelText size={42} color="#FE3C72" glow="#FE3C72">
            TINDER
          </PixelText>
        </div>
      )}

      {/* ── INTRO: "FOR POLYMARKET" ──────────────────────── */}
      {isIntro && frame >= 85 && (
        <div
          style={{
            position: "absolute",
            top: "62%",
            left: "50%",
            transform: `translate(calc(-50% + ${whileBetX}px), -50%)`,
            opacity: whileBetOpacity,
            zIndex: 100,
            whiteSpace: "nowrap",
          }}
        >
          <PixelText size={28} color="white">
            FOR POLYMARKET
          </PixelText>
        </div>
      )}

      {/* ── INTRO → PHONE transition: purple flash ──────── */}
      {frame >= 120 && frame <= 140 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle, rgba(168,85,247,0.9), rgba(88,28,135,0.9))",
            opacity: interpolate(frame, [120, 127, 135, 140], [0, 0.9, 0.9, 0]),
            zIndex: 500,
          }}
        />
      )}

      {/* ── PHONE MOCKUP ────────────────────────────────── */}
      {phoneVisible && (
        <>
          {/* Small logo — top left corner */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 24,
              zIndex: 50,
              opacity: interpolate(
                frame,
                [PHONE_ENTER + 22, PHONE_ENTER + 35],
                [0, 1],
                { extrapolateRight: "clamp" }
              ),
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "3px 3px 0 rgba(0,0,0,0.4)",
              }}
            >
              <PixelText size={12} color="white">
                P
              </PixelText>
            </div>
            <PixelText size={10} color="white">
              Poly<span style={{ color: "#a855f7" }}>draft</span>
            </PixelText>
          </div>

          {/* Phone */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translateY(${phoneY + phoneBounce}px)`,
              opacity: phoneOpacity,
              zIndex: 10,
            }}
          >
            <PhoneMockup scale={PHONE_SCALE} floating={false}>
              {renderPhoneContent()}
            </PhoneMockup>
          </div>

          {/* Dark scrim behind label for contrast */}
          {bigLabel && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                opacity: bigLabelOpacity,
                zIndex: 190,
              }}
            />
          )}

          {/* Big overlay labels — centered over phone */}
          {bigLabel && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${bigLabelScale})`,
                opacity: bigLabelOpacity,
                zIndex: 200,
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              <PixelText size={34} color="white" glow="rgba(255,255,255,0.6)">
                {bigLabel}
              </PixelText>
            </div>
          )}
        </>
      )}

      {/* ── Scene transition flashes ────────────────────── */}
      {/* Grid → AOC */}
      {frame >= 245 && frame <= 255 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: interpolate(frame, [245, 248, 252, 255], [0, 0.5, 0.5, 0]),
            zIndex: 500,
          }}
        />
      )}
      {/* AOC → Vance */}
      {frame >= 330 && frame <= 340 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: interpolate(frame, [330, 333, 337, 340], [0, 0.4, 0.4, 0]),
            zIndex: 500,
          }}
        />
      )}
      {/* Vance → Grid2 */}
      {frame >= 445 && frame <= 455 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: interpolate(frame, [445, 448, 452, 455], [0, 0.4, 0.4, 0]),
            zIndex: 500,
          }}
        />
      )}
      {/* Grid2 → Barcelona */}
      {frame >= 505 && frame <= 515 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "white",
            opacity: interpolate(frame, [505, 508, 512, 515], [0, 0.5, 0.5, 0]),
            zIndex: 500,
          }}
        />
      )}

      {/* Phone exit → CTA: purple flash */}
      {frame >= 605 && frame <= 620 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#a855f7",
            opacity: interpolate(frame, [605, 610, 615, 620], [0, 0.85, 0.85, 0]),
            zIndex: 500,
          }}
        />
      )}

      {/* ── CTA ENDING ──────────────────────────────────── */}
      {isCTA && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: interpolate(frame, [615, 630], [0, 1], {
              extrapolateRight: "clamp",
            }),
            zIndex: 100,
          }}
        >
          {/* Swipe */}
          <div
            style={{
              marginBottom: 30,
              transform: `scale(${interpolate(frame, [620, 630], [2, 1], { extrapolateRight: "clamp" })})`,
              opacity: interpolate(frame, [620, 628], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <PixelText size={36} color="#FE3C72" glow="#FE3C72">
              SWIPE.
            </PixelText>
          </div>

          {/* Match */}
          <div
            style={{
              marginBottom: 30,
              transform: `scale(${interpolate(frame, [640, 650], [2, 1], { extrapolateRight: "clamp" })})`,
              opacity: interpolate(frame, [640, 648], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <PixelText size={36} color="#22c55e" glow="#22c55e">
              MATCH.
            </PixelText>
          </div>

          {/* Win */}
          <div
            style={{
              marginBottom: 40,
              transform: `scale(${interpolate(frame, [660, 670], [2, 1], { extrapolateRight: "clamp" })})`,
              opacity: interpolate(frame, [660, 668], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <PixelText size={36} color="#ffd700" glow="#ffd700">
              WIN.
            </PixelText>
          </div>

          {/* polydraft.app button */}
          <div
            style={{
              opacity: interpolate(frame, [680, 693], [0, 1], {
                extrapolateRight: "clamp",
              }),
              transform: `scale(${interpolate(frame, [680, 695], [0.7, 1], { extrapolateRight: "clamp" })})`,
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #a855f7, #7c3aed)",
                padding: "22px 50px",
                borderRadius: 16,
                boxShadow:
                  "8px 8px 0 rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.5)",
              }}
            >
              <PixelText size={16} color="white">
                polydraft.app
              </PixelText>
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              marginTop: 35,
              opacity: interpolate(frame, [700, 713], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <PixelText size={9} color="rgba(255,255,255,0.5)">
              Tinder for Polymarket.
            </PixelText>
          </div>
        </div>
      )}

      {/* Scanlines */}
      <Scanlines opacity={0.04} />
    </AbsoluteFill>
  );
};

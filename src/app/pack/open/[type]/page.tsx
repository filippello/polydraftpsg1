'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { PackSprite } from '@/components/sprites/PackSprite';
import { SwipeCard } from '@/components/game/SwipeCard';
import { useCurrentPackStore, useMyPacksStore, useSessionStore } from '@/stores';
import {
  calculateMaxPotentialPoints,
  calculateCombinedProbability,
  formatProbability,
} from '@/lib/scoring/calculator';
import { getEventsForPack } from '@/lib/pools';
import {
  getEventRarity,
  getRarityConfig,
} from '@/lib/rarity';
import type { Event, Outcome, UserPack, UserPick } from '@/types';

type Phase = 'opening' | 'revealing' | 'swiping' | 'confirming';

interface PickedEvent {
  event: Event;
  outcome: Outcome;
}

export default function PackOpeningPage({ params }: { params: { type: string } }) {
  const { type } = params;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('opening');
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickedEvents, setPickedEvents] = useState<PickedEvent[]>([]);

  // Generate stable pack ID
  const packIdRef = useRef<string>(uuidv4());
  const packId = packIdRef.current;

  // Select events from pool once per session (stable across re-renders)
  const eventsRef = useRef<Event[] | null>(null);
  if (eventsRef.current === null) {
    eventsRef.current = getEventsForPack(type, 5);
  }
  const events = eventsRef.current;

  const { setPack, setDraftPick } = useCurrentPackStore();
  const addPack = useMyPacksStore((state) => state.addPack);
  const markPackSynced = useMyPacksStore((state) => state.markPackSynced);
  const anonymousId = useSessionStore((state) => state.anonymousId);

  // Initialize pack with mock events
  useEffect(() => {
    setPack(
      {
        id: packId,
        user_id: 'anonymous',
        pack_type_id: type,
        opened_at: new Date().toISOString(),
        resolution_status: 'pending',
        current_reveal_index: 0,
        total_points: 0,
        correct_picks: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      events
    );
  }, [type, setPack, packId, events]);

  // Auto-advance from opening to revealing
  useEffect(() => {
    if (phase === 'opening') {
      const timer = setTimeout(() => setPhase('revealing'), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Reveal cards one by one
  useEffect(() => {
    if (phase === 'revealing' && revealedCards.length < events.length) {
      const timer = setTimeout(() => {
        setRevealedCards((prev) => [...prev, prev.length]);
      }, 200);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && revealedCards.length >= events.length) {
      const timer = setTimeout(() => setPhase('swiping'), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, revealedCards]);

  const handleSwipe = (outcome: Outcome) => {
    const event = events[currentIndex];

    // Save pick
    setDraftPick(event.id, outcome);
    setPickedEvents((prev) => [...prev, { event, outcome }]);

    // Move to next or finish
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All picked - go to confirming
      setTimeout(() => setPhase('confirming'), 300);
    }
  };

  // Sync pack to database
  const syncPackToDb = useCallback(async (
    packData: {
      id: string;
      packTypeId: string;
      packTypeSlug: string;
      openedAt: string;
    },
    picksData: Array<{
      id: string;
      eventId: string;
      position: number;
      pickedOutcome: Outcome;
      pickedAt: string;
      probabilitySnapshot: number;
      oppositeProbabilitySnapshot: number;
      drawProbabilitySnapshot?: number;
    }>
  ) => {
    if (!anonymousId) return;

    try {
      const response = await fetch('/api/packs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          anonymousId,
          pack: packData,
          picks: picksData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          markPackSynced(packData.id);
        }
      } else {
        console.error('Failed to sync pack to database:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing pack to database:', error);
      // Pack is still saved locally, will work in local-first mode
    }
  }, [anonymousId, markPackSynced]);

  // Save to myPacks when confirming starts
  useEffect(() => {
    if (phase === 'confirming' && pickedEvents.length === events.length) {
      // Create UserPack object
      const now = new Date().toISOString();
      const userPack: UserPack = {
        id: packId,
        user_id: 'anonymous',
        pack_type_id: type,
        pack_type: {
          id: type,
          slug: type,
          name: type.charAt(0).toUpperCase() + type.slice(1) + ' Pack',
          cards_per_pack: 5,
          eligibility_filters: {},
          is_active: true,
          display_order: 0,
          created_at: now,
          updated_at: now,
        },
        opened_at: now,
        resolution_status: 'pending',
        current_reveal_index: 0,
        total_points: 0,
        correct_picks: 0,
        created_at: now,
        updated_at: now,
      };

      // Create UserPick objects with events
      const userPicks: (UserPick & { event: Event })[] = pickedEvents.map(
        ({ event, outcome }, index) => {
          const probability =
            outcome === 'a'
              ? event.outcome_a_probability
              : outcome === 'b'
                ? event.outcome_b_probability
                : event.outcome_draw_probability ?? 0;
          const oppositeProbability =
            outcome === 'a'
              ? event.outcome_b_probability
              : outcome === 'b'
                ? event.outcome_a_probability
                : 1 - (event.outcome_draw_probability ?? 0);

          // Snapshot draw probability if the event supports draw
          const drawProbabilitySnapshot = event.supports_draw
            ? event.outcome_draw_probability
            : undefined;

          return {
            id: `${packId}-pick-${index + 1}`,
            user_pack_id: packId,
            event_id: event.id,
            event,
            position: index + 1,
            picked_outcome: outcome,
            picked_at: now,
            probability_snapshot: probability,
            opposite_probability_snapshot: oppositeProbability,
            draw_probability_snapshot: drawProbabilitySnapshot,
            is_resolved: false,
            is_correct: undefined,
            resolved_at: undefined,
            points_awarded: 0,
            reveal_animation_played: false,
            created_at: now,
          };
        }
      );

      // Save to myPacks store (local-first)
      addPack(userPack, events, userPicks);

      // Sync to database in background
      syncPackToDb(
        {
          id: packId,
          packTypeId: type,
          packTypeSlug: type,
          openedAt: now,
        },
        userPicks.map((pick) => ({
          id: pick.id,
          eventId: pick.event_id,
          position: pick.position,
          pickedOutcome: pick.picked_outcome,
          pickedAt: pick.picked_at,
          probabilitySnapshot: pick.probability_snapshot,
          oppositeProbabilitySnapshot: pick.opposite_probability_snapshot,
          drawProbabilitySnapshot: pick.draw_probability_snapshot,
        }))
      );
    }
  }, [phase, packId, pickedEvents, type, addPack, events, syncPackToDb]);

  // Calculate jackpot potential
  const jackpotData = pickedEvents.length === events.length
    ? (() => {
        const picks = pickedEvents.map(({ event, outcome }) => ({
          probabilityAtPick:
            outcome === 'a'
              ? event.outcome_a_probability
              : outcome === 'b'
                ? event.outcome_b_probability
                : event.outcome_draw_probability ?? 0,
        }));
        const maxPoints = calculateMaxPotentialPoints(picks);
        const combinedProb = calculateCombinedProbability(picks);
        return { maxPoints, combinedProb };
      })()
    : null;

  const handleLetsGo = () => {
    router.push(`/pack/${packId}`);
  };

  // Get visible cards (current and next)
  const visibleEvents = events.slice(currentIndex, currentIndex + 2);

  return (
    <main className="min-h-screen min-h-dvh bg-game-bg flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Opening Phase */}
        {phase === 'opening' && (
          <motion.div
            key="opening"
            className="flex-1 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
          >
            <motion.div
              animate={{
                rotate: [-2, 2, -2, 2, 0],
                scale: [1, 1.02, 1, 1.02, 1],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
            >
              <PackSprite type={type as 'sports'} size="lg" glowing />
            </motion.div>
            <motion.p
              className="mt-6 text-xl font-bold font-pixel-heading tracking-wider"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              Opening...
            </motion.p>
          </motion.div>
        )}

        {/* Revealing Phase */}
        {phase === 'revealing' && (
          <motion.div
            key="revealing"
            className="flex-1 flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-3 flex-wrap justify-center max-w-sm">
              {events.map((event, index) => {
                const rarity = event.rarityInfo?.rarity ?? getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
                const rarityConfig = getRarityConfig(rarity);
                const showGlow = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';

                return (
                  <motion.div
                    key={event.id}
                    initial={{ scale: 0, rotate: -180, y: -50 }}
                    animate={
                      revealedCards.includes(index)
                        ? { scale: 1, rotate: 0, y: 0 }
                        : { scale: 0, rotate: -180, y: -50 }
                    }
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    <div
                      className="w-14 h-20 bg-game-primary border-2 rounded-lg flex items-center justify-center"
                      style={{
                        borderColor: rarityConfig.hex,
                        boxShadow: showGlow ? `0 0 12px ${rarityConfig.hex}, 0 0 20px ${rarityConfig.hex}60` : undefined,
                      }}
                    >
                      <span className="text-xl">
                        {event.subcategory === 'nba' ? '🏀' :
                         event.subcategory === 'nhl' ? '🏒' :
                         event.subcategory === 'nfl' ? '🏈' :
                         event.subcategory === 'epl' ? '⚽' :
                         event.subcategory === 'f1' ? '🏎️' :
                         event.subcategory === 'laliga' ? '⚽' :
                         event.subcategory === 'ucl' ? '⚽' :
                         event.subcategory === 'mlb' ? '⚾' :
                         event.subcategory === 'tennis' ? '🎾' :
                         event.subcategory === 'international' ? '🌍' : '🎯'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <motion.p
              className="mt-6 text-lg font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {revealedCards.length} / 5 cards
            </motion.p>
          </motion.div>
        )}

        {/* Swiping Phase - Tinder style */}
        {phase === 'swiping' && (
          <motion.div
            key="swiping"
            className="flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Header */}
            <div className="p-4 text-center">
              <h1 className="text-xl font-bold font-pixel-heading text-shadow-balatro tracking-wider">Make Your Picks</h1>
              <p className="text-sm text-gray-400 mt-1">Swipe to choose</p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {events.map((_, index) => (
                <motion.div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index < currentIndex
                      ? 'bg-game-success'
                      : index === currentIndex
                        ? 'bg-game-gold'
                        : 'bg-card-border'
                  }`}
                  animate={index === currentIndex ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              ))}
            </div>

            {/* Card stack */}
            <div className="flex-1 relative px-4 pb-4 min-h-0">
              <div className="relative w-full max-w-sm mx-auto h-full min-h-[450px]">
                <AnimatePresence>
                  {visibleEvents.map((event, index) => (
                    <SwipeCard
                      key={event.id}
                      event={event}
                      position={currentIndex + index + 1}
                      total={events.length}
                      onSwipe={handleSwipe}
                      isTop={index === 0}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Picked summary */}
            {pickedEvents.length > 0 && (
              <motion.div
                className="p-4 border-t border-card-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {pickedEvents.map(({ event, outcome }) => {
                    const rarity = event.rarityInfo?.rarity ?? getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
                    const rarityConfig = getRarityConfig(rarity);
                    const showGlow = rarity !== 'common';

                    const outcomeLabel =
                      outcome === 'a'
                        ? event.outcome_a_label
                        : outcome === 'b'
                          ? event.outcome_b_label
                          : event.outcome_draw_label || 'Draw';

                    const outcomeClasses =
                      outcome === 'a'
                        ? 'bg-outcome-a/20 text-outcome-a'
                        : outcome === 'b'
                          ? 'bg-outcome-b/20 text-outcome-b'
                          : 'bg-gray-500/20 text-gray-400';

                    return (
                      <div
                        key={event.id}
                        className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border-2 ${outcomeClasses}`}
                        style={{
                          borderColor: rarityConfig.hex,
                          boxShadow: showGlow ? `0 0 10px ${rarityConfig.hex}, 0 0 20px ${rarityConfig.hex}50` : undefined,
                        }}
                      >
                        {outcomeLabel}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Confirming Phase - Celebration */}
        {phase === 'confirming' && jackpotData && (
          <motion.div
            key="confirming"
            className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3"
                  style={{
                    backgroundColor: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#a855f7'][
                      i % 6
                    ],
                    borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
                    left: `${Math.random() * 100}%`,
                    top: -20,
                  }}
                  animate={{
                    y: [0, typeof window !== 'undefined' ? window.innerHeight + 100 : 800],
                    x: [0, (Math.random() - 0.5) * 200],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 2.5 + Math.random() * 1.5,
                    delay: Math.random() * 1,
                    ease: 'easeOut',
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Animated emoji */}
            <motion.div
              className="text-6xl mb-4"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
            >
              🎰
            </motion.div>

            {/* Header */}
            <motion.h2
              className="text-xl font-bold mb-6 font-pixel-heading text-shadow-balatro tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              PICKS LOCKED IN!
            </motion.h2>

            {/* Jackpot Card */}
            <motion.div
              className="w-full max-w-sm bg-gradient-to-br from-amber-900/40 via-yellow-800/30 to-amber-900/40 border-2 border-game-gold rounded-xl p-5 mb-6 relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />

              <p className="text-center text-sm font-bold text-game-gold mb-3 tracking-widest uppercase">
                POTENTIAL JACKPOT
              </p>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 400, damping: 20 }}
              >
                <span className="text-4xl font-bold text-white">
                  ${jackpotData.maxPoints.totalPoints.toFixed(2)} USD
                </span>
              </motion.div>

              <motion.p
                className="text-center text-sm text-gray-300 mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                If you nail all 5 picks!
              </motion.p>

              <motion.p
                className="text-center text-sm text-game-gold mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                🎲 {formatProbability(jackpotData.combinedProb)} chance
              </motion.p>
            </motion.div>

            {/* Mini pick chips with probabilities and rarity */}
            <motion.div
              className="flex flex-wrap justify-center gap-2 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {pickedEvents.map(({ event, outcome }, index) => {
                const prob = outcome === 'a'
                  ? event.outcome_a_probability
                  : outcome === 'b'
                    ? event.outcome_b_probability
                    : event.outcome_draw_probability ?? 0;
                const label = outcome === 'a'
                  ? event.outcome_a_label
                  : outcome === 'b'
                    ? event.outcome_b_label
                    : event.outcome_draw_label || 'Draw';
                // Get short label (first 3 letters or abbreviation)
                const shortLabel = label.length > 4
                  ? label.substring(0, 3).toUpperCase()
                  : label.toUpperCase();

                const rarity = event.rarityInfo?.rarity ?? getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
                const rarityConfig = getRarityConfig(rarity);
                const showGlow = rarity !== 'common';

                return (
                  <motion.div
                    key={event.id}
                    className="flex flex-col items-center px-3 py-2 rounded-lg text-xs font-bold border-2"
                    style={{
                      borderColor: rarityConfig.hex,
                      backgroundColor: showGlow ? `${rarityConfig.hex}15` : 'rgba(107, 114, 128, 0.15)',
                      boxShadow: showGlow ? `0 0 10px ${rarityConfig.hex}, 0 0 20px ${rarityConfig.hex}50` : undefined,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                  >
                    <span className="text-sm text-white">{shortLabel}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">
                      {formatProbability(prob)}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA Button */}
            <motion.button
              className="px-8 py-4 bg-gradient-to-r from-game-gold to-amber-500 text-black font-bold text-base rounded-xl shadow-hard-lg font-pixel-heading tracking-wider"
              onClick={handleLetsGo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95, y: 2 }}
            >
              LET&apos;S GO!
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

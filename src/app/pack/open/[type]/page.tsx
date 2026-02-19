'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
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
import { isPSG1 } from '@/lib/platform';
import { GP, isGamepadButtonPressed } from '@/lib/gamepad';
import { playSound } from '@/lib/audio';
import { useHoldToConfirm } from '@/hooks/useHoldToConfirm';
import { PixelDissolve } from '@/components/animations/PixelDissolve';
import type { Event, Outcome, UserPack, UserPick } from '@/types';

type Phase = 'checking' | 'loading' | 'opening' | 'dissolving' | 'revealing' | 'swiping' | 'confirming' | 'blocked' | 'error';

interface PickedEvent {
  event: Event;
  outcome: Outcome;
}

export default function PackOpeningPage({ params }: { params: { type: string } }) {
  const { type } = params;
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pickedEvents, setPickedEvents] = useState<PickedEvent[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Generate stable pack ID
  const packIdRef = useRef<string>(uuidv4());
  const packId = packIdRef.current;

  // Load events from pool (now async - reads from database)
  const eventsLoadedRef = useRef(false);
  useEffect(() => {
    if (eventsLoadedRef.current) return;
    eventsLoadedRef.current = true;

    async function loadEvents() {
      try {
        const poolEvents = await getEventsForPack(type, 5);
        if (poolEvents.length === 0) {
          setErrorMessage('No events available in this pool. Please try again later.');
          setPhase('error');
          return;
        }
        setEvents(poolEvents);
        setPhase('checking');
      } catch (error) {
        console.error('Error loading events:', error);
        setErrorMessage('Failed to load events. Please try again.');
        setPhase('error');
      }
    }

    loadEvents();
  }, [type]);

  const { setPack, setDraftPick } = useCurrentPackStore();
  const addPack = useMyPacksStore((state) => state.addPack);
  const markPackSynced = useMyPacksStore((state) => state.markPackSynced);
  const anonymousId = useSessionStore((state) => state.anonymousId);
  const isProfileSynced = useSessionStore((state) => state.isProfileSynced);

  // Check if user can open a pack
  useEffect(() => {
    async function checkAvailability() {
      if (!anonymousId || !isProfileSynced) return;

      try {
        const response = await fetch(
          `/api/packs/availability?anonymousId=${encodeURIComponent(anonymousId)}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.canOpenPack) {
            setPhase('opening');
          } else {
            setPhase('blocked');
          }
        } else {
          // If API fails, allow opening (local-first)
          setPhase('opening');
        }
      } catch (error) {
        console.error('Error checking pack availability:', error);
        // If API fails, allow opening (local-first)
        setPhase('opening');
      }
    }

    if (phase === 'checking') {
      checkAvailability();
    }
  }, [anonymousId, isProfileSynced, phase]);

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

  // Handle tap to open pack
  const handleOpenPack = () => {
    if (phase === 'opening') {
      playSound('pack_open');
      setPhase('dissolving');
    }
  };

  const handleDissolveComplete = useCallback(() => {
    setPhase('revealing');
  }, []);

  // Reveal cards one by one
  useEffect(() => {
    if (phase === 'revealing' && revealedCards.length < events.length) {
      const timer = setTimeout(() => {
        const nextIndex = revealedCards.length;
        // Play rarity-based sound for each card reveal
        if (nextIndex < events.length) {
          const event = events[nextIndex];
          const rarity = event.rarityInfo?.rarity ?? getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
          if (rarity === 'legendary') playSound('reveal_legendary');
          else if (rarity === 'epic') playSound('reveal_epic');
          else if (rarity === 'rare') playSound('reveal_rare');
          else playSound('card_deal');
        }
        setRevealedCards((prev) => [...prev, prev.length]);
      }, 200);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && revealedCards.length >= events.length) {
      const timer = setTimeout(() => setPhase('swiping'), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, revealedCards, events]);

  const handleSwipe = useCallback((outcome: Outcome) => {
    const event = events[currentIndex];
    playSound('card_pick');

    // Save pick
    setDraftPick(event.id, outcome);
    setPickedEvents((prev) => [...prev, { event, outcome }]);

    // Move to next or finish
    if (currentIndex < events.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All picked - go to confirming
      playSound('charge_confirm');
      setTimeout(() => setPhase('confirming'), 300);
    }
  }, [currentIndex, events, setDraftPick]);

  // PSG1 gamepad support for swiping phase
  const psg1 = isPSG1();
  const swipeX = useMotionValue(0);

  const handleSwipeA = useCallback(() => handleSwipe('a'), [handleSwipe]);
  const handleSwipeB = useCallback(() => handleSwipe('b'), [handleSwipe]);
  const handleSwipeDraw = useCallback(() => handleSwipe('draw'), [handleSwipe]);

  const { chargeDirection, chargeProgress } = useHoldToConfirm({
    enabled: psg1 && phase === 'swiping',
    onYes: handleSwipeA,
    onNo: handleSwipeB,
    onPass: handleSwipeDraw,
    motionX: swipeX,
  });

  // Escape / Gamepad A to go back (PSG1, swiping phase)
  useEffect(() => {
    if (!psg1 || phase !== 'swiping') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        router.push('/game');
      }
    };
    let rafId: number | null = null;
    let prevA = false;
    const pollBack = () => {
      const aNow = isGamepadButtonPressed(GP.A);
      if (aNow && !prevA) router.push('/game');
      prevA = aNow;
      rafId = requestAnimationFrame(pollBack);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(pollBack);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, phase, router]);

  // PSG1 gamepad/keyboard for opening phase (B/Enter → open, A/Escape → back)
  useEffect(() => {
    if (!psg1 || phase !== 'opening') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleOpenPack(); }
      if (e.key === 'Escape') { e.preventDefault(); router.push('/game'); }
    };
    let rafId: number | null = null;
    let prevB = false;
    let prevA = false;
    const poll = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      const aNow = isGamepadButtonPressed(GP.A);
      if (bNow && !prevB) handleOpenPack();
      if (aNow && !prevA) router.push('/game');
      prevB = bNow;
      prevA = aNow;
      rafId = requestAnimationFrame(poll);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(poll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, phase, router]);

  // PSG1 gamepad/keyboard for revealing phase (B → skip to swiping)
  useEffect(() => {
    if (!psg1 || phase !== 'revealing') return;
    const skipToSwiping = () => {
      setRevealedCards(events.map((_, i) => i));
      setPhase('swiping');
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); skipToSwiping(); }
    };
    let rafId: number | null = null;
    let prevB = false;
    const poll = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      if (bNow && !prevB) skipToSwiping();
      prevB = bNow;
      rafId = requestAnimationFrame(poll);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(poll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, phase, events]);

  // PSG1 gamepad/keyboard for confirming phase (B/Enter → Let's Go, A/Escape → back)
  useEffect(() => {
    if (!psg1 || phase !== 'confirming') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); handleLetsGo(); }
      if (e.key === 'Escape') { e.preventDefault(); router.push('/game'); }
    };
    let rafId: number | null = null;
    let prevB = false;
    let prevA = false;
    const poll = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      const aNow = isGamepadButtonPressed(GP.A);
      if (bNow && !prevB) handleLetsGo();
      if (aNow && !prevA) router.push('/game');
      prevB = bNow;
      prevA = aNow;
      rafId = requestAnimationFrame(poll);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(poll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, phase, router]);

  // PSG1 gamepad/keyboard for blocked/error phases (B/Enter → primary, A/Escape → back)
  useEffect(() => {
    if (!psg1 || (phase !== 'blocked' && phase !== 'error')) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); router.push('/'); }
    };
    let rafId: number | null = null;
    let prevB = false;
    let prevA = false;
    const poll = () => {
      const bNow = isGamepadButtonPressed(GP.B);
      const aNow = isGamepadButtonPressed(GP.A);
      if ((bNow && !prevB) || (aNow && !prevA)) router.push('/');
      prevB = bNow;
      prevA = aNow;
      rafId = requestAnimationFrame(poll);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(poll);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, phase, router]);

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
        {/* Loading Phase - Fetching events from pool */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            className="flex-1 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 border-4 border-game-accent border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-400">Loading events...</p>
          </motion.div>
        )}

        {/* Error Phase */}
        {phase === 'error' && (
          <motion.div
            key="error"
            className="flex-1 flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-6">😕</div>
              <h2 className="text-2xl font-bold mb-4">Oops!</h2>
              <p className="text-gray-400 mb-6">{errorMessage}</p>
              <button
                onClick={() => router.push('/')}
                className="w-full btn-pixel"
              >
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

        {/* Checking Phase */}
        {phase === 'checking' && (
          <motion.div
            key="checking"
            className="flex-1 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-12 h-12 border-4 border-game-accent border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-sm text-gray-400">Checking availability...</p>
          </motion.div>
        )}

        {/* Blocked Phase - Weekly Limit Reached */}
        {phase === 'blocked' && (
          <motion.div
            key="blocked"
            className="flex-1 flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center max-w-sm">
              <div className="text-6xl mb-6">⏳</div>
              <h2 className="text-2xl font-bold mb-4">Weekly Limit Reached</h2>
              <p className="text-gray-400 mb-6">
                You&apos;ve opened all your free packs this week.
                <br />
                Come back next Monday for more!
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full btn-pixel"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => router.push('/my-packs')}
                  className="w-full btn-pixel-secondary"
                >
                  View My Packs
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Opening / Dissolving Phase */}
        {(phase === 'opening' || phase === 'dissolving') && (
          <motion.div
            key="opening"
            className="flex-1 flex flex-col items-center justify-center cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOpenPack}
          >
            <motion.div
              animate={phase === 'opening' ? {
                rotate: [-2, 2, -2, 2, 0],
                scale: [1, 1.02, 1, 1.02, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: Infinity,
              }}
              whileHover={phase === 'opening' ? { scale: 1.05 } : {}}
              whileTap={phase === 'opening' ? { scale: 0.95 } : {}}
            >
              <div className="relative w-64 h-[320px]">
                <div style={{ visibility: phase === 'dissolving' ? 'hidden' : 'visible' }}>
                  <PackSprite type={type as 'sports'} size="xl" glowing={phase === 'opening'} />
                </div>
                {phase === 'dissolving' && (
                  <PixelDissolve
                    imageSrc="/images/packs/sportpack_1.png"
                    width={256}
                    height={320}
                    onComplete={handleDissolveComplete}
                  />
                )}
              </div>
            </motion.div>
            {phase === 'opening' && (
              <motion.p
                className="mt-6 text-xl font-bold font-pixel-heading tracking-wider"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {psg1 ? 'Press \u24B7 to Open' : 'Tap to Open'}
              </motion.p>
            )}
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
            {psg1 && (
              <motion.p
                className="mt-3 text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                [B] Skip
              </motion.p>
            )}
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
            <div className={`${psg1 ? 'p-2' : 'p-4'} text-center`}>
              <h1 className={`${psg1 ? 'text-base' : 'text-xl'} font-bold font-pixel-heading text-shadow-balatro tracking-wider`}>Make Your Picks</h1>
              {!psg1 && <p className="text-sm text-gray-400 mt-1">Swipe to choose</p>}
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
              <div className={`relative w-full max-w-sm mx-auto h-full ${psg1 ? '' : 'min-h-[450px]'}`}>
                <AnimatePresence>
                  {visibleEvents.map((event, index) => (
                    <SwipeCard
                      key={event.id}
                      event={event}
                      position={currentIndex + index + 1}
                      total={events.length}
                      onSwipe={handleSwipe}
                      isTop={index === 0}
                      psg1Mode={psg1}
                      chargeDirection={index === 0 ? chargeDirection : null}
                      chargeProgress={index === 0 ? chargeProgress : 0}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Picked summary (hidden on PSG1 to save vertical space) */}
            {!psg1 && pickedEvents.length > 0 && (
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
              {[...Array(psg1 ? 15 : 30)].map((_, i) => (
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
            {psg1 && (
              <motion.p
                className="mt-3 text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                [B] Let&apos;s Go
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PackSprite } from '@/components/sprites/PackSprite';
import { SwipeCard } from '@/components/game/SwipeCard';
import { useCurrentPackStore } from '@/stores';
import type { Event, Outcome } from '@/types';

// Mock events for v0 - will be replaced with Supabase/Polymarket data
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    polymarket_market_id: 'mock-1',
    title: 'Manchester United vs Liverpool',
    outcome_a_label: 'Man United',
    outcome_b_label: 'Liverpool',
    outcome_a_probability: 0.35,
    outcome_b_probability: 0.65,
    category: 'sports',
    subcategory: 'epl',
    status: 'active',
    is_featured: false,
    priority_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    polymarket_market_id: 'mock-2',
    title: 'Lakers vs Celtics',
    outcome_a_label: 'Lakers',
    outcome_b_label: 'Celtics',
    outcome_a_probability: 0.42,
    outcome_b_probability: 0.58,
    category: 'sports',
    subcategory: 'nba',
    status: 'active',
    is_featured: false,
    priority_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    polymarket_market_id: 'mock-3',
    title: 'Chiefs vs 49ers',
    outcome_a_label: 'Chiefs',
    outcome_b_label: '49ers',
    outcome_a_probability: 0.55,
    outcome_b_probability: 0.45,
    category: 'sports',
    subcategory: 'nfl',
    status: 'active',
    is_featured: false,
    priority_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    polymarket_market_id: 'mock-4',
    title: 'Barcelona vs Real Madrid',
    outcome_a_label: 'Barcelona',
    outcome_b_label: 'Real Madrid',
    outcome_a_probability: 0.48,
    outcome_b_probability: 0.52,
    category: 'sports',
    subcategory: 'laliga',
    status: 'active',
    is_featured: false,
    priority_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    polymarket_market_id: 'mock-5',
    title: 'Verstappen wins next race?',
    outcome_a_label: 'Yes',
    outcome_b_label: 'No',
    outcome_a_probability: 0.68,
    outcome_b_probability: 0.32,
    category: 'sports',
    subcategory: 'f1',
    status: 'active',
    is_featured: false,
    priority_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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

  const { setPack, setDraftPick } = useCurrentPackStore();

  // Initialize pack with mock events
  useEffect(() => {
    setPack(
      {
        id: 'mock-pack-1',
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
      MOCK_EVENTS
    );
  }, [type, setPack]);

  // Auto-advance from opening to revealing
  useEffect(() => {
    if (phase === 'opening') {
      const timer = setTimeout(() => setPhase('revealing'), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Reveal cards one by one
  useEffect(() => {
    if (phase === 'revealing' && revealedCards.length < MOCK_EVENTS.length) {
      const timer = setTimeout(() => {
        setRevealedCards((prev) => [...prev, prev.length]);
      }, 200);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && revealedCards.length >= MOCK_EVENTS.length) {
      const timer = setTimeout(() => setPhase('swiping'), 600);
      return () => clearTimeout(timer);
    }
  }, [phase, revealedCards]);

  const handleSwipe = (outcome: Outcome) => {
    const event = MOCK_EVENTS[currentIndex];

    // Save pick
    setDraftPick(event.id, outcome);
    setPickedEvents((prev) => [...prev, { event, outcome }]);

    // Move to next or finish
    if (currentIndex < MOCK_EVENTS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All picked - go to confirming
      setTimeout(() => setPhase('confirming'), 300);
    }
  };

  // Navigate to queue after confirming
  useEffect(() => {
    if (phase === 'confirming') {
      const timer = setTimeout(() => {
        router.push('/pack/mock-pack-1');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, router]);

  // Get visible cards (current and next)
  const visibleEvents = MOCK_EVENTS.slice(currentIndex, currentIndex + 2);

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
              className="mt-6 text-xl font-bold"
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
              {MOCK_EVENTS.map((event, index) => (
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
                  <div className="w-14 h-20 bg-game-primary border-2 border-game-accent rounded-lg flex items-center justify-center shadow-pixel">
                    <span className="text-xl">
                      {event.subcategory === 'nba' ? '🏀' :
                       event.subcategory === 'nfl' ? '🏈' :
                       event.subcategory === 'epl' ? '⚽' :
                       event.subcategory === 'f1' ? '🏎️' :
                       event.subcategory === 'laliga' ? '⚽' : '🎯'}
                    </span>
                  </div>
                </motion.div>
              ))}
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
              <h1 className="text-lg font-bold">Make Your Picks</h1>
              <p className="text-sm text-gray-400">Swipe to choose</p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {MOCK_EVENTS.map((_, index) => (
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
                      total={MOCK_EVENTS.length}
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
                  {pickedEvents.map(({ event, outcome }) => (
                    <div
                      key={event.id}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold ${
                        outcome === 'a'
                          ? 'bg-outcome-a/20 text-outcome-a border border-outcome-a'
                          : 'bg-outcome-b/20 text-outcome-b border border-outcome-b'
                      }`}
                    >
                      {outcome === 'a' ? event.outcome_a_label : event.outcome_b_label}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Confirming Phase */}
        {phase === 'confirming' && (
          <motion.div
            key="confirming"
            className="flex-1 flex flex-col items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="text-6xl mb-4"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              🎯
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">All Picks Made!</h2>
            <p className="text-gray-400 mb-6">5/5 events picked</p>

            {/* Summary */}
            <div className="w-full max-w-sm space-y-2">
              {pickedEvents.map(({ event, outcome }, index) => (
                <motion.div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-card-bg rounded-lg border border-card-border"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-sm truncate flex-1">{event.title}</span>
                  <span
                    className={`text-sm font-bold ml-2 ${
                      outcome === 'a' ? 'text-outcome-a' : 'text-outcome-b'
                    }`}
                  >
                    {outcome === 'a' ? event.outcome_a_label : event.outcome_b_label}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="mt-6 text-sm text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Heading to your queue...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

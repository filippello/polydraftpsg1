'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { QueueCard } from '@/components/game/QueueCard';
import { RevealAnimation } from '@/components/animations/RevealAnimation';
import type { UserPick, Event, Outcome } from '@/types';

// Mock data for v0 - shows pack with picks waiting for resolution
const MOCK_PICKS: (UserPick & { event: Event })[] = [
  {
    id: 'pick-1',
    user_pack_id: 'mock-pack-1',
    event_id: '1',
    position: 1,
    picked_outcome: 'b' as Outcome,
    picked_at: new Date().toISOString(),
    probability_snapshot: 0.65,
    opposite_probability_snapshot: 0.35,
    is_resolved: true,
    is_correct: true,
    resolved_at: new Date().toISOString(),
    points_awarded: 15.38,
    reveal_animation_played: false,
    created_at: new Date().toISOString(),
    event: {
      id: '1',
      polymarket_market_id: 'mock-1',
      title: 'Manchester United vs Liverpool',
      outcome_a_label: 'Man United',
      outcome_b_label: 'Liverpool',
      outcome_a_probability: 0.35,
      outcome_b_probability: 0.65,
      category: 'sports',
      subcategory: 'epl',
      status: 'resolved',
      winning_outcome: 'b' as Outcome,
      is_featured: false,
      priority_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'pick-2',
    user_pack_id: 'mock-pack-1',
    event_id: '2',
    position: 2,
    picked_outcome: 'a' as Outcome,
    picked_at: new Date().toISOString(),
    probability_snapshot: 0.42,
    opposite_probability_snapshot: 0.58,
    is_resolved: false,
    is_correct: undefined,
    resolved_at: undefined,
    points_awarded: 0,
    reveal_animation_played: false,
    created_at: new Date().toISOString(),
    event: {
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
  },
  {
    id: 'pick-3',
    user_pack_id: 'mock-pack-1',
    event_id: '3',
    position: 3,
    picked_outcome: 'a' as Outcome,
    picked_at: new Date().toISOString(),
    probability_snapshot: 0.55,
    opposite_probability_snapshot: 0.45,
    is_resolved: false,
    is_correct: undefined,
    resolved_at: undefined,
    points_awarded: 0,
    reveal_animation_played: false,
    created_at: new Date().toISOString(),
    event: {
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
  },
  {
    id: 'pick-4',
    user_pack_id: 'mock-pack-1',
    event_id: '4',
    position: 4,
    picked_outcome: 'b' as Outcome,
    picked_at: new Date().toISOString(),
    probability_snapshot: 0.52,
    opposite_probability_snapshot: 0.48,
    is_resolved: true,
    is_correct: false,
    resolved_at: new Date().toISOString(),
    points_awarded: 0,
    reveal_animation_played: false,
    created_at: new Date().toISOString(),
    event: {
      id: '4',
      polymarket_market_id: 'mock-4',
      title: 'Barcelona vs Real Madrid',
      outcome_a_label: 'Barcelona',
      outcome_b_label: 'Real Madrid',
      outcome_a_probability: 0.48,
      outcome_b_probability: 0.52,
      category: 'sports',
      subcategory: 'laliga',
      status: 'resolved',
      winning_outcome: 'a' as Outcome,
      is_featured: false,
      priority_score: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: 'pick-5',
    user_pack_id: 'mock-pack-1',
    event_id: '5',
    position: 5,
    picked_outcome: 'a' as Outcome,
    picked_at: new Date().toISOString(),
    probability_snapshot: 0.68,
    opposite_probability_snapshot: 0.32,
    is_resolved: false,
    is_correct: undefined,
    resolved_at: undefined,
    points_awarded: 0,
    reveal_animation_played: false,
    created_at: new Date().toISOString(),
    event: {
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
  },
];

export default function QueuePage({ params }: { params: { packId: string } }) {
  // packId will be used when connecting to real backend
  const { packId: _packId } = params;
  void _packId; // Silence unused warning
  const [picks, setPicks] = useState(MOCK_PICKS);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealingPick, setRevealingPick] = useState<(UserPick & { event: Event }) | null>(null);

  // Calculate stats
  const resolvedCount = picks.filter((p) => p.reveal_animation_played).length;
  const totalPoints = picks.reduce((sum, p) => sum + p.points_awarded, 0);
  const correctCount = picks.filter((p) => p.is_correct).length;

  // Check if next card can be revealed
  const nextPick = picks[currentRevealIndex];
  const canReveal = nextPick?.is_resolved && !nextPick?.reveal_animation_played;

  const handleReveal = () => {
    if (!canReveal || !nextPick) return;

    setIsRevealing(true);
    setRevealingPick(nextPick);
  };

  const handleRevealComplete = () => {
    if (!revealingPick) return;

    // Mark as revealed
    setPicks((prev) =>
      prev.map((p) =>
        p.id === revealingPick.id ? { ...p, reveal_animation_played: true } : p
      )
    );

    setCurrentRevealIndex((prev) => prev + 1);
    setIsRevealing(false);
    setRevealingPick(null);
  };

  return (
    <main className="min-h-screen bg-game-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-game-bg/95 backdrop-blur-sm border-b border-card-border p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Back
          </Link>
          <h1 className="font-bold">Your Queue</h1>
          <div className="w-12" /> {/* Spacer */}
        </div>
      </header>

      {/* Stats Bar */}
      <div className="p-4 border-b border-card-border">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Progress</p>
            <p className="text-lg font-bold">
              {resolvedCount}/{picks.length} revealed
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Points</p>
            <p className="text-lg font-bold text-game-gold">
              {totalPoints.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-card-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-game-gold"
            initial={{ width: 0 }}
            animate={{ width: `${(resolvedCount / picks.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Reveal Button (if available) */}
      {canReveal && !isRevealing && (
        <div className="p-4">
          <motion.button
            className="w-full btn-pixel-gold"
            onClick={handleReveal}
            initial={{ scale: 0.95 }}
            animate={{ scale: [0.95, 1.02, 0.95] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Reveal Card #{currentRevealIndex + 1}
          </motion.button>
        </div>
      )}

      {/* Waiting message */}
      {!canReveal && !isRevealing && currentRevealIndex < picks.length && (
        <div className="p-4 text-center">
          <motion.p
            className="text-sm text-gray-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Waiting for event #{currentRevealIndex + 1} to resolve...
          </motion.p>
        </div>
      )}

      {/* Pack complete */}
      {currentRevealIndex >= picks.length && (
        <div className="p-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-4xl mb-2"
          >
            🎉
          </motion.div>
          <p className="text-lg font-bold">Pack Complete!</p>
          <p className="text-sm text-gray-400">
            {correctCount}/{picks.length} correct • {totalPoints.toFixed(1)} points
          </p>
        </div>
      )}

      {/* Picks List */}
      <div className="flex-1 p-4 pb-24">
        <div className="space-y-3 max-w-md mx-auto">
          {picks.map((pick, index) => (
            <QueueCard
              key={pick.id}
              pick={pick}
              position={index + 1}
              isRevealed={pick.reveal_animation_played}
              isNext={index === currentRevealIndex}
              isLocked={index > currentRevealIndex}
            />
          ))}
        </div>
      </div>

      {/* Reveal Animation Overlay */}
      <AnimatePresence>
        {isRevealing && revealingPick && (
          <RevealAnimation
            pick={revealingPick}
            onComplete={handleRevealComplete}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

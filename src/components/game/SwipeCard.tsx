'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { Event, Outcome } from '@/types';
import { formatProbability, getTier, getTierColor } from '@/lib/scoring/calculator';

interface SwipeCardProps {
  event: Event;
  position: number;
  total: number;
  onSwipe: (outcome: Outcome) => void;
  isTop: boolean;
}

export function SwipeCard({ event, position, total, onSwipe, isTop }: SwipeCardProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Color overlays based on swipe direction
  const leftOverlayOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 100], [0, 1]);

  const tierA = getTier(event.outcome_a_probability);
  const tierB = getTier(event.outcome_b_probability);
  const colorA = getTierColor(tierA);
  const colorB = getTierColor(tierB);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      // Swiped right -> Option A
      setExitDirection('right');
      setTimeout(() => onSwipe('a'), 200);
    } else if (info.offset.x < -threshold) {
      // Swiped left -> Option B
      setExitDirection('left');
      setTimeout(() => onSwipe('b'), 200);
    }
  };

  const isVsMatch = event.outcome_a_label !== 'Yes' && event.outcome_b_label !== 'No';

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? 'z-10' : 'z-0'}`}
      style={{ x, rotate, opacity }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={
        exitDirection === 'left'
          ? { x: -500, rotate: -30, opacity: 0 }
          : exitDirection === 'right'
            ? { x: 500, rotate: 30, opacity: 0 }
            : { scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="w-full h-full bg-card-bg border-4 border-card-border rounded-2xl overflow-hidden shadow-pixel-lg relative">
        {/* Left overlay (Option B) */}
        <motion.div
          className="absolute inset-0 bg-outcome-b/30 pointer-events-none z-20 flex items-center justify-center"
          style={{ opacity: leftOverlayOpacity }}
        >
          <div className="bg-outcome-b text-white px-6 py-3 rounded-lg font-bold text-xl -rotate-12 border-4 border-white">
            {event.outcome_b_label}
          </div>
        </motion.div>

        {/* Right overlay (Option A) */}
        <motion.div
          className="absolute inset-0 bg-outcome-a/30 pointer-events-none z-20 flex items-center justify-center"
          style={{ opacity: rightOverlayOpacity }}
        >
          <div className="bg-outcome-a text-white px-6 py-3 rounded-lg font-bold text-xl rotate-12 border-4 border-white">
            {event.outcome_a_label}
          </div>
        </motion.div>

        {/* Card content */}
        <div className="h-full flex flex-col p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs px-3 py-1 bg-game-secondary rounded-full uppercase font-bold">
              {event.subcategory || event.category}
            </span>
            <span className="text-sm text-gray-400">
              {position}/{total}
            </span>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Event icon/image placeholder */}
            <div className="w-20 h-20 bg-game-secondary rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">
                {event.subcategory === 'nba' ? '🏀' :
                 event.subcategory === 'nfl' ? '🏈' :
                 event.subcategory === 'epl' ? '⚽' :
                 event.subcategory === 'f1' ? '🏎️' :
                 event.subcategory === 'laliga' ? '⚽' : '🎯'}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold mb-6 leading-tight">
              {event.title}
            </h2>

            {/* VS display */}
            {isVsMatch ? (
              <div className="w-full flex items-center justify-center gap-4">
                <div className="flex-1 text-right">
                  <p className="font-bold text-lg" style={{ color: colorA }}>
                    {event.outcome_a_label}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatProbability(event.outcome_a_probability)}
                  </p>
                </div>
                <div className="text-2xl font-bold text-gray-600">VS</div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-lg" style={{ color: colorB }}>
                    {event.outcome_b_label}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatProbability(event.outcome_b_probability)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="font-bold text-xl text-green-500">YES</p>
                  <p className="text-sm text-gray-400">
                    {formatProbability(event.outcome_a_probability)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-red-500">NO</p>
                  <p className="text-sm text-gray-400">
                    {formatProbability(event.outcome_b_probability)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Swipe hints */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-outcome-b">
              <span>←</span>
              <span className="font-bold">{event.outcome_b_label}</span>
            </div>
            <div className="flex items-center gap-2 text-outcome-a">
              <span className="font-bold">{event.outcome_a_label}</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

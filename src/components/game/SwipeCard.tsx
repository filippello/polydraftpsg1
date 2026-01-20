'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { Event, Outcome } from '@/types';
import { formatProbability, getTier, getTierColor } from '@/lib/scoring/calculator';
import {
  getEventRarity,
  getRarityConfig,
  getRarityBorderClass,
} from '@/lib/rarity';

interface SwipeCardProps {
  event: Event;
  position: number;
  total: number;
  onSwipe: (outcome: Outcome) => void;
  isTop: boolean;
}

export function SwipeCard({ event, position, total, onSwipe, isTop }: SwipeCardProps) {
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Color overlays based on swipe direction
  const leftOverlayOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 100], [0, 1]);

  // Draw overlay opacity (vertical swipe)
  const drawOverlayOpacity = useTransform(y, [-100, 0, 100], [1, 0, 1]);

  const tierA = getTier(event.outcome_a_probability);
  const tierB = getTier(event.outcome_b_probability);
  const colorA = getTierColor(tierA);
  const colorB = getTierColor(tierB);

  // Get rarity info (from rarityInfo if available, or calculate it)
  const rarity = event.rarityInfo?.rarity ?? getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
  const rarityConfig = getRarityConfig(rarity);
  const rarityBorderClass = getRarityBorderClass(rarity);
  // Only show glow for rare and above
  const showGlow = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    // Determine dominant direction
    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absX > absY) {
      // Horizontal - existing logic
      if (info.offset.x > threshold) {
        // Swiped right -> Option A
        setExitDirection('right');
        setTimeout(() => onSwipe('a'), 200);
      } else if (info.offset.x < -threshold) {
        // Swiped left -> Option B
        setExitDirection('left');
        setTimeout(() => onSwipe('b'), 200);
      }
    } else if (event.supports_draw) {
      // Vertical - only if supports draw
      if (absY > threshold) {
        setExitDirection(info.offset.y > 0 ? 'down' : 'up');
        setTimeout(() => onSwipe('draw'), 200);
      }
    }
  };

  const isVsMatch = event.outcome_a_label !== 'Yes' && event.outcome_b_label !== 'No';

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? 'z-10' : 'z-0'}`}
      style={{ x, y, rotate, opacity }}
      drag={isTop ? (event.supports_draw ? true : 'x') : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }}
      animate={
        exitDirection === 'left'
          ? { x: -500, rotate: -30, opacity: 0 }
          : exitDirection === 'right'
            ? { x: 500, rotate: 30, opacity: 0 }
            : exitDirection === 'down'
              ? { y: 500, opacity: 0 }
              : exitDirection === 'up'
                ? { y: -500, opacity: 0 }
                : { scale: isTop ? 1 : 0.95, y: isTop ? 0 : 10 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={`w-full h-full bg-card-bg border-4 ${rarityBorderClass} rounded-2xl overflow-hidden shadow-pixel-lg relative ${showGlow ? rarityConfig.glowClass : ''}`}>
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

        {/* Draw overlay (up/down) */}
        {event.supports_draw && (
          <motion.div
            className="absolute inset-0 bg-gray-500/30 pointer-events-none z-20 flex items-center justify-center"
            style={{ opacity: drawOverlayOpacity }}
          >
            <div className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold text-xl border-4 border-white">
              {event.outcome_draw_label || 'Draw'}
            </div>
          </motion.div>
        )}

        {/* Card content */}
        <div className="h-full flex flex-col">
          {/* Floating Header over image */}
          <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full uppercase font-bold text-white">
                {event.subcategory || event.category}
              </span>
              {/* Rarity badge */}
              <span
                className="text-xs px-3 py-1 rounded-full uppercase font-bold text-white"
                style={{ backgroundColor: rarityConfig.hex }}
              >
                {rarityConfig.name}
              </span>
            </div>
            <span className="text-sm text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
              {position}/{total}
            </span>
          </div>

          {/* Image area with 16:10 aspect ratio */}
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            {event.image_url ? (
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 400px) 100vw, 400px"
              />
            ) : (
              <div className="w-full h-full bg-game-secondary flex items-center justify-center">
                <span className="text-5xl">
                  {event.subcategory === 'nba' ? '🏀' :
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
            )}
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card-bg to-transparent" />
          </div>

          {/* Information panel */}
          <div className="flex-1 flex flex-col p-4 bg-card-bg/95">
            {/* Title */}
            <h2 className="text-xl font-bold mb-4 leading-tight text-center">
              {event.title}
            </h2>

            {/* VS display */}
            <div className="flex-1 flex items-center justify-center">
              {isVsMatch ? (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-4">
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
                  {/* Draw option */}
                  {event.supports_draw && event.outcome_draw_probability && (
                    <div className="text-center mt-2">
                      <span className="text-gray-400 text-sm">
                        {event.outcome_draw_label || 'Draw'}: {formatProbability(event.outcome_draw_probability)}
                      </span>
                    </div>
                  )}
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
            <div className="flex flex-col gap-2 text-sm pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-outcome-b">
                  <span>←</span>
                  <span className="font-bold">{event.outcome_b_label}</span>
                </div>
                <div className="flex items-center gap-2 text-outcome-a">
                  <span className="font-bold">{event.outcome_a_label}</span>
                  <span>→</span>
                </div>
              </div>
              {event.supports_draw && (
                <div className="flex justify-center text-gray-400">
                  <span>↑↓ {event.outcome_draw_label || 'Draw'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

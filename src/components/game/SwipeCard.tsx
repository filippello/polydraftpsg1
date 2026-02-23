'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { Event, Outcome } from '@/types';
import { formatProbability } from '@/lib/scoring/calculator';
import {
  getEventRarity,
  getRarityConfig,
  getRarityBorderColor,
  getHardShadowClass,
} from '@/lib/rarity';

interface SwipeCardProps {
  event: Event;
  position: number;
  total: number;
  onSwipe: (outcome: Outcome) => void;
  isTop: boolean;
  psg1Mode?: boolean;
  chargeDirection?: 'left' | 'right' | null;
  chargeProgress?: number;
}

export function SwipeCard({ event, position, total, onSwipe, isTop, psg1Mode, chargeDirection, chargeProgress }: SwipeCardProps) {
  console.log('[SwipeCard] event.image_url:', event.image_url);
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

  // Get rarity info (from rarityInfo if available, or calculate it)
  const rarity = event.rarityInfo?.rarity ?? getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
  const rarityConfig = getRarityConfig(rarity);
  const rarityBorderColor = getRarityBorderColor(rarity);
  const hardShadowClass = getHardShadowClass(rarity);
  // Only show glow for rare and above
  const showGlow = rarity === 'rare' || rarity === 'epic' || rarity === 'legendary';

  const handlePick = (outcome: Outcome) => {
    if (exitDirection) return;
    const dir = outcome === 'a' ? 'right' : outcome === 'b' ? 'left' : 'down';
    setExitDirection(dir);
    setTimeout(() => onSwipe(outcome), 200);
  };

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

  // Abbreviate team names to initials when draw makes things cramped on PSG1
  const useInitials = psg1Mode && event.supports_draw && isVsMatch;
  const toInitials = (name: string) =>
    name.split(/\s+/).map(w => w[0]).join('').toUpperCase();
  const labelA = useInitials ? toInitials(event.outcome_a_label) : event.outcome_a_label;
  const labelB = useInitials ? toInitials(event.outcome_b_label) : event.outcome_b_label;

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? 'z-10' : 'z-0'}`}
      style={{ x, y, rotate, opacity }}
      drag={psg1Mode ? false : (isTop ? (event.supports_draw ? true : 'x') : false)}
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
                : { scale: isTop ? 1 + (psg1Mode ? (chargeProgress ?? 0) * 0.07 : 0) : 0.95, y: isTop ? 0 : 10 }
      }
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className={`w-full h-full bg-card-bg border-balatro-thick ${rarityBorderColor} rounded-balatro-card overflow-hidden ${hardShadowClass} relative ${showGlow ? rarityConfig.glowClass : ''}`}>
        {/* Inner border - signature Balatro */}
        <div className="balatro-card-inner" />

        {/* Foil/Holo overlay for rare+ */}
        {(rarity === 'rare' || rarity === 'epic') && (
          <div className="absolute inset-0 pointer-events-none z-10 balatro-foil" />
        )}
        {rarity === 'legendary' && (
          <div className="absolute inset-0 pointer-events-none z-10 balatro-holo" />
        )}

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

        {/* Charge glow overlay (PSG1 only) */}
        {psg1Mode && chargeDirection && (
          <div
            className="absolute inset-0 pointer-events-none z-20 rounded-balatro-card"
            style={{
              boxShadow: [
                `inset 0 0 ${60 * (chargeProgress ?? 0)}px ${20 * (chargeProgress ?? 0)}px ${
                  chargeDirection === 'right'
                    ? `rgba(59, 130, 246, ${(chargeProgress ?? 0) * 0.7})`
                    : `rgba(239, 68, 68, ${(chargeProgress ?? 0) * 0.7})`
                }`,
                `0 0 ${40 * (chargeProgress ?? 0)}px ${15 * (chargeProgress ?? 0)}px ${
                  chargeDirection === 'right'
                    ? `rgba(59, 130, 246, ${(chargeProgress ?? 0) * 0.5})`
                    : `rgba(239, 68, 68, ${(chargeProgress ?? 0) * 0.5})`
                }`,
              ].join(', '),
              border: `${2 + (chargeProgress ?? 0) * 2}px solid ${
                chargeDirection === 'right'
                  ? `rgba(59, 130, 246, ${(chargeProgress ?? 0) * 0.8})`
                  : `rgba(239, 68, 68, ${(chargeProgress ?? 0) * 0.8})`
              }`,
            }}
          />
        )}

        {/* Card content */}
        <div className="h-full flex flex-col">
          {/* Floating Header over image */}
          <div className={`absolute top-0 left-0 right-0 z-20 ${psg1Mode ? 'p-2' : 'p-4'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className={`${psg1Mode ? 'text-[8px] px-2 py-1' : 'text-[10px] px-3 py-2'} bg-black/70 backdrop-blur-sm rounded-lg uppercase font-bold text-white shadow-hard-sm font-pixel-heading`}>
                {event.subcategory || event.category}
              </span>
              {/* Rarity badge */}
              <span
                className={`${psg1Mode ? 'text-[8px] px-2 py-1' : 'text-[10px] px-3 py-2'} rounded-lg uppercase font-bold text-white shadow-hard-sm font-pixel-heading`}
                style={{ backgroundColor: rarityConfig.hex }}
              >
                {rarityConfig.name}
              </span>
            </div>
            <span className={`${psg1Mode ? 'text-xs px-2 py-1' : 'text-base px-3 py-1.5'} text-white bg-black/70 backdrop-blur-sm rounded-lg shadow-hard-sm font-bold font-pixel-body`}>
              {position}/{total}
            </span>
          </div>

          {/* Image area */}
          <div className={`relative w-full ${psg1Mode ? 'h-[45%]' : 'aspect-[16/10]'} overflow-hidden`}>
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
          <div className={`flex-1 flex flex-col ${psg1Mode ? 'p-2' : 'p-4'} bg-card-bg/95`}>
            {/* Title */}
            <h2 className={`${psg1Mode ? 'text-base mb-1' : 'text-xl mb-4'} font-bold leading-tight text-center font-pixel-body`}>
              {isVsMatch ? `${labelB} vs ${labelA}` : event.title}
            </h2>

            {/* VS display */}
            <div className="flex-1 flex items-center justify-center">
              {isVsMatch ? (
                <div className="w-full">
                  <div className="flex items-center justify-center gap-4">
                    {/* Team B - Left (swipe left = B) */}
                    <div className="flex-1 text-right">
                      <p className={`font-bold ${psg1Mode ? 'text-base' : 'text-xl'} font-pixel-body text-outcome-b`}>
                        {labelB}
                      </p>
                      <p className={`${psg1Mode ? 'text-lg' : 'text-2xl'} font-pixel-body text-white mt-1`}>
                        {formatProbability(event.outcome_b_probability)}
                      </p>
                    </div>

                    {/* VS */}
                    <div className={`${psg1Mode ? 'text-xl' : 'text-3xl'} font-bold text-gray-500 font-pixel-heading`}>VS</div>

                    {/* Team A - Right (swipe right = A) */}
                    <div className="flex-1 text-left">
                      <p className={`font-bold ${psg1Mode ? 'text-base' : 'text-xl'} font-pixel-body text-outcome-a`}>
                        {labelA}
                      </p>
                      <p className={`${psg1Mode ? 'text-lg' : 'text-2xl'} font-pixel-body text-white mt-1`}>
                        {formatProbability(event.outcome_a_probability)}
                      </p>
                    </div>
                  </div>

                  {/* Draw option */}
                  {event.supports_draw && event.outcome_draw_probability && (
                    <div className="text-center mt-3">
                      <span className="text-game-gold text-base font-pixel-body">
                        {event.outcome_draw_label || 'Draw'}: {formatProbability(event.outcome_draw_probability)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex items-center ${psg1Mode ? 'gap-6' : 'gap-8'}`}>
                  {/* NO - Left (swipe left = B) */}
                  <div className="text-center">
                    <p className={`font-bold ${psg1Mode ? 'text-lg' : 'text-2xl'} text-red-500 font-pixel-heading`}>NO</p>
                    <p className={`${psg1Mode ? 'text-lg' : 'text-2xl'} text-white mt-1 font-pixel-body`}>
                      {formatProbability(event.outcome_b_probability)}
                    </p>
                  </div>

                  {/* YES - Right (swipe right = A) */}
                  <div className="text-center">
                    <p className={`font-bold ${psg1Mode ? 'text-lg' : 'text-2xl'} text-green-500 font-pixel-heading`}>YES</p>
                    <p className={`${psg1Mode ? 'text-lg' : 'text-2xl'} text-white mt-1 font-pixel-body`}>
                      {formatProbability(event.outcome_a_probability)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Swipe hints (mobile only, hidden on PSG1) */}
            {!psg1Mode && (
              <div className="flex md:hidden flex-col gap-2 text-sm pt-2">
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
            )}

            {/* PSG1 button hints */}
            {psg1Mode && (
              <div className="flex items-center justify-between text-base pt-2 border-t border-white/10">
                <div className={`flex items-center gap-2 transition-colors ${chargeDirection === 'left' ? 'text-outcome-b' : 'text-outcome-b/60'}`}>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">Y</span>
                  <span className="font-bold text-sm">{labelB}</span>
                </div>
                {event.supports_draw && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold text-gray-400">X</span>
                    <span>{event.outcome_draw_label || 'Draw'}</span>
                  </div>
                )}
                <div className={`flex items-center gap-2 transition-colors ${chargeDirection === 'right' ? 'text-outcome-a' : 'text-outcome-a/60'}`}>
                  <span className="font-bold text-sm">{labelA}</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">B</span>
                </div>
              </div>
            )}

            {/* Charge progress bar (PSG1 only) */}
            {psg1Mode && chargeDirection && (
              <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-none ${
                    chargeDirection === 'right'
                      ? 'bg-outcome-a shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                      : 'bg-outcome-b shadow-[0_0_8px_rgba(239,68,68,0.6)] ml-auto'
                  }`}
                  style={{ width: `${(chargeProgress ?? 0) * 100}%` }}
                />
              </div>
            )}

            {/* Pick buttons (desktop only, hidden on PSG1) */}
            <div className={`${psg1Mode ? 'hidden' : 'hidden md:flex'} gap-2 pt-2`} onPointerDownCapture={(e) => e.stopPropagation()}>
              <button onClick={() => handlePick('b')} className="flex-1 py-2 rounded-lg bg-outcome-b/20 border border-outcome-b/50 text-outcome-b font-bold text-sm hover:bg-outcome-b/30 transition-colors">
                {event.outcome_b_label}
              </button>
              {event.supports_draw && (
                <button onClick={() => handlePick('draw')} className="flex-1 py-2 rounded-lg bg-gray-500/20 border border-gray-500/50 text-gray-400 font-bold text-sm hover:bg-gray-500/30 transition-colors">
                  {event.outcome_draw_label || 'Draw'}
                </button>
              )}
              <button onClick={() => handlePick('a')} className="flex-1 py-2 rounded-lg bg-outcome-a/20 border border-outcome-a/50 text-outcome-a font-bold text-sm hover:bg-outcome-a/30 transition-colors">
                {event.outcome_a_label}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

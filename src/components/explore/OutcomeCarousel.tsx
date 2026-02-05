'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { ExploreMarket, ExploreOutcome } from '@/lib/jupiter/types';
import { useExploreStore } from '@/stores/explore';

interface OutcomeCarouselProps {
  market: ExploreMarket;
  outcomes: ExploreOutcome[];
  onBet?: (outcome: ExploreOutcome, direction: 'yes' | 'no') => void;
  onBack?: () => void;
  onComplete?: () => void;
}

function formatProbability(prob: number): string {
  return `${Math.round(prob * 100)}%`;
}

function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes('sport') || lower.includes('nba') || lower.includes('nfl')) return '🏀';
  if (lower.includes('politic') || lower.includes('election')) return '🗳️';
  if (lower.includes('crypto') || lower.includes('bitcoin')) return '₿';
  if (lower.includes('econ') || lower.includes('finance')) return '📈';
  if (lower.includes('entertain') || lower.includes('oscar')) return '🎬';
  if (lower.includes('tech')) return '💻';
  if (lower.includes('business') || lower.includes('m&a')) return '🏢';
  return '🎯';
}

/**
 * Get the image URL for an outcome with fallback logic:
 * 1. If outcome.image_slug exists → construct path: /images/explore/outcomes/{event_ticker}-{image_slug}
 *    (image_slug includes the file extension, e.g., 'jd-vance.jpg')
 * 2. If outcome.image_url exists → use it directly (legacy support)
 * 3. If market.image_url exists → use event image
 * 4. null (will show emoji fallback)
 */
function getOutcomeImageUrl(outcome: ExploreOutcome, market: ExploreMarket): string | null {
  // 1. Construct from image_slug if available (slug includes extension)
  if (outcome.image_slug && market.event_ticker) {
    return `/images/explore/outcomes/${market.event_ticker}-${outcome.image_slug}`;
  }
  // 2. Use direct image_url if provided (legacy)
  if (outcome.image_url) return outcome.image_url;
  // 3. Fallback to market/event image
  if (market.image_url) return market.image_url;
  // 4. No image available
  return null;
}

export function OutcomeCarousel({ market, outcomes, onBet, onBack, onComplete }: OutcomeCarouselProps) {
  const { currentOutcomeIndex, nextOutcome, setOutcomeIndex } = useExploreStore();
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | 'down' | null>(null);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const currentOutcome = outcomes[currentOutcomeIndex];
  const isLastOutcome = currentOutcomeIndex >= outcomes.length - 1;
  const hasFinished = currentOutcomeIndex >= outcomes.length;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Overlay opacities
  const yesOverlayOpacity = useTransform(x, [0, 100], [0, 1]);
  const noOverlayOpacity = useTransform(x, [-100, 0], [1, 0]);
  const passOverlayOpacity = useTransform(y, [0, 100], [0, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const thresholdX = 100;
    const thresholdY = 80;

    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absX > absY) {
      if (info.offset.x > thresholdX) {
        // Swiped right -> YES
        setExitDirection('right');
        setTimeout(() => {
          onBet?.(currentOutcome, 'yes');
          handleNext();
        }, 200);
      } else if (info.offset.x < -thresholdX) {
        // Swiped left -> NO
        setExitDirection('left');
        setTimeout(() => {
          onBet?.(currentOutcome, 'no');
          handleNext();
        }, 200);
      }
    } else if (absY > thresholdY && info.offset.y > 0) {
      // Swiped down -> PASS
      setExitDirection('down');
      setTimeout(() => {
        handleNext();
      }, 200);
    }
  };

  const handleNext = () => {
    if (isLastOutcome) {
      // Finished all outcomes
      setOutcomeIndex(outcomes.length); // Move past last
      setTimeout(() => onComplete?.(), 300);
    } else {
      setExitDirection(null);
      nextOutcome();
    }
  };

  const handleYes = () => {
    onBet?.(currentOutcome, 'yes');
    handleNext();
  };

  const handleNo = () => {
    onBet?.(currentOutcome, 'no');
    handleNext();
  };

  const handlePass = () => {
    handleNext();
  };

  // Finished all outcomes
  if (hasFinished || !currentOutcome) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-lg">←</span>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{market.title}</p>
          </div>
        </div>

        {/* Completion screen */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-6xl mb-6"
          >
            ✅
          </motion.div>
          <h2 className="text-xl font-bold mb-2">All Done!</h2>
          <p className="text-gray-400 text-center mb-6">
            You&apos;ve reviewed all {outcomes.length} outcomes
          </p>
          <button onClick={onBack} className="btn-pixel">
            Back to Markets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <span className="text-lg">←</span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-wider">{market.category}</p>
          <p className="text-sm font-medium truncate">{market.title}</p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
          <span className="text-sm font-bold text-purple-400">
            {currentOutcomeIndex + 1}
          </span>
          <span className="text-xs text-gray-500">/</span>
          <span className="text-sm text-gray-400">
            {outcomes.length}
          </span>
        </div>
      </div>

      {/* Card Area */}
      <div className="flex-1 relative p-4">
        {/* Background card (next) */}
        {!isLastOutcome && outcomes[currentOutcomeIndex + 1] && (
          <div className="absolute inset-4 z-0">
            <div className="w-full h-full bg-card-bg border-balatro border-white/10 rounded-balatro-card opacity-40 scale-[0.95] translate-y-2" />
          </div>
        )}

        {/* Main swipeable card */}
        <motion.div
          key={currentOutcome.id}
          className="absolute inset-4 z-10"
          style={{ x, y, rotate, opacity }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.8}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={
            exitDirection === 'left'
              ? { x: -400, rotate: -20, opacity: 0 }
              : exitDirection === 'right'
                ? { x: 400, rotate: 20, opacity: 0 }
                : exitDirection === 'down'
                  ? { y: 400, opacity: 0 }
                  : { scale: 1, opacity: 1, x: 0, y: 0 }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="w-full h-full bg-card-bg border-balatro-thick border-purple-500/40 rounded-balatro-card shadow-hard-lg overflow-hidden flex flex-col">
            {/* Inner border */}
            <div className="balatro-card-inner border-purple-400/20" />

            {/* YES overlay */}
            <motion.div
              className="absolute inset-0 bg-green-500/30 pointer-events-none z-20 flex items-center justify-center"
              style={{ opacity: yesOverlayOpacity }}
            >
              <div className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-3xl rotate-12 border-4 border-white shadow-lg font-pixel-heading">
                YES
              </div>
            </motion.div>

            {/* NO overlay */}
            <motion.div
              className="absolute inset-0 bg-red-500/30 pointer-events-none z-20 flex items-center justify-center"
              style={{ opacity: noOverlayOpacity }}
            >
              <div className="bg-red-500 text-white px-8 py-4 rounded-xl font-bold text-3xl -rotate-12 border-4 border-white shadow-lg font-pixel-heading">
                NO
              </div>
            </motion.div>

            {/* PASS overlay */}
            <motion.div
              className="absolute inset-0 bg-gray-500/30 pointer-events-none z-20 flex items-center justify-center"
              style={{ opacity: passOverlayOpacity }}
            >
              <div className="bg-gray-600 text-white px-8 py-4 rounded-xl font-bold text-2xl border-4 border-white shadow-lg">
                PASS
              </div>
            </motion.div>

            {/* Card content */}
            <div className="flex-1 flex flex-col p-6 relative z-10">
              {/* Top: Category icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <span className="text-3xl">{getCategoryEmoji(market.category)}</span>
                </div>
              </div>

              {/* Outcome image or icon */}
              <div className="flex-shrink-0 mb-6">
                {(() => {
                  const imageUrl = getOutcomeImageUrl(currentOutcome, market);
                  const hasImageError = imageError[currentOutcome.id];
                  const showImage = imageUrl && !hasImageError;

                  if (showImage) {
                    return (
                      <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-2 border-white/20">
                        <Image
                          src={imageUrl}
                          alt={currentOutcome.label}
                          fill
                          className="object-cover"
                          onError={() => setImageError((prev) => ({ ...prev, [currentOutcome.id]: true }))}
                        />
                      </div>
                    );
                  }

                  return (
                    <div className="w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border-2 border-purple-500/30 flex items-center justify-center">
                      <span className="text-5xl">{getCategoryEmoji(market.category)}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Outcome label */}
              <h2 className="text-2xl font-bold text-center mb-2 font-pixel-body leading-tight">
                {currentOutcome.label}
              </h2>

              {/* Context: For binary show the question */}
              {market.is_binary && (
                <p className="text-sm text-gray-400 text-center mb-4">
                  Will this happen?
                </p>
              )}

              {/* Probability - Big and centered */}
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-purple-400 font-pixel-heading mb-2">
                    {formatProbability(currentOutcome.probability)}
                  </p>
                  <p className="text-sm text-gray-500 uppercase tracking-wider">
                    current odds
                  </p>
                </div>
              </div>

              {/* Swipe hints */}
              <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-red-400">
                  <span className="text-lg">←</span>
                  <span className="font-bold">NO</span>
                </div>
                <div className="text-gray-500 text-xs">
                  ↓ PASS
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <span className="font-bold">YES</span>
                  <span className="text-lg">→</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom action buttons */}
      <div className="flex gap-3 px-4 pb-6 pt-2">
        <button
          onClick={handleNo}
          className="flex-1 bg-red-600/20 border-2 border-red-500/50 rounded-xl py-4 font-bold text-red-400 hover:bg-red-600/30 active:scale-95 transition-all text-lg"
        >
          NO
        </button>
        <button
          onClick={handlePass}
          className="px-6 bg-gray-600/20 border-2 border-gray-500/50 rounded-xl py-4 font-medium text-gray-400 hover:bg-gray-600/30 active:scale-95 transition-all"
        >
          Skip
        </button>
        <button
          onClick={handleYes}
          className="flex-1 bg-green-600/20 border-2 border-green-500/50 rounded-xl py-4 font-bold text-green-400 hover:bg-green-600/30 active:scale-95 transition-all text-lg"
        >
          YES
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {outcomes.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentOutcomeIndex
                ? 'bg-purple-500 scale-125'
                : i < currentOutcomeIndex
                  ? 'bg-purple-500/50'
                  : 'bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

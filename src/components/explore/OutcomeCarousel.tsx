'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { ExploreMarket, ExploreOutcome } from '@/lib/jupiter/types';
import { useExploreStore } from '@/stores/explore';
import { PurchaseModal } from './PurchaseModal';
import { ShareButton } from './ShareButton';

interface OutcomeCarouselProps {
  market: ExploreMarket;
  outcomes: ExploreOutcome[];
  onBet?: (outcome: ExploreOutcome, direction: 'yes' | 'no', amount: number) => void;
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

  // Purchase modal state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [pendingSwipe, setPendingSwipe] = useState<{
    outcome: ExploreOutcome;
    direction: 'yes' | 'no';
  } | null>(null);

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
        // Swiped right -> YES - show purchase modal
        setPendingSwipe({ outcome: currentOutcome, direction: 'yes' });
        setShowPurchaseModal(true);
      } else if (info.offset.x < -thresholdX) {
        // Swiped left -> NO - show purchase modal
        setPendingSwipe({ outcome: currentOutcome, direction: 'no' });
        setShowPurchaseModal(true);
      }
    } else if (absY > thresholdY && info.offset.y > 0) {
      // Swiped down -> PASS (no modal, skip directly)
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

  // Button handlers (for potential future button UI)
  const _handleYes = () => {
    setPendingSwipe({ outcome: currentOutcome, direction: 'yes' });
    setShowPurchaseModal(true);
  };

  const _handleNo = () => {
    setPendingSwipe({ outcome: currentOutcome, direction: 'no' });
    setShowPurchaseModal(true);
  };

  const _handlePass = () => {
    handleNext();
  };
  // Expose for potential future use
  void _handleYes;
  void _handleNo;
  void _handlePass;

  // Modal handlers
  const handlePurchaseConfirm = (amount: number) => {
    if (pendingSwipe) {
      const { outcome, direction } = pendingSwipe;
      // Set exit direction for animation
      setExitDirection(direction === 'yes' ? 'right' : 'left');
      setShowPurchaseModal(false);
      setTimeout(() => {
        onBet?.(outcome, direction, amount);
        handleNext();
        setPendingSwipe(null);
      }, 200);
    }
  };

  const handlePurchaseCancel = () => {
    setShowPurchaseModal(false);
    setPendingSwipe(null);
    // Card stays in place, no action taken
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
            <div className="flex-1 flex flex-col relative z-10">
              {/* Event question at top */}
              <div className="px-3 py-2 border-b border-purple-500/30 bg-black/30">
                <p className="text-xs text-center text-white font-bold font-pixel-heading leading-snug uppercase tracking-wide">
                  {market.description || market.title}
                </p>
              </div>

              {/* Outcome image */}
              <div className="relative flex-1 border-b-4 border-purple-500/30">
                {(() => {
                  const imageUrl = getOutcomeImageUrl(currentOutcome, market);
                  const hasImageError = imageError[currentOutcome.id];
                  const showImage = imageUrl && !hasImageError;

                  if (showImage) {
                    return (
                      <Image
                        src={imageUrl}
                        alt={currentOutcome.label}
                        fill
                        className="object-cover"
                        onError={() => setImageError((prev) => ({ ...prev, [currentOutcome.id]: true }))}
                      />
                    );
                  }

                  return (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 flex items-center justify-center">
                      <span className="text-7xl">{getCategoryEmoji(market.category)}</span>
                    </div>
                  );
                })()}

                {/* Share button */}
                <div className="absolute top-3 right-3 z-30">
                  <ShareButton
                    outcome={currentOutcome}
                    market={market}
                    variant="icon"
                  />
                </div>
              </div>

              {/* Bottom info section */}
              <div className="p-4">
                <h2 className="text-xl font-bold text-center mb-2 font-pixel-body leading-tight">
                  {currentOutcome.label}
                </h2>

                <p className="text-4xl font-bold text-purple-400 font-pixel-heading text-center mb-3">
                  {formatProbability(currentOutcome.probability)}
                </p>

                {/* Swipe hints */}
                <div className="flex items-center justify-between text-sm pt-3 border-t border-white/10">
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
          </div>
        </motion.div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 pb-4">
        {outcomes.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${i === currentOutcomeIndex
                ? 'bg-purple-500 scale-125'
                : i < currentOutcomeIndex
                  ? 'bg-purple-500/50'
                  : 'bg-gray-700'
              }`}
          />
        ))}
      </div>

      {/* Purchase Modal */}
      {pendingSwipe && (
        <PurchaseModal
          isOpen={showPurchaseModal}
          outcome={pendingSwipe.outcome}
          market={market}
          direction={pendingSwipe.direction}
          onConfirm={handlePurchaseConfirm}
          onCancel={handlePurchaseCancel}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import type { ExploreMarket, ExploreOutcome } from '@/lib/jupiter/types';
import { useExploreStore } from '@/stores/explore';
import { isPSG1 } from '@/lib/platform';
import { GP, isGamepadButtonPressed } from '@/lib/gamepad';
import { useHoldToConfirm } from '@/hooks/useHoldToConfirm';
import { PurchaseModal } from './PurchaseModal';
import { ShareButton } from './ShareButton';
import { PSG1BackButton } from '@/components/layout/PSG1BackButton';
import { playSound } from '@/lib/audio';

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
  // Card opacity derived from drag position (web only, not used in style to avoid FM v12 conflict)
  const cardDragOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  // Overlay opacities
  const yesOverlayOpacity = useTransform(x, [0, 100], [0, 1]);
  const noOverlayOpacity = useTransform(x, [-100, 0], [1, 0]);
  const passOverlayOpacity = useTransform(y, [0, 100], [0, 1]);

  // Screen shake state
  const [screenShake, setScreenShake] = useState(false);

  const handleNext = useCallback(() => {
    if (isLastOutcome) {
      setOutcomeIndex(outcomes.length);
      setTimeout(() => onComplete?.(), 300);
    } else {
      setExitDirection(null);
      nextOutcome();
      playSound('carousel_slide');
    }
  }, [isLastOutcome, outcomes.length, onComplete, nextOutcome, setOutcomeIndex]);

  const triggerScreenShake = useCallback(() => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);
  }, []);

  const handleYes = useCallback(() => {
    setPendingSwipe({ outcome: currentOutcome, direction: 'yes' });
    setShowPurchaseModal(true);
  }, [currentOutcome]);

  const handleNo = useCallback(() => {
    setPendingSwipe({ outcome: currentOutcome, direction: 'no' });
    setShowPurchaseModal(true);
  }, [currentOutcome]);

  const handlePass = useCallback(() => {
    playSound('card_pick');
    setExitDirection('down');
    setTimeout(() => handleNext(), 200);
  }, [handleNext]);

  // Hold callbacks with screen shake for PSG1
  const handleHoldYes = useCallback(() => {
    playSound('card_pick');
    triggerScreenShake();
    handleYes();
  }, [triggerScreenShake, handleYes]);

  const handleHoldNo = useCallback(() => {
    playSound('card_pick');
    triggerScreenShake();
    handleNo();
  }, [triggerScreenShake, handleNo]);

  // Hold-to-confirm for PSG1 gamepad.
  // IMPORTANT: use a SEPARATE MotionValue (holdX) — NOT the card's x.
  // The card's x is in style={{ x }} and controlled by FM's animate prop.
  // If we pass the card's x to useHoldToConfirm, the hook's motionX.set()
  // fights with FM's animate spring → card jumps.
  // (This matches the pattern in pack/open which uses a separate swipeX.)
  const psg1 = isPSG1();
  const holdX = useMotionValue(0);
  const { chargeDirection, chargeProgress } = useHoldToConfirm({
    enabled: psg1 && !hasFinished && !showPurchaseModal,
    onYes: handleHoldYes,
    onNo: handleHoldNo,
    onPass: handlePass,
    motionX: holdX,
  });

  // Escape / Gamepad A to go back (PSG1 only)
  useEffect(() => {
    if (!psg1 || showPurchaseModal || hasFinished) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onBack?.();
      }
    };
    // Gamepad A polling for back
    let rafId: number | null = null;
    let prevA = false;
    const pollBack = () => {
      const aNow = isGamepadButtonPressed(GP.A);
      if (aNow && !prevA) { playSound('nav_back'); onBack?.(); }
      prevA = aNow;
      rafId = requestAnimationFrame(pollBack);
    };
    window.addEventListener('keydown', handleKeyDown);
    rafId = requestAnimationFrame(pollBack);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [psg1, showPurchaseModal, hasFinished, onBack]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const thresholdX = 100;
    const thresholdY = 80;

    const absX = Math.abs(info.offset.x);
    const absY = Math.abs(info.offset.y);

    if (absX > absY) {
      if (info.offset.x > thresholdX) {
        handleYes();
      } else if (info.offset.x < -thresholdX) {
        handleNo();
      }
    } else if (absY > thresholdY && info.offset.y > 0) {
      handlePass();
    }
  };

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
    playSound('nav_back');
    setShowPurchaseModal(false);
    setPendingSwipe(null);
    if (psg1) {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  // Finished all outcomes
  if (hasFinished || !currentOutcome) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{market.title}</p>
          </div>
          <PSG1BackButton onClick={() => onBack?.()} />
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
    <div className={`flex-1 flex flex-col ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 border-b border-white/10 ${psg1 ? 'px-3 py-2' : 'p-4 gap-3'}`}>
        <div className="flex-1 min-w-0">
          {!psg1 && <p className="text-xs text-gray-500 uppercase tracking-wider">{market.category}</p>}
          <p className={`font-medium truncate ${psg1 ? 'text-xs' : 'text-sm'}`}>{market.title}</p>
        </div>
        {/* Progress */}
        <div className={`flex items-center gap-1 bg-white/5 rounded-lg ${psg1 ? 'px-2 py-1' : 'px-3 py-1.5 gap-2'}`}>
          <span className={`font-bold text-purple-400 ${psg1 ? 'text-xs' : 'text-sm'}`}>
            {currentOutcomeIndex + 1}
          </span>
          <span className={`text-gray-500 ${psg1 ? 'text-[10px]' : 'text-xs'}`}>/</span>
          <span className={`text-gray-400 ${psg1 ? 'text-xs' : 'text-sm'}`}>
            {outcomes.length}
          </span>
        </div>
        <PSG1BackButton onClick={() => onBack?.()} />
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
          style={{ x, y, rotate, opacity: psg1 ? undefined : cardDragOpacity }}
          drag={!psg1}
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
          <div
            className="w-full h-full bg-card-bg border-balatro-thick border-purple-500/40 rounded-balatro-card shadow-hard-lg overflow-hidden flex flex-col"
            style={chargeProgress > 0 ? { transform: `scale(${1 + chargeProgress * 0.07})` } : undefined}
          >
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

            {/* Charge glow overlay (PSG1 only) */}
            {psg1 && chargeDirection && (
              <div
                className="absolute inset-0 pointer-events-none z-20 rounded-balatro-card"
                style={{
                  boxShadow: [
                    `inset 0 0 ${60 * chargeProgress}px ${20 * chargeProgress}px ${
                      chargeDirection === 'right'
                        ? `rgba(34, 197, 94, ${chargeProgress * 0.7})`
                        : `rgba(239, 68, 68, ${chargeProgress * 0.7})`
                    }`,
                    `0 0 ${40 * chargeProgress}px ${15 * chargeProgress}px ${
                      chargeDirection === 'right'
                        ? `rgba(34, 197, 94, ${chargeProgress * 0.5})`
                        : `rgba(239, 68, 68, ${chargeProgress * 0.5})`
                    }`,
                  ].join(', '),
                  border: `${2 + chargeProgress * 2}px solid ${
                    chargeDirection === 'right'
                      ? `rgba(34, 197, 94, ${chargeProgress * 0.8})`
                      : `rgba(239, 68, 68, ${chargeProgress * 0.8})`
                  }`,
                }}
              />
            )}

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
              <div className={psg1 ? "px-4 py-2" : "p-4"}>
                <h2 className={`font-bold text-center font-pixel-body leading-tight ${psg1 ? 'text-base mb-1' : 'text-xl mb-2'}`}>
                  {currentOutcome.label}
                </h2>

                {psg1 && (
                  <p className="text-2xl font-bold text-purple-400 font-pixel-heading text-center mb-1">
                    {formatProbability(currentOutcome.probability)}
                  </p>
                )}

                {!psg1 && (
                  <p className="text-4xl font-bold text-purple-400 font-pixel-heading text-center mb-3">
                    {formatProbability(currentOutcome.probability)}
                  </p>
                )}

                {/* Swipe hints (mobile only, hidden on PSG1) */}
                {!psg1 && (
                  <div className="flex md:hidden items-center justify-between text-sm pt-3 border-t border-white/10">
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
                )}

                {/* PSG1 button hints */}
                {psg1 && (
                  <div className="flex items-center justify-between text-base pt-2 border-t border-white/10">
                    <div className={`flex items-center gap-2 transition-colors ${chargeDirection === 'left' ? 'text-red-300' : 'text-red-400/60'}`}>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">Y</span>
                      <span className="font-bold text-lg">NO</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold text-gray-400">X</span>
                      <span>PASS</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-colors ${chargeDirection === 'right' ? 'text-green-300' : 'text-green-400/60'}`}>
                      <span className="font-bold text-lg">YES</span>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs font-bold">B</span>
                    </div>
                  </div>
                )}

                {/* Charge progress bar (PSG1 only) */}
                {psg1 && chargeDirection && (
                  <div className="h-2 mt-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-none ${
                        chargeDirection === 'right'
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                          : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] ml-auto'
                      }`}
                      style={{ width: `${chargeProgress * 100}%` }}
                    />
                  </div>
                )}

                {/* Pick buttons (desktop only, hidden on PSG1) */}
                <div className={`${psg1 ? 'hidden' : 'hidden md:flex'} gap-2 pt-3 border-t border-white/10`} onPointerDownCapture={(e) => e.stopPropagation()}>
                  <button onClick={handleNo} className={`flex-1 rounded-lg border font-bold transition-colors ${psg1 ? 'py-3 text-base' : 'py-2 text-sm'} ${
                    chargeDirection === 'left'
                      ? 'bg-red-500/40 border-red-400 text-red-300 animate-pulse'
                      : 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30'
                  }`}>
                    NO
                  </button>
                  <button onClick={handlePass} className={`flex-1 rounded-lg bg-gray-500/20 border border-gray-500/50 text-gray-400 font-bold hover:bg-gray-500/30 transition-colors ${psg1 ? 'py-3 text-base' : 'py-2 text-sm'}`}>
                    PASS
                  </button>
                  <button onClick={handleYes} className={`flex-1 rounded-lg border font-bold transition-colors ${psg1 ? 'py-3 text-base' : 'py-2 text-sm'} ${
                    chargeDirection === 'right'
                      ? 'bg-green-500/40 border-green-400 text-green-300 animate-pulse'
                      : 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30'
                  }`}>
                    YES
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress dots (hidden on PSG1 to save vertical space) */}
      {!psg1 && (
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
      )}

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

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ExploreMarket, ExploreOutcome } from '@/lib/jupiter/types';
import { OutcomeCarousel } from './OutcomeCarousel';
import { useExploreStore } from '@/stores/explore';

interface ExploreEventDetailProps {
  market: ExploreMarket;
}

export function ExploreEventDetail({ market }: ExploreEventDetailProps) {
  const router = useRouter();
  const { selectEvent, setOutcomeIndex, addPendingBet } = useExploreStore();

  // Set selected event on mount
  useEffect(() => {
    selectEvent(market);
    setOutcomeIndex(0);
    return () => selectEvent(null);
  }, [market, selectEvent, setOutcomeIndex]);

  const handleBet = (outcome: ExploreOutcome, direction: 'yes' | 'no') => {
    addPendingBet({
      marketId: market.id,
      outcomeId: outcome.id,
      outcomeLabel: outcome.label,
      probability: outcome.probability,
      direction,
    });
    console.log(`Bet ${direction.toUpperCase()} on "${outcome.label}" @ ${Math.round(outcome.probability * 100)}%`);
  };

  const handleBack = () => {
    router.back();
  };

  const handleComplete = () => {
    // When user finishes all outcomes, go back to grid
    router.back();
  };

  return (
    <div className="flex-1 flex flex-col bg-game-bg">
      <OutcomeCarousel
        market={market}
        outcomes={market.outcomes}
        onBet={handleBet}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    </div>
  );
}

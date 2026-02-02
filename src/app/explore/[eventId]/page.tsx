'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExploreEventDetail } from '@/components/explore';
import { getEventPrices } from '@/lib/jupiter/client';
import type { ExploreMarket } from '@/lib/jupiter/types';

export default function ExploreEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [market, setMarket] = useState<ExploreMarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarket() {
      if (!eventId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getEventPrices(eventId);
        if (data) {
          setMarket(data);
        } else {
          setError('Market not found');
        }
      } catch (err) {
        console.error('Failed to load market:', err);
        setError('Failed to load market');
      } finally {
        setIsLoading(false);
      }
    }

    loadMarket();
  }, [eventId]);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col min-h-screen bg-game-bg">
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-4xl"
          >
            ⏳
          </motion.div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !market) {
    return (
      <main className="flex-1 flex flex-col min-h-screen bg-game-bg">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <span className="text-4xl mb-4">😔</span>
          <p className="text-gray-400 mb-4">{error || 'Market not found'}</p>
          <button
            onClick={() => window.history.back()}
            className="btn-pixel-secondary"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-game-bg">
      <ExploreEventDetail market={market} />
    </main>
  );
}

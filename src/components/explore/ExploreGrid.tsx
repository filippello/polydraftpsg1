'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExploreCard } from './ExploreCard';
import { useExploreStore } from '@/stores/explore';
import { getExploreMarkets, getFeaturedMarkets } from '@/lib/jupiter/client';

interface ExploreGridProps {
  initialFetch?: boolean;
}

export function ExploreGrid({ initialFetch = true }: ExploreGridProps) {
  const {
    markets,
    isLoadingMarkets,
    marketsError,
    hasMore,
    cursor,
    setMarkets,
    appendMarkets,
    setLoadingMarkets,
    setMarketsError,
  } = useExploreStore();

  const loadingRef = useRef(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Initial fetch
  useEffect(() => {
    if (!initialFetch || markets.length > 0) return;

    async function loadMarkets() {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoadingMarkets(true);

      try {
        const data = await getFeaturedMarkets(20);
        setMarkets(data);
      } catch (err) {
        console.error('Failed to load markets:', err);
        setMarketsError('Failed to load markets');
      } finally {
        setLoadingMarkets(false);
        loadingRef.current = false;
      }
    }

    loadMarkets();
  }, [initialFetch, markets.length, setMarkets, setLoadingMarkets, setMarketsError]);

  // Load more function
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoadingMarkets(true);

    try {
      const data = await getExploreMarkets({
        limit: 20,
        cursor: cursor ?? undefined,
      });
      appendMarkets(data, null);
    } catch (err) {
      console.error('Failed to load more markets:', err);
    } finally {
      setLoadingMarkets(false);
      loadingRef.current = false;
    }
  }, [cursor, hasMore, appendMarkets, setLoadingMarkets]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMarkets) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMarkets, loadMore]);

  // Error state
  if (marketsError && markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl mb-4">😔</span>
        <p className="text-gray-400 mb-4">{marketsError}</p>
        <button
          onClick={() => {
            setMarketsError(null);
            setLoadingMarkets(true);
            getFeaturedMarkets(20)
              .then(setMarkets)
              .catch(() => setMarketsError('Failed to load markets'))
              .finally(() => setLoadingMarkets(false));
          }}
          className="btn-pixel-secondary text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Loading state (initial)
  if (isLoadingMarkets && markets.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-card-bg border-balatro border-white/10 rounded-balatro-card h-[180px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-gray-400">No markets found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {markets.map((market, index) => (
          <ExploreCard key={market.id} market={market} index={index} />
        ))}
      </div>

      {/* Loading indicator for infinite scroll */}
      {isLoadingMarkets && markets.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center p-4"
        >
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ⏳
            </motion.span>
            Loading more...
          </div>
        </motion.div>
      )}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-4" />

      {/* End of list indicator */}
      {!hasMore && markets.length > 0 && (
        <p className="text-center text-gray-500 text-sm py-4">
          You&apos;ve seen all markets
        </p>
      )}
    </div>
  );
}

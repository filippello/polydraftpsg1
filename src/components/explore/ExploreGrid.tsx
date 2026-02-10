'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExploreCard } from './ExploreCard';
import { useExploreStore } from '@/stores/explore';
import { getExploreMarkets, getFeaturedMarkets } from '@/lib/jupiter/client';
import { isPSG1 } from '@/lib/platform';
import { usePSG1Navigation } from '@/hooks/usePSG1Navigation';

interface ExploreGridProps {
  initialFetch?: boolean;
  onBack?: () => void;
}

export function ExploreGrid({ initialFetch = true, onBack }: ExploreGridProps) {
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

  // PSG1 keyboard navigation
  const psg1 = isPSG1();
  const gridColumns = psg1 ? 3 : 2;
  const router = useRouter();
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const onSelect = useCallback(
    (index: number) => {
      const market = markets[index];
      if (market) router.push(`/explore/${market.id}`);
    },
    [markets, router]
  );

  const { focusedIndex } = usePSG1Navigation({
    enabled: psg1 && markets.length > 0,
    itemCount: markets.length,
    columns: gridColumns,
    onSelect,
    onBack,
  });

  // Auto-scroll focused card into view
  useEffect(() => {
    if (!psg1) return;
    const el = cardRefs.current.get(focusedIndex);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedIndex, psg1]);

  // Prefetch when focus reaches last 2 rows
  useEffect(() => {
    if (!psg1 || markets.length === 0) return;
    const lastRowStart = markets.length - gridColumns * 2;
    if (focusedIndex >= lastRowStart && hasMore && !isLoadingMarkets) {
      loadMore();
    }
  }, [focusedIndex, psg1, markets.length, gridColumns, hasMore, isLoadingMarkets, loadMore]);

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
      <div className={`grid gap-3 p-4 ${isPSG1() ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {[...Array(isPSG1() ? 6 : 4)].map((_, i) => (
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
      <div className={`grid gap-3 p-4 items-start ${isPSG1() ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {markets.map((market, index) => (
          <div
            key={market.id}
            ref={(el) => {
              if (el) cardRefs.current.set(index, el);
              else cardRefs.current.delete(index);
            }}
          >
            <ExploreCard market={market} index={index} focused={psg1 && focusedIndex === index} />
          </div>
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

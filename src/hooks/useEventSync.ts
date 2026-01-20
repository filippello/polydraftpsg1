'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMyPacksStore } from '@/stores/myPacks';

// Polling interval in milliseconds (30 seconds)
const POLL_INTERVAL = 30000;

interface EventResolution {
  id: string;
  status: 'active' | 'resolved';
  winning_outcome: 'a' | 'b' | null;
  resolved_at: string | null;
}

interface SyncResponse {
  events: Record<string, EventResolution>;
}

// Calculate USD won based on betting odds
// $1 bet at given probability = $1 / probability payout
function calculateWinnings(probabilitySnapshot: number): number {
  // Betting odds: $1 / probability
  // 50% = $2.00 payout, 25% = $4.00 payout, 10% = $10.00 payout
  const payout = 1 / probabilitySnapshot;
  return Math.round(payout * 100) / 100; // Round to 2 decimals
}

export function useEventSync(packId: string) {
  const storedPack = useMyPacksStore((state) => state.packs[packId]);
  const resolvePicksForEvent = useMyPacksStore((state) => state.resolvePicksForEvent);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Get unresolved picks from the store directly
  const picks = storedPack?.picks ?? [];
  const unresolvedPicks = picks.filter((pick) => !pick.is_resolved);
  const unresolvedEventIds = unresolvedPicks.map((pick) => pick.event_id);

  const syncEvents = useCallback(async () => {
    // Re-read from store to get latest state
    const currentPack = useMyPacksStore.getState().packs[packId];
    if (!currentPack) return;

    const currentUnresolved = currentPack.picks.filter((p) => !p.is_resolved);
    if (currentUnresolved.length === 0) return;

    const eventIds = currentUnresolved.map((p) => p.event_id);

    try {
      const response = await fetch('/api/events/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        console.error('Failed to sync events:', response.status);
        return;
      }

      const data: SyncResponse = await response.json();

      if (!isMountedRef.current) return;

      // Process resolved events
      for (const [eventId, eventData] of Object.entries(data.events)) {
        if (eventData.status === 'resolved' && eventData.winning_outcome) {
          // Find the pick for this event
          const pick = currentUnresolved.find((p) => p.event_id === eventId);
          if (pick) {
            const isCorrect = pick.picked_outcome === eventData.winning_outcome;
            const pointsAwarded = isCorrect ? calculateWinnings(pick.probability_snapshot) : 0;

            // Update the store
            resolvePicksForEvent(packId, eventId, {
              winningOutcome: eventData.winning_outcome,
              resolvedAt: eventData.resolved_at || new Date().toISOString(),
              isCorrect,
              pointsAwarded,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing events:', error);
    }
  }, [packId, resolvePicksForEvent]);

  // Set up polling
  useEffect(() => {
    isMountedRef.current = true;

    // Don't poll if no pack or all events are resolved
    if (!storedPack || unresolvedEventIds.length === 0) {
      return;
    }

    // Initial sync
    syncEvents();

    // Set up interval
    intervalRef.current = setInterval(syncEvents, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [syncEvents, storedPack, unresolvedEventIds.length]);

  return {
    unresolvedCount: unresolvedEventIds.length,
    isPolling: unresolvedEventIds.length > 0,
    syncNow: syncEvents, // Manual trigger for testing
  };
}

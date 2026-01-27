/**
 * Cron Job: Sync Prices from Polymarket
 *
 * This endpoint should be called periodically (e.g., every 5 minutes)
 * to sync event prices from Polymarket.
 *
 * Vercel Cron: Set up in vercel.json with schedule "0/5 * * * *"
 *
 * Security: Protected by CRON_SECRET header
 */

import { NextResponse } from 'next/server';
import {
  getEventsForPriceSync,
  updateEventProbabilities,
  createSyncLog,
  completeSyncLog,
  getEventTokens,
  updateTokenPrice,
} from '@/lib/supabase/events';
import { fetchMarket, fetchPrice, parseOutcomePrices } from '@/lib/polymarket/client';
import type { Event } from '@/types';

// Verify cron secret for security
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow requests without secret
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, require CRON_SECRET
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - cron endpoint is unprotected');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

interface SyncError {
  event_id: string;
  error: string;
}

/**
 * Sync prices for a single event
 */
async function syncEventPrice(event: Event): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to get prices from tokens first (more efficient)
    const tokens = await getEventTokens(event.id);

    if (tokens.length > 0) {
      // Fetch prices directly from CLOB API using token IDs
      const pricePromises = tokens.map(async (token) => {
        const price = await fetchPrice(token.token_id);
        if (price !== null) {
          await updateTokenPrice(token.token_id, price);
        }
        return { outcome: token.outcome, price };
      });

      const prices = await Promise.all(pricePromises);

      const probA = prices.find((p) => p.outcome === 'a')?.price ?? event.outcome_a_probability;
      const probB = prices.find((p) => p.outcome === 'b')?.price ?? event.outcome_b_probability;
      const probDraw = prices.find((p) => p.outcome === 'draw')?.price ?? undefined;

      await updateEventProbabilities(event.id, probA, probB, probDraw);

      return { success: true };
    }

    // Fallback: Fetch from Gamma API
    const market = await fetchMarket(event.polymarket_market_id);

    if (!market) {
      return { success: false, error: 'Market not found' };
    }

    // Parse prices from market data
    const prices = parseOutcomePrices(market.outcomePrices);
    const probA = prices[0] ?? 0.5;
    const probB = prices[1] ?? 0.5;

    // For 3-outcome markets (draw support)
    const probDraw = event.supports_draw && prices.length > 2 ? prices[2] : undefined;

    await updateEventProbabilities(event.id, probA, probB, probDraw);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const errors: SyncError[] = [];
  let syncedCount = 0;

  // Create sync log entry
  const logId = await createSyncLog('price_sync');

  try {
    // Get events that need price sync
    const events = await getEventsForPriceSync();

    if (events.length === 0) {
      if (logId) {
        await completeSyncLog(logId, 0);
      }
      return NextResponse.json({
        success: true,
        message: 'No events to sync',
        synced: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    // Sync prices in parallel (with concurrency limit)
    const BATCH_SIZE = 10;
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (event) => {
          const result = await syncEventPrice(event);
          return { event, result };
        })
      );

      for (const { event, result } of results) {
        if (result.success) {
          syncedCount++;
        } else {
          errors.push({
            event_id: event.id,
            error: result.error ?? 'Unknown error',
          });
        }
      }
    }

    // Complete sync log
    if (logId) {
      await completeSyncLog(logId, syncedCount, errors);
    }

    return NextResponse.json({
      success: errors.length === 0,
      synced: syncedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in price sync cron:', error);

    if (logId) {
      await completeSyncLog(logId, syncedCount, [
        { event_id: 'global', error: error instanceof Error ? error.message : 'Unknown error' },
      ]);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        synced: syncedCount,
        duration_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}

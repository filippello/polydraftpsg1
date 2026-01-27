/**
 * Cron Job: Resolve Events
 *
 * This endpoint should be called periodically (e.g., every 5 minutes)
 * to check for resolved events and update picks.
 *
 * Flow:
 * 1. Update events that have started to 'active' status
 * 2. Get events with status='active' and polymarket_market_id
 * 3. For each event, call Polymarket API to check resolution
 * 4. If resolved:
 *    - Update events table (status='resolved', winning_outcome)
 *    - Resolve all picks for that event
 *    - Recalculate pack totals
 *
 * Vercel Cron: Set up in vercel.json with schedule "0/5 * * * *"
 *
 * Security: Protected by CRON_SECRET header
 */

import { NextResponse } from 'next/server';
import {
  getEventsToResolve,
  createSyncLog,
  completeSyncLog,
} from '@/lib/supabase/events';
import {
  resolveEvent,
  resolvePicksForEvent,
  updateActiveEvents,
} from '@/lib/supabase/resolution';
import { checkResolution } from '@/lib/polymarket/client';
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

interface ResolutionError {
  event_id: string;
  error: string;
}

interface ResolutionResult {
  event_id: string;
  title: string;
  resolved: boolean;
  winning_outcome?: string;
  picks_resolved?: number;
  points_awarded?: number;
}

/**
 * Process a single event for resolution
 */
async function processEventResolution(event: Event): Promise<{
  success: boolean;
  resolved: boolean;
  result?: ResolutionResult;
  error?: string;
}> {
  try {
    if (!event.polymarket_market_id) {
      return { success: false, resolved: false, error: 'No polymarket_market_id' };
    }

    // Check resolution status from Polymarket API
    const resolution = await checkResolution(event.polymarket_market_id);

    if (!resolution.resolved) {
      // Not resolved yet
      return { success: true, resolved: false };
    }

    if (!resolution.winningOutcome) {
      return { success: false, resolved: false, error: 'Resolved but no winning outcome' };
    }

    // Event is resolved! Update everything
    console.log(`Event resolved: ${event.title} - Winner: ${resolution.winningOutcome}`);

    // 1. Update the event in the database
    const eventUpdated = await resolveEvent(event.id, resolution.winningOutcome);
    if (!eventUpdated) {
      return { success: false, resolved: false, error: 'Failed to update event' };
    }

    // 2. Resolve all picks for this event
    const stats = await resolvePicksForEvent(event.id, resolution.winningOutcome);

    return {
      success: true,
      resolved: true,
      result: {
        event_id: event.id,
        title: event.title,
        resolved: true,
        winning_outcome: resolution.winningOutcome,
        picks_resolved: stats.picksResolved,
        points_awarded: stats.totalPointsAwarded,
      },
    };
  } catch (error) {
    return {
      success: false,
      resolved: false,
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
  const errors: ResolutionError[] = [];
  const resolved: ResolutionResult[] = [];
  let checkedCount = 0;

  // Create sync log entry
  const logId = await createSyncLog('resolution_check');

  try {
    // Step 1: Update events that have started to 'active' status
    const activatedCount = await updateActiveEvents();
    if (activatedCount > 0) {
      console.log(`Activated ${activatedCount} events`);
    }

    // Step 2: Get active events that need resolution check
    const events = await getEventsToResolve();

    if (events.length === 0) {
      if (logId) {
        await completeSyncLog(logId, 0);
      }
      return NextResponse.json({
        success: true,
        message: 'No events to check',
        checked: 0,
        resolved: 0,
        activated: activatedCount,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`Checking ${events.length} events for resolution`);

    // Step 3: Process each event
    const BATCH_SIZE = 5; // Process in smaller batches to avoid timeouts
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (event) => {
          const result = await processEventResolution(event);
          return { event, result };
        })
      );

      for (const { event, result } of results) {
        checkedCount++;

        if (result.success) {
          if (result.resolved && result.result) {
            resolved.push(result.result);
          }
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
      await completeSyncLog(logId, resolved.length, errors);
    }

    return NextResponse.json({
      success: errors.length === 0,
      checked: checkedCount,
      resolved: resolved.length,
      activated: activatedCount,
      failed: errors.length,
      results: resolved.length > 0 ? resolved : undefined,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in resolve events cron:', error);

    if (logId) {
      await completeSyncLog(logId, 0, [
        { event_id: 'global', error: error instanceof Error ? error.message : 'Unknown error' },
      ]);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        checked: checkedCount,
        resolved: resolved.length,
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

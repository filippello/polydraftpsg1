import { NextResponse } from 'next/server';
import { getEventsById, getPicksForEvents } from '@/lib/supabase/resolution';
import type { EventStatus, Outcome } from '@/types';

// Types for event resolution data
interface EventResolution {
  id: string;
  status: EventStatus;
  winning_outcome: Outcome | null;
  resolved_at: string | null;
}

interface PickResolution {
  id: string;
  is_resolved: boolean;
  is_correct: boolean | null;
  points_awarded: number;
}

interface SyncResponse {
  events: Record<string, EventResolution>;
  picks?: Record<string, PickResolution[]>;
}

// POST /api/events/sync
// Body: { eventIds: string[], includeUserPicks?: boolean }
// Returns: { events: { [id]: EventResolution }, picks?: { [eventId]: PickResolution[] } }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventIds, includeUserPicks = false } = body as {
      eventIds: string[];
      includeUserPicks?: boolean;
    };

    if (!Array.isArray(eventIds)) {
      return NextResponse.json(
        { error: 'eventIds must be an array' },
        { status: 400 }
      );
    }

    if (eventIds.length === 0) {
      return NextResponse.json({ events: {}, picks: {} });
    }

    // Fetch events from database (supports both UUIDs and slugs)
    const events = await getEventsById(eventIds);

    // Build response - key by both ID and slug for compatibility
    const response: SyncResponse = { events: {} };

    for (const event of events) {
      const eventData = {
        id: event.id,
        status: event.status,
        winning_outcome: event.winning_outcome ?? null,
        resolved_at: event.resolved_at ?? null,
      };

      // Key by UUID
      response.events[event.id] = eventData;

      // Also key by slug if present (for frontend compatibility)
      if (event.polymarket_slug) {
        response.events[event.polymarket_slug] = eventData;
      }
    }

    // Optionally include user picks resolution status
    if (includeUserPicks) {
      const picksByEvent = await getPicksForEvents(eventIds);
      response.picks = {};

      for (const [eventId, picks] of Object.entries(picksByEvent)) {
        response.picks[eventId] = picks.map((pick) => ({
          id: pick.id,
          is_resolved: pick.is_resolved,
          is_correct: pick.is_correct ?? null,
          points_awarded: pick.points_awarded,
        }));
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in /api/events/sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

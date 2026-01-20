import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Types for event resolution data
interface EventResolution {
  id: string;
  status: 'active' | 'resolved';
  winning_outcome: 'a' | 'b' | null;
  resolved_at: string | null;
}

interface EventsData {
  events: Record<string, EventResolution>;
}

// POST /api/events/sync
// Body: { eventIds: string[] }
// Returns: { events: { [id]: EventResolution } }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventIds } = body as { eventIds: string[] };

    if (!Array.isArray(eventIds)) {
      return NextResponse.json(
        { error: 'eventIds must be an array' },
        { status: 400 }
      );
    }

    // Read events.json file
    const dataPath = path.join(process.cwd(), 'data', 'events.json');

    let eventsData: EventsData;
    try {
      const fileContent = await fs.readFile(dataPath, 'utf-8');
      eventsData = JSON.parse(fileContent);
    } catch {
      // If file doesn't exist or is invalid, return empty events
      eventsData = { events: {} };
    }

    // Filter to only requested event IDs
    const filteredEvents: Record<string, EventResolution> = {};
    for (const eventId of eventIds) {
      if (eventsData.events[eventId]) {
        filteredEvents[eventId] = eventsData.events[eventId];
      }
    }

    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error in /api/events/sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

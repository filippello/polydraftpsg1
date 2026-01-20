import type { Event, EventCategory } from '@/types';

// Import pool data
import sportsPool from '@/../data/pools/sports.json';

export interface EventPool {
  id: string;
  name: string;
  pack_type: string;
  min_events_required: number;
  events: Event[];
}

// Pool registry - maps pack types to their pools
const POOL_REGISTRY: Record<string, EventPool> = {
  sports: sportsPool as EventPool,
};

/**
 * Get the event pool for a specific pack type
 */
export function getPool(packType: string): EventPool | null {
  return POOL_REGISTRY[packType] || null;
}

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select random events from a pool
 * Uses Fisher-Yates shuffle and returns the first N events
 */
export function selectEventsFromPool(pool: EventPool, count: number): Event[] {
  if (pool.events.length < count) {
    console.warn(
      `Pool "${pool.name}" has only ${pool.events.length} events, but ${count} were requested`
    );
    return shuffleArray(pool.events);
  }

  const shuffled = shuffleArray(pool.events);
  const now = new Date().toISOString();

  // Add timestamps to events (required by Event type)
  return shuffled.slice(0, count).map((event) => ({
    ...event,
    category: event.category as EventCategory,
    created_at: event.created_at || now,
    updated_at: event.updated_at || now,
  }));
}

/**
 * Get events for a pack opening
 * Main entry point for the pack opening flow
 */
export function getEventsForPack(packType: string, count: number = 5): Event[] {
  const pool = getPool(packType);

  if (!pool) {
    console.error(`No pool found for pack type: ${packType}`);
    return [];
  }

  if (pool.events.length < pool.min_events_required) {
    console.error(
      `Pool "${pool.name}" doesn't have enough events. Required: ${pool.min_events_required}, Available: ${pool.events.length}`
    );
    return [];
  }

  return selectEventsFromPool(pool, count);
}

/**
 * Check if a pack type has a valid pool
 */
export function hasValidPool(packType: string): boolean {
  const pool = getPool(packType);
  return pool !== null && pool.events.length >= pool.min_events_required;
}

/**
 * Get pool statistics
 */
export function getPoolStats(packType: string): {
  totalEvents: number;
  minRequired: number;
  isValid: boolean;
} | null {
  const pool = getPool(packType);
  if (!pool) return null;

  return {
    totalEvents: pool.events.length,
    minRequired: pool.min_events_required,
    isValid: pool.events.length >= pool.min_events_required,
  };
}

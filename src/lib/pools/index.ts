import type { Event, EventCategory, Rarity, RarityInfo } from '@/types';
import {
  rollTargetRarity,
  getEventRarity,
  calculatePLow,
  getFallbackRarities,
  distanceToRarityBin,
} from '@/lib/rarity';
import { getActiveVenueId } from '@/lib/adapters/config';

// Import pool data for each venue
import polymarketSportsPool from '@/../data/pools/polymarket/sports.json';
import jupiterSportsPool from '@/../data/pools/jupiter/sports.json';

export interface EventPool {
  id: string;
  name: string;
  pack_type: string;
  min_events_required: number;
  events: Event[];
}

// Pool registry - maps venues to their pack type pools
const VENUE_POOLS: Record<string, Record<string, EventPool>> = {
  polymarket: {
    sports: polymarketSportsPool as EventPool,
  },
  jupiter: {
    sports: jupiterSportsPool as EventPool,
  },
};

/**
 * Get the event pool for a specific pack type (from active venue)
 */
export function getPool(packType: string): EventPool | null {
  const venueId = getActiveVenueId();
  return VENUE_POOLS[venueId]?.[packType] || null;
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
 * Pick a random element from an array
 */
function pickRandom<T>(array: T[]): T | null {
  if (array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Add rarity info to an event
 */
function addRarityInfo(event: Event, targetRarity: Rarity): Event {
  const pLow = calculatePLow(event.outcome_a_probability, event.outcome_b_probability);
  const rarity = getEventRarity(event.outcome_a_probability, event.outcome_b_probability);

  const rarityInfo: RarityInfo = {
    pLow,
    rarity,
    targetRarity,
  };

  return {
    ...event,
    rarityInfo,
  };
}

/**
 * Filter events by rarity
 */
function filterEventsByRarity(events: Event[], targetRarity: Rarity): Event[] {
  return events.filter((event) => {
    const eventRarity = getEventRarity(event.outcome_a_probability, event.outcome_b_probability);
    return eventRarity === targetRarity;
  });
}

/**
 * Find the closest event to a target rarity bin
 * Used as fallback when no exact matches exist
 */
function findClosestToRarity(events: Event[], targetRarity: Rarity): Event | null {
  if (events.length === 0) return null;

  let closest: Event | null = null;
  let minDistance = Infinity;

  for (const event of events) {
    const pLow = calculatePLow(event.outcome_a_probability, event.outcome_b_probability);
    const distance = distanceToRarityBin(pLow, targetRarity);

    if (distance < minDistance) {
      minDistance = distance;
      closest = event;
    }
  }

  return closest;
}

/**
 * Select a single event for a target rarity with fallback
 */
function selectEventForRarity(
  availableEvents: Event[],
  targetRarity: Rarity
): { event: Event; targetRarity: Rarity } | null {
  // Try exact match first
  const matchingEvents = filterEventsByRarity(availableEvents, targetRarity);

  if (matchingEvents.length > 0) {
    const event = pickRandom(matchingEvents);
    if (event) {
      return { event, targetRarity };
    }
  }

  // Fallback: try degrading rarity towards common
  const fallbackRarities = getFallbackRarities(targetRarity);

  for (const fallbackRarity of fallbackRarities) {
    if (fallbackRarity === targetRarity) continue; // Already tried

    const fallbackEvents = filterEventsByRarity(availableEvents, fallbackRarity);
    if (fallbackEvents.length > 0) {
      const event = pickRandom(fallbackEvents);
      if (event) {
        return { event, targetRarity };
      }
    }
  }

  // Last resort: find closest event to target rarity
  const closest = findClosestToRarity(availableEvents, targetRarity);
  if (closest) {
    return { event: closest, targetRarity };
  }

  return null;
}

/**
 * Select events from a pool using rarity-based selection
 * Each card rolls for a target rarity based on drop rates
 */
export function selectEventsFromPool(pool: EventPool, count: number): Event[] {
  const now = new Date().toISOString();
  const selectedEvents: Event[] = [];
  const usedEventIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    // Roll target rarity based on drop rates
    const targetRarity = rollTargetRarity();

    // Filter out already selected events
    const availableEvents = pool.events.filter((e) => !usedEventIds.has(e.id));

    if (availableEvents.length === 0) {
      console.warn(`Pool "${pool.name}" ran out of events after selecting ${i} cards`);
      break;
    }

    // Select event for this rarity
    const result = selectEventForRarity(availableEvents, targetRarity);

    if (result) {
      const eventWithRarity = addRarityInfo(result.event, result.targetRarity);

      // Add timestamps
      const finalEvent: Event = {
        ...eventWithRarity,
        category: eventWithRarity.category as EventCategory,
        created_at: eventWithRarity.created_at || now,
        updated_at: eventWithRarity.updated_at || now,
      };

      selectedEvents.push(finalEvent);
      usedEventIds.add(result.event.id);
    }
  }

  return selectedEvents;
}

/**
 * Select random events from a pool (legacy method without rarity)
 * Kept for backward compatibility
 */
export function selectEventsFromPoolRandom(pool: EventPool, count: number): Event[] {
  if (pool.events.length < count) {
    console.warn(
      `Pool "${pool.name}" has only ${pool.events.length} events, but ${count} were requested`
    );
    return shuffleArray(pool.events);
  }

  const shuffled = shuffleArray(pool.events);
  const now = new Date().toISOString();

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
 * Uses rarity-based selection
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

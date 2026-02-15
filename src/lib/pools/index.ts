import type { Event, EventCategory, Rarity, RarityInfo } from '@/types';
import {
  rollTargetRarity,
  getEventRarity,
  calculatePLow,
  getFallbackRarities,
  distanceToRarityBin,
} from '@/lib/rarity';
import { getActiveVenueId } from '@/lib/adapters/config';
import { createClient } from '@/lib/supabase/client';

export interface EventPool {
  id: string;
  name: string;
  pack_type: string;
  min_events_required: number;
  events: Event[];
}

export interface DBPool {
  id: string;
  slug: string;
  name: string;
  venue: string;
  pack_type: string;
  period: string | null;
  min_events_required: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBEvent {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  outcome_a_label: string;
  outcome_b_label: string;
  outcome_a_probability: number;
  outcome_b_probability: number;
  outcome_draw_label: string | null;
  outcome_draw_probability: number | null;
  supports_draw: boolean;
  status: string;
  event_start_at: string | null;
  resolution_deadline_at: string | null;
  polymarket_slug: string | null;
  polymarket_market_id: string | null;
  polymarket_id: string | null;
  volume: number | null;
  venue: string | null;
  venue_event_id: string | null;
  venue_slug: string | null;
  image_url: string | null;
  description: string | null;
  pool_id: string | null;
  period: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the event pool from database for a specific venue and pack type
 */
async function getPoolFromDB(venue: string, packType: string): Promise<EventPool | null> {
  const supabase = createClient();

  console.log('[getPoolFromDB] Fetching pool for:', { venue, packType });

  // Get active pool for venue/pack_type
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('venue', venue)
    .eq('pack_type', packType)
    .eq('is_active', true)
    .single();

  console.log('[getPoolFromDB] Pool result:', { pool, error: poolError?.message });

  if (poolError || !pool) {
    console.warn(`No active pool found for venue=${venue}, pack_type=${packType}`, poolError);
    return null;
  }

  const dbPool = pool as DBPool;

  // Get events in this pool with status 'upcoming'
  console.log('[getPoolFromDB] Fetching events for pool_id:', dbPool.id);

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('pool_id', dbPool.id)
    .eq('status', 'upcoming');

  console.log('[getPoolFromDB] Events result:', { count: events?.length, error: eventsError?.message });

  if (eventsError) {
    console.error('Error fetching events for pool:', eventsError);
    return null;
  }

  const dbEvents = (events || []) as DBEvent[];

  console.log('[getPoolFromDB] Sample event image_url (raw):', dbEvents[0]?.image_url);

  // Map DB events to Event type
  const mappedEvents: Event[] = dbEvents.map((e) => ({
    id: e.id,
    venue: e.venue || venue,
    venue_event_id: e.venue_event_id || undefined,
    venue_slug: e.venue_slug || undefined,
    polymarket_market_id: e.polymarket_market_id || undefined,
    polymarket_slug: e.polymarket_slug || undefined,
    polymarket_id: e.polymarket_id || undefined,
    volume: e.volume || undefined,
    title: e.title,
    image_url: e.image_url || undefined,
    description: e.description || undefined,
    category: e.category as EventCategory,
    subcategory: e.subcategory || undefined,
    outcome_a_label: e.outcome_a_label,
    outcome_b_label: e.outcome_b_label,
    outcome_a_probability: e.outcome_a_probability,
    outcome_b_probability: e.outcome_b_probability,
    outcome_draw_label: e.outcome_draw_label || undefined,
    outcome_draw_probability: e.outcome_draw_probability || undefined,
    supports_draw: e.supports_draw,
    status: e.status as Event['status'],
    event_start_at: e.event_start_at || undefined,
    resolution_deadline_at: e.resolution_deadline_at || undefined,
    is_featured: false,
    priority_score: 0,
    created_at: e.created_at,
    updated_at: e.updated_at,
  }));

  console.log('[getPoolFromDB] Sample event image_url (mapped):', mappedEvents[0]?.image_url);

  return {
    id: dbPool.slug,
    name: dbPool.name,
    pack_type: dbPool.pack_type,
    min_events_required: dbPool.min_events_required,
    events: mappedEvents,
  };
}

/**
 * Get the event pool for a specific pack type (from active venue)
 * Async version - reads from database
 */
export async function getPool(packType: string): Promise<EventPool | null> {
  const venueId = getActiveVenueId();
  return getPoolFromDB(venueId, packType);
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
 *
 * NOTE: This is now an async function that reads from the database
 */
export async function getEventsForPack(packType: string, count: number = 5): Promise<Event[]> {
  const pool = await getPool(packType);

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
export async function hasValidPool(packType: string): Promise<boolean> {
  const pool = await getPool(packType);
  return pool !== null && pool.events.length >= pool.min_events_required;
}

/**
 * Get pool statistics
 */
export async function getPoolStats(packType: string): Promise<{
  totalEvents: number;
  minRequired: number;
  isValid: boolean;
} | null> {
  const pool = await getPool(packType);
  if (!pool) return null;

  return {
    totalEvents: pool.events.length,
    minRequired: pool.min_events_required,
    isValid: pool.events.length >= pool.min_events_required,
  };
}

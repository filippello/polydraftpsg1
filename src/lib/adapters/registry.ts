/**
 * Venue Adapter Registry
 *
 * Singleton registry for managing venue adapters.
 * Allows registering and retrieving adapters by venue ID.
 */

import type { VenueAdapter, VenueId } from './types';

class VenueAdapterRegistry {
  private adapters: Map<VenueId, VenueAdapter> = new Map();
  private defaultVenueId: VenueId = 'polymarket';

  /**
   * Register an adapter for a venue
   */
  register(adapter: VenueAdapter): void {
    if (this.adapters.has(adapter.venueId)) {
      console.warn(`Adapter for venue "${adapter.venueId}" is being overwritten`);
    }
    this.adapters.set(adapter.venueId, adapter);
  }

  /**
   * Get an adapter by venue ID
   * @throws Error if adapter not found
   */
  get(venueId: VenueId): VenueAdapter {
    const adapter = this.adapters.get(venueId);
    if (!adapter) {
      throw new Error(`No adapter registered for venue: ${venueId}`);
    }
    return adapter;
  }

  /**
   * Get an adapter by venue ID, returning null if not found
   */
  getOrNull(venueId: VenueId): VenueAdapter | null {
    return this.adapters.get(venueId) ?? null;
  }

  /**
   * Check if an adapter is registered for a venue
   */
  has(venueId: VenueId): boolean {
    return this.adapters.has(venueId);
  }

  /**
   * Get all registered venue IDs
   */
  getVenueIds(): VenueId[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Get all registered adapters
   */
  getAll(): VenueAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get the default venue adapter
   */
  getDefault(): VenueAdapter {
    return this.get(this.defaultVenueId);
  }

  /**
   * Set the default venue ID
   */
  setDefaultVenueId(venueId: VenueId): void {
    if (!this.adapters.has(venueId)) {
      throw new Error(`Cannot set default to unregistered venue: ${venueId}`);
    }
    this.defaultVenueId = venueId;
  }

  /**
   * Get the default venue ID
   */
  getDefaultVenueId(): VenueId {
    return this.defaultVenueId;
  }

  /**
   * Remove an adapter (useful for testing)
   */
  unregister(venueId: VenueId): boolean {
    return this.adapters.delete(venueId);
  }

  /**
   * Clear all adapters (useful for testing)
   */
  clear(): void {
    this.adapters.clear();
  }
}

// Singleton instance
export const venueRegistry = new VenueAdapterRegistry();

// Export type for testing/mocking
export type { VenueAdapterRegistry };

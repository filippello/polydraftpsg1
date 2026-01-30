-- ============================================
-- Migration 004: Multi-Venue Support
-- ============================================
-- This migration adds support for multiple prediction market venues
-- (Polymarket, Jupiter, etc.) without breaking existing functionality.
-- All changes are additive with sensible defaults.

-- ============================================
-- 1. Add venue columns to events table
-- ============================================

-- Venue identifier (defaults to 'polymarket' for existing events)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT NOT NULL DEFAULT 'polymarket';

-- Generic venue identifiers (venue-agnostic)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_event_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_slug TEXT;

-- ============================================
-- 2. Populate venue columns from existing data
-- ============================================

-- Copy existing polymarket IDs to new venue columns
UPDATE events
SET
  venue_event_id = polymarket_market_id,
  venue_slug = polymarket_slug
WHERE venue = 'polymarket'
  AND venue_event_id IS NULL;

-- ============================================
-- 3. Create venue_tokens table (generalized)
-- ============================================

CREATE TABLE IF NOT EXISTS venue_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,

  -- Venue identification
  venue TEXT NOT NULL,

  -- Outcome mapping
  outcome TEXT NOT NULL CHECK (outcome IN ('a', 'b', 'draw')),
  outcome_label TEXT,

  -- Token identifier (venue-specific)
  venue_token_id TEXT NOT NULL,

  -- Price info
  last_price DECIMAL(5,4),
  last_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Each event can only have one token per outcome
  UNIQUE(event_id, outcome),
  -- Each venue token ID is unique within a venue
  UNIQUE(venue, venue_token_id)
);

CREATE INDEX IF NOT EXISTS idx_venue_tokens_event ON venue_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_venue_tokens_venue ON venue_tokens(venue);
CREATE INDEX IF NOT EXISTS idx_venue_tokens_venue_token ON venue_tokens(venue_token_id);

-- ============================================
-- 4. Copy existing data from polymarket_tokens
-- ============================================

INSERT INTO venue_tokens (event_id, venue, outcome, outcome_label, venue_token_id, last_price, last_updated_at, created_at)
SELECT
  event_id,
  'polymarket' as venue,
  outcome,
  outcome_label,
  token_id as venue_token_id,
  last_price,
  last_updated_at,
  created_at
FROM polymarket_tokens
ON CONFLICT (event_id, outcome) DO NOTHING;

-- ============================================
-- 5. Create indexes for venue-aware queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue);
CREATE INDEX IF NOT EXISTS idx_events_venue_event_id ON events(venue_event_id);
CREATE INDEX IF NOT EXISTS idx_events_venue_slug ON events(venue_slug);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_venue_status ON events(venue, status);

-- ============================================
-- 6. Create unique constraints for venue-specific IDs
-- ============================================

-- Ensure venue_slug is unique within a venue
-- (different venues can have same slug)
ALTER TABLE events ADD CONSTRAINT events_venue_slug_unique UNIQUE (venue, venue_slug);

-- Ensure venue_event_id is unique within a venue
ALTER TABLE events ADD CONSTRAINT events_venue_event_id_unique UNIQUE (venue, venue_event_id);

-- ============================================
-- 7. RLS for venue_tokens table
-- ============================================

ALTER TABLE venue_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Venue tokens are viewable by everyone"
ON venue_tokens FOR SELECT USING (true);

-- ============================================
-- 8. Helper function for venue-aware price updates
-- ============================================

CREATE OR REPLACE FUNCTION update_event_probabilities_v2(
  p_event_id UUID,
  p_prob_a DECIMAL(5,4),
  p_prob_b DECIMAL(5,4),
  p_prob_draw DECIMAL(5,4) DEFAULT NULL,
  p_venue TEXT DEFAULT 'polymarket'
)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET
    outcome_a_probability = p_prob_a,
    outcome_b_probability = p_prob_b,
    outcome_draw_probability = COALESCE(p_prob_draw, outcome_draw_probability),
    last_price_sync_at = now(),
    updated_at = now()
  WHERE id = p_event_id
    AND venue = p_venue;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Update sync log to support venues
-- ============================================

ALTER TABLE polymarket_sync_log ADD COLUMN IF NOT EXISTS venue TEXT DEFAULT 'polymarket';
CREATE INDEX IF NOT EXISTS idx_sync_log_venue ON polymarket_sync_log(venue);

-- ============================================
-- Notes:
-- ============================================
-- - Existing polymarket_* columns are preserved for backward compatibility
-- - New queries should prefer venue_* columns
-- - polymarket_tokens table is kept for backward compatibility
-- - New tokens should be added to venue_tokens table
-- - Migration 005 will relax NOT NULL constraints on legacy columns

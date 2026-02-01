-- ============================================
-- Migration 005: Database-backed Pools
-- ============================================

-- 1. Create pools table
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  slug TEXT UNIQUE NOT NULL,           -- e.g., "week4-sports"
  name TEXT NOT NULL,                   -- e.g., "Sports Pool - Week 4"

  -- Configuration
  venue TEXT NOT NULL DEFAULT 'polymarket',
  pack_type TEXT NOT NULL DEFAULT 'sports',
  min_events_required INTEGER NOT NULL DEFAULT 5,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Time boundaries (optional)
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add pool_id to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS pool_id UUID REFERENCES pools(id);

-- 3. Indexes
CREATE INDEX idx_pools_venue ON pools(venue);
CREATE INDEX idx_pools_pack_type ON pools(pack_type);
CREATE INDEX idx_pools_is_active ON pools(is_active);
CREATE INDEX idx_events_pool_id ON events(pool_id);

-- 4. RLS
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pools are viewable by everyone" ON pools FOR SELECT USING (true);

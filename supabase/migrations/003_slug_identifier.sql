-- ============================================
-- Migration 003: Slug as Primary Identifier + New Fields
-- ============================================

-- 1. Hacer polymarket_slug UNIQUE (identificador principal)
ALTER TABLE events ADD CONSTRAINT events_polymarket_slug_unique UNIQUE (polymarket_slug);
CREATE INDEX IF NOT EXISTS idx_events_polymarket_slug ON events(polymarket_slug);

-- 2. Nuevos campos para data de Polymarket
ALTER TABLE events ADD COLUMN IF NOT EXISTS polymarket_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS volume DECIMAL(15,5);

-- 3. Agregar outcome_label a polymarket_tokens para mapeo
ALTER TABLE polymarket_tokens ADD COLUMN IF NOT EXISTS outcome_label TEXT;

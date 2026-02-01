-- ============================================
-- Migration 008: Relax Polymarket-specific constraints
-- ============================================
-- Makes polymarket_market_id nullable to support non-Polymarket venues

ALTER TABLE events ALTER COLUMN polymarket_market_id DROP NOT NULL;

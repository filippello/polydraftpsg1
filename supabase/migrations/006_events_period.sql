-- Add period column to events table
-- This stores the period (e.g., "week4") directly on each event for reference

ALTER TABLE events ADD COLUMN IF NOT EXISTS period TEXT;
CREATE INDEX IF NOT EXISTS idx_events_period ON events(period);

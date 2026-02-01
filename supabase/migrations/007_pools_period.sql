-- Add period column to pools table
ALTER TABLE pools ADD COLUMN IF NOT EXISTS period TEXT;
CREATE INDEX IF NOT EXISTS idx_pools_period ON pools(period);

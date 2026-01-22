-- ============================================
-- Migration 002: Draw Support & Polymarket Tokens
-- ============================================

-- 1. Add draw support to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS supports_draw BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS outcome_draw_label TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS outcome_draw_probability DECIMAL(5,4);

-- Update winning_outcome constraint to include 'draw'
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_winning_outcome_check;
ALTER TABLE events ADD CONSTRAINT events_winning_outcome_check
  CHECK (winning_outcome IN ('a', 'b', 'draw', NULL));

-- 2. Update user_picks for draw support
ALTER TABLE user_picks DROP CONSTRAINT IF EXISTS user_picks_picked_outcome_check;
ALTER TABLE user_picks ADD CONSTRAINT user_picks_picked_outcome_check
  CHECK (picked_outcome IN ('a', 'b', 'draw'));

ALTER TABLE user_picks ADD COLUMN IF NOT EXISTS draw_probability_snapshot DECIMAL(5,4);

-- 3. Create polymarket_tokens table
-- Each outcome in Polymarket has a unique token ID for price fetching
CREATE TABLE IF NOT EXISTS polymarket_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,

  -- Token info
  outcome TEXT NOT NULL CHECK (outcome IN ('a', 'b', 'draw')),
  token_id TEXT NOT NULL,

  -- Last fetched price info
  last_price DECIMAL(5,4),
  last_updated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(event_id, outcome),
  UNIQUE(token_id)
);

CREATE INDEX IF NOT EXISTS idx_polymarket_tokens_event ON polymarket_tokens(event_id);
CREATE INDEX IF NOT EXISTS idx_polymarket_tokens_token_id ON polymarket_tokens(token_id);

-- 4. RLS for tokens table (public read access)
ALTER TABLE polymarket_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tokens are viewable by everyone"
ON polymarket_tokens FOR SELECT USING (true);

-- 5. Helper function for updating event probabilities
CREATE OR REPLACE FUNCTION update_event_probabilities(
  p_event_id UUID,
  p_prob_a DECIMAL(5,4),
  p_prob_b DECIMAL(5,4),
  p_prob_draw DECIMAL(5,4) DEFAULT NULL
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
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Helper function for creating picks with fresh prices
CREATE OR REPLACE FUNCTION create_pick_with_fresh_price(
  p_user_pack_id UUID,
  p_event_id UUID,
  p_position INTEGER,
  p_picked_outcome TEXT,
  p_probability DECIMAL(5,4),
  p_opposite_probability DECIMAL(5,4),
  p_draw_probability DECIMAL(5,4) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_pick_id UUID;
BEGIN
  INSERT INTO user_picks (
    user_pack_id,
    event_id,
    position,
    picked_outcome,
    probability_snapshot,
    opposite_probability_snapshot,
    draw_probability_snapshot
  ) VALUES (
    p_user_pack_id,
    p_event_id,
    p_position,
    p_picked_outcome,
    p_probability,
    p_opposite_probability,
    p_draw_probability
  )
  RETURNING id INTO v_pick_id;

  RETURN v_pick_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Update seed data to include draw support for football events
UPDATE events SET
  supports_draw = true,
  outcome_draw_label = 'Draw',
  outcome_draw_probability = 0.25
WHERE subcategory IN ('epl', 'laliga', 'ucl')
  AND outcome_a_label != 'Yes';

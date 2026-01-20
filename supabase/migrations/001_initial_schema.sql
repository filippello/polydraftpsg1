-- ============================================
-- Polydraft Database Schema v1
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Events Table (from Polymarket)
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Polymarket mapping
  polymarket_market_id TEXT UNIQUE NOT NULL,
  polymarket_condition_id TEXT,
  polymarket_slug TEXT,

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Binary outcomes
  outcome_a_label TEXT NOT NULL DEFAULT 'Yes',
  outcome_b_label TEXT NOT NULL DEFAULT 'No',

  -- Current probabilities (synced from Polymarket)
  outcome_a_probability DECIMAL(5,4) DEFAULT 0.5,
  outcome_b_probability DECIMAL(5,4) DEFAULT 0.5,
  last_price_sync_at TIMESTAMPTZ,

  -- Categorization
  category TEXT NOT NULL DEFAULT 'sports',
  subcategory TEXT,
  league TEXT,

  -- Timing
  event_start_at TIMESTAMPTZ,
  resolution_deadline_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'pending_resolution', 'resolved', 'cancelled')),

  -- Resolution data (filled when resolved)
  resolved_at TIMESTAMPTZ,
  winning_outcome TEXT CHECK (winning_outcome IN ('a', 'b', NULL)),

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  priority_score INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for events
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_subcategory ON events(subcategory);
CREATE INDEX idx_events_polymarket_market_id ON events(polymarket_market_id);
CREATE INDEX idx_events_resolution_deadline ON events(resolution_deadline_at);
CREATE INDEX idx_events_priority ON events(priority_score DESC);

-- ============================================
-- 2. Pack Types
-- ============================================

CREATE TABLE pack_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Visual theming
  icon_url TEXT,
  background_color TEXT DEFAULT '#16213e',
  pixel_art_theme TEXT DEFAULT 'default',

  -- Pack configuration
  cards_per_pack INTEGER NOT NULL DEFAULT 5,

  -- Eligibility filters (JSONB for flexibility)
  eligibility_filters JSONB NOT NULL DEFAULT '{}',

  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default Sports pack type
INSERT INTO pack_types (slug, name, description, eligibility_filters, pixel_art_theme) VALUES
('sports', 'Sports Pack', 'All sports events', '{"category": "sports"}', 'sports');

-- ============================================
-- 3. Anonymous Sessions (for anonymous-first auth)
-- ============================================

CREATE TABLE anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),

  -- Store any anonymous user data
  data JSONB DEFAULT '{}'
);

CREATE INDEX idx_anonymous_sessions_anonymous_id ON anonymous_sessions(anonymous_id);
CREATE INDEX idx_anonymous_sessions_user_id ON anonymous_sessions(user_id);

-- ============================================
-- 4. User Profiles
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Can be linked to auth user OR anonymous session
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,

  -- Display info
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  pixel_avatar_config JSONB,

  -- Lifetime stats
  total_points DECIMAL(12,2) DEFAULT 0,
  total_packs_opened INTEGER DEFAULT 0,
  total_picks_made INTEGER DEFAULT 0,
  total_correct_picks INTEGER DEFAULT 0,

  -- Streaks
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Category-specific stats
  category_stats JSONB DEFAULT '{}',

  -- Achievements
  achievements JSONB DEFAULT '[]',

  -- Best performances
  best_weekly_rank INTEGER,
  best_weekly_points DECIMAL(10,2),

  -- Preferences
  favorite_pack_types TEXT[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"resolution": true, "leaderboard": true}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Either user_id or anonymous_id must be set
  CONSTRAINT user_or_anonymous CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL),
  CONSTRAINT unique_user_id UNIQUE (user_id),
  CONSTRAINT unique_anonymous_id UNIQUE (anonymous_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_anonymous_id ON user_profiles(anonymous_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- ============================================
-- 5. User Packs (opened packs)
-- ============================================

CREATE TABLE user_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner (can be user_id or anonymous_id)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  pack_type_id UUID REFERENCES pack_types(id) NOT NULL,

  -- Pack metadata
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Resolution tracking
  resolution_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (resolution_status IN ('pending', 'partially_resolved', 'fully_resolved')),

  -- Sequential reveal state
  current_reveal_index INTEGER DEFAULT 0,
  last_reveal_at TIMESTAMPTZ,

  -- Scoring
  total_points DECIMAL(10,2) DEFAULT 0,
  correct_picks INTEGER DEFAULT 0,

  -- Timestamps
  fully_resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Either user_id or anonymous_id must be set
  CONSTRAINT pack_user_or_anonymous CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE INDEX idx_user_packs_user_id ON user_packs(user_id);
CREATE INDEX idx_user_packs_anonymous_id ON user_packs(anonymous_id);
CREATE INDEX idx_user_packs_profile_id ON user_packs(profile_id);
CREATE INDEX idx_user_packs_resolution_status ON user_packs(resolution_status);
CREATE INDEX idx_user_packs_opened_at ON user_packs(opened_at DESC);

-- ============================================
-- 6. User Picks (individual picks within a pack)
-- ============================================

CREATE TABLE user_picks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_pack_id UUID REFERENCES user_packs(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) NOT NULL,

  -- Card position in pack (1-5)
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),

  -- User's pick
  picked_outcome TEXT NOT NULL CHECK (picked_outcome IN ('a', 'b')),
  picked_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Probability snapshot at pick time
  probability_snapshot DECIMAL(5,4) NOT NULL,
  opposite_probability_snapshot DECIMAL(5,4) NOT NULL,

  -- Resolution
  is_resolved BOOLEAN DEFAULT false,
  is_correct BOOLEAN,
  resolved_at TIMESTAMPTZ,

  -- Points awarded (calculated on resolution)
  points_awarded DECIMAL(10,2) DEFAULT 0,

  -- Animation state
  reveal_animation_played BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_pack_id, position),
  UNIQUE(user_pack_id, event_id)
);

CREATE INDEX idx_user_picks_user_pack_id ON user_picks(user_pack_id);
CREATE INDEX idx_user_picks_event_id ON user_picks(event_id);
CREATE INDEX idx_user_picks_is_resolved ON user_picks(is_resolved);

-- ============================================
-- 7. Leaderboards
-- ============================================

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Time period (week)
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Leaderboard type
  leaderboard_type TEXT NOT NULL DEFAULT 'global'
    CHECK (leaderboard_type IN ('global', 'category', 'pack_type')),
  category_filter TEXT,

  is_finalized BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(week_start, leaderboard_type, category_filter)
);

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,

  -- Stats for this period
  total_points DECIMAL(10,2) NOT NULL DEFAULT 0,
  packs_opened INTEGER DEFAULT 0,
  picks_made INTEGER DEFAULT 0,
  correct_picks INTEGER DEFAULT 0,
  accuracy_rate DECIMAL(5,4),

  -- Calculated rank
  rank INTEGER,
  previous_rank INTEGER,

  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(leaderboard_id, profile_id)
);

CREATE INDEX idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);
CREATE INDEX idx_leaderboard_entries_total_points ON leaderboard_entries(total_points DESC);

-- ============================================
-- 8. Polymarket Sync Tracking
-- ============================================

CREATE TABLE polymarket_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_type TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  events_synced INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

CREATE TABLE resolution_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE NOT NULL,
  priority INTEGER DEFAULT 0,
  last_check_at TIMESTAMPTZ,
  check_count INTEGER DEFAULT 0,
  next_check_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_resolution_queue_next_check ON resolution_queue(next_check_at);

-- ============================================
-- 9. Helper Functions
-- ============================================

-- Get or create profile for anonymous user
CREATE OR REPLACE FUNCTION get_or_create_anonymous_profile(p_anonymous_id TEXT)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Try to find existing profile
  SELECT id INTO v_profile_id
  FROM user_profiles
  WHERE anonymous_id = p_anonymous_id;

  -- If not found, create new profile
  IF v_profile_id IS NULL THEN
    INSERT INTO user_profiles (anonymous_id)
    VALUES (p_anonymous_id)
    RETURNING id INTO v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Update pack totals after pick resolution
CREATE OR REPLACE FUNCTION update_pack_totals(p_pack_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_packs
  SET
    total_points = (
      SELECT COALESCE(SUM(points_awarded), 0)
      FROM user_picks
      WHERE user_pack_id = p_pack_id AND is_resolved = true
    ),
    correct_picks = (
      SELECT COUNT(*)
      FROM user_picks
      WHERE user_pack_id = p_pack_id AND is_correct = true
    ),
    resolution_status = CASE
      WHEN (SELECT COUNT(*) FROM user_picks WHERE user_pack_id = p_pack_id AND is_resolved = false) = 0
      THEN 'fully_resolved'
      WHEN (SELECT COUNT(*) FROM user_picks WHERE user_pack_id = p_pack_id AND is_resolved = true) > 0
      THEN 'partially_resolved'
      ELSE 'pending'
    END,
    updated_at = now()
  WHERE id = p_pack_id;
END;
$$ LANGUAGE plpgsql;

-- Update user profile stats
CREATE OR REPLACE FUNCTION update_user_profile_stats(p_profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET
    total_points = (
      SELECT COALESCE(SUM(total_points), 0)
      FROM user_packs
      WHERE profile_id = p_profile_id
    ),
    total_packs_opened = (
      SELECT COUNT(*)
      FROM user_packs
      WHERE profile_id = p_profile_id
    ),
    total_picks_made = (
      SELECT COUNT(*)
      FROM user_picks up
      JOIN user_packs pack ON pack.id = up.user_pack_id
      WHERE pack.profile_id = p_profile_id
    ),
    total_correct_picks = (
      SELECT COUNT(*)
      FROM user_picks up
      JOIN user_packs pack ON pack.id = up.user_pack_id
      WHERE pack.profile_id = p_profile_id AND up.is_correct = true
    ),
    updated_at = now()
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql;

-- Get current week's leaderboard ID (create if needed)
CREATE OR REPLACE FUNCTION get_current_week_leaderboard()
RETURNS UUID AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_leaderboard_id UUID;
BEGIN
  -- Calculate current week boundaries (Monday to Sunday)
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Try to find existing leaderboard
  SELECT id INTO v_leaderboard_id
  FROM leaderboards
  WHERE week_start = v_week_start AND leaderboard_type = 'global';

  -- If not found, create new leaderboard
  IF v_leaderboard_id IS NULL THEN
    INSERT INTO leaderboards (week_start, week_end, leaderboard_type)
    VALUES (v_week_start, v_week_end, 'global')
    RETURNING id INTO v_leaderboard_id;
  END IF;

  RETURN v_leaderboard_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Row Level Security (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON user_profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (
  auth.uid() = user_id OR
  anonymous_id = current_setting('app.anonymous_id', true)
);

CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  anonymous_id = current_setting('app.anonymous_id', true)
);

-- Policies for user_packs (viewable by owner)
CREATE POLICY "Users can view own packs"
ON user_packs FOR SELECT
USING (
  auth.uid() = user_id OR
  anonymous_id = current_setting('app.anonymous_id', true)
);

CREATE POLICY "Users can insert own packs"
ON user_packs FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR
  anonymous_id = current_setting('app.anonymous_id', true)
);

CREATE POLICY "Users can update own packs"
ON user_packs FOR UPDATE
USING (
  auth.uid() = user_id OR
  anonymous_id = current_setting('app.anonymous_id', true)
);

-- Policies for user_picks
CREATE POLICY "Users can view own picks"
ON user_picks FOR SELECT
USING (
  user_pack_id IN (
    SELECT id FROM user_packs
    WHERE auth.uid() = user_id OR
          anonymous_id = current_setting('app.anonymous_id', true)
  )
);

CREATE POLICY "Users can insert own picks"
ON user_picks FOR INSERT
WITH CHECK (
  user_pack_id IN (
    SELECT id FROM user_packs
    WHERE auth.uid() = user_id OR
          anonymous_id = current_setting('app.anonymous_id', true)
  )
);

-- Policies for anonymous_sessions
CREATE POLICY "Anonymous sessions are accessible by owner"
ON anonymous_sessions FOR ALL
USING (
  anonymous_id = current_setting('app.anonymous_id', true) OR
  user_id = auth.uid()
);

-- Events, pack_types, and leaderboards are public read
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone"
ON events FOR SELECT USING (true);

ALTER TABLE pack_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pack types are viewable by everyone"
ON pack_types FOR SELECT USING (true);

ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboards are viewable by everyone"
ON leaderboards FOR SELECT USING (true);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard entries are viewable by everyone"
ON leaderboard_entries FOR SELECT USING (true);

-- ============================================
-- 11. Seed Data for Development
-- ============================================

-- Insert sample sports events for testing
INSERT INTO events (polymarket_market_id, title, description, outcome_a_label, outcome_b_label, outcome_a_probability, outcome_b_probability, category, subcategory, status) VALUES
('mock-event-1', 'Manchester United vs Liverpool', 'Premier League Match', 'Man United', 'Liverpool', 0.35, 0.65, 'sports', 'epl', 'active'),
('mock-event-2', 'Barcelona vs Real Madrid', 'La Liga El Clasico', 'Barcelona', 'Real Madrid', 0.45, 0.55, 'sports', 'laliga', 'active'),
('mock-event-3', 'Lakers vs Celtics', 'NBA Regular Season', 'Lakers', 'Celtics', 0.40, 0.60, 'sports', 'nba', 'active'),
('mock-event-4', 'Chiefs vs 49ers', 'NFL Playoff Game', 'Chiefs', '49ers', 0.55, 0.45, 'sports', 'nfl', 'active'),
('mock-event-5', 'Djokovic vs Alcaraz', 'Wimbledon Final', 'Djokovic', 'Alcaraz', 0.48, 0.52, 'sports', 'tennis', 'active'),
('mock-event-6', 'Arsenal vs Chelsea', 'Premier League Derby', 'Arsenal', 'Chelsea', 0.50, 0.50, 'sports', 'epl', 'active'),
('mock-event-7', 'Warriors vs Bucks', 'NBA Finals Game 7', 'Warriors', 'Bucks', 0.52, 0.48, 'sports', 'nba', 'active'),
('mock-event-8', 'PSG vs Bayern', 'Champions League', 'PSG', 'Bayern', 0.42, 0.58, 'sports', 'ucl', 'active'),
('mock-event-9', 'Verstappen wins next race?', 'F1 Grand Prix', 'Yes', 'No', 0.70, 0.30, 'sports', 'f1', 'active'),
('mock-event-10', 'Yankees vs Dodgers', 'MLB World Series', 'Yankees', 'Dodgers', 0.45, 0.55, 'sports', 'mlb', 'active');

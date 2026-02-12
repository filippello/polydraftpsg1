-- ============================================
-- 009: Wallet Authentication (PSG1)
-- ============================================

-- 1. Auth nonces table for wallet sign-in challenge-response
CREATE TABLE auth_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  used BOOLEAN DEFAULT false
);

CREATE INDEX idx_auth_nonces_wallet_address ON auth_nonces(wallet_address);
CREATE INDEX idx_auth_nonces_expires_at ON auth_nonces(expires_at);

-- RLS: service role only (API routes use service client)
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;

-- No public policies — only service role can access

-- 2. Add wallet_address to user_profiles
ALTER TABLE user_profiles ADD COLUMN wallet_address TEXT UNIQUE;

CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address);

-- Update constraint: allow wallet-only profiles
ALTER TABLE user_profiles DROP CONSTRAINT user_or_anonymous;
ALTER TABLE user_profiles ADD CONSTRAINT user_or_anonymous_or_wallet
  CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL OR wallet_address IS NOT NULL);

-- 3. Helper function: get or create profile by wallet address
CREATE OR REPLACE FUNCTION get_or_create_wallet_profile(p_wallet_address TEXT)
RETURNS UUID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  SELECT id INTO v_profile_id
  FROM user_profiles
  WHERE wallet_address = p_wallet_address;

  IF v_profile_id IS NULL THEN
    INSERT INTO user_profiles (wallet_address)
    VALUES (p_wallet_address)
    RETURNING id INTO v_profile_id;
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

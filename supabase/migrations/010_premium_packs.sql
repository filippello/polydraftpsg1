-- Premium pack purchase fields
ALTER TABLE user_packs ADD COLUMN is_premium BOOLEAN DEFAULT false;
ALTER TABLE user_packs ADD COLUMN payment_signature TEXT;
ALTER TABLE user_packs ADD COLUMN payment_amount DECIMAL(10,6);
ALTER TABLE user_packs ADD COLUMN buyer_wallet TEXT;

-- Ensure payment_signature is unique (only for non-null values)
CREATE UNIQUE INDEX idx_user_packs_payment_signature
  ON user_packs(payment_signature) WHERE payment_signature IS NOT NULL;

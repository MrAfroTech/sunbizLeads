-- ============================================
-- Orlando Pirates Wallet Dual-Mode Update
-- ============================================
-- Run this SQL AFTER the base wallet setup
-- Adds QR/NFC mode support and wallet passes
-- ============================================

-- Add wallet mode columns to wallets table
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS wallet_mode VARCHAR(10) DEFAULT 'qr' CHECK (wallet_mode IN ('qr', 'nfc')),
ADD COLUMN IF NOT EXISTS apple_pass_serial VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_pass_id VARCHAR(255);

-- Create wallet_passes table
CREATE TABLE IF NOT EXISTS wallet_passes (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Wallet reference
  wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  
  -- Platform information
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('apple', 'google')),
  
  -- Pass identification
  serial_number VARCHAR(255) NOT NULL, -- Apple pass serial or Google pass ID
  pass_type_id VARCHAR(255), -- Apple pass type identifier
  
  -- Pass data (stored as JSONB for flexibility)
  pass_data JSONB, -- Contains pass configuration, tokens, etc.
  
  -- Pass status
  status VARCHAR(50) DEFAULT 'active', -- active, revoked, expired
  
  -- Device registration (Apple Wallet)
  device_library_identifier VARCHAR(255), -- Apple device ID
  push_token VARCHAR(255), -- For push notifications
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(wallet_id, platform, serial_number)
);

-- Create indexes for wallet_passes
CREATE INDEX IF NOT EXISTS idx_wallet_passes_wallet_id ON wallet_passes(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_user_id ON wallet_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_platform ON wallet_passes(platform);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_status ON wallet_passes(status);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_serial ON wallet_passes(serial_number);
CREATE INDEX IF NOT EXISTS idx_wallet_passes_device_library ON wallet_passes(device_library_identifier);

-- Create index for wallet_mode
CREATE INDEX IF NOT EXISTS idx_wallets_wallet_mode ON wallets(wallet_mode);

-- Create trigger to auto-update updated_at for wallet_passes
CREATE TRIGGER update_wallet_passes_updated_at 
  BEFORE UPDATE ON wallet_passes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries
-- ============================================
-- SELECT * FROM wallets LIMIT 1;
-- SELECT * FROM wallet_passes LIMIT 1;
-- ============================================


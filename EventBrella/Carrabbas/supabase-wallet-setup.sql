-- ============================================
-- Orlando Pirates Wallet Tables Setup for Supabase
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- User reference (foreign key to users table)
  user_id VARCHAR(255) NOT NULL,
  
  -- Wallet balance (stored in cents for precision)
  balance_cents INTEGER DEFAULT 0,
  
  -- Wallet status
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, closed
  
  -- Provider information (for future Marqeta integration)
  provider VARCHAR(50) DEFAULT 'mock', -- mock, marqeta
  provider_wallet_id VARCHAR(255), -- External provider's wallet ID
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id)
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Wallet reference
  wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  
  -- Transaction details
  transaction_type VARCHAR(50) NOT NULL, -- load, authorize, capture, refund, payment
  amount_cents INTEGER NOT NULL,
  
  -- Payment flow tracking
  authorization_id VARCHAR(255), -- For authorize/capture flow
  capture_id VARCHAR(255), -- For capture reference
  refund_id VARCHAR(255), -- For refund reference
  
  -- Transaction status
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
  
  -- Description and metadata
  description TEXT,
  metadata JSONB,
  
  -- POS integration (for future)
  pos_order_id VARCHAR(255),
  pos_system VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create wallet_tokens table (for QR code scanning)
CREATE TABLE IF NOT EXISTS wallet_tokens (
  -- Primary key
  id SERIAL PRIMARY KEY,
  
  -- Wallet reference
  wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  
  -- Token details
  token VARCHAR(500) UNIQUE NOT NULL, -- JWT token for QR code
  token_type VARCHAR(50) DEFAULT 'qr_payment', -- qr_payment, qr_balance_check
  
  -- Token status
  status VARCHAR(50) DEFAULT 'active', -- active, used, expired, revoked
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  
  -- Usage tracking
  used_by VARCHAR(255), -- POS system or merchant ID that used it
  amount_cents INTEGER, -- Amount authorized (if applicable)
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);
CREATE INDEX IF NOT EXISTS idx_wallets_provider ON wallets(provider);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_authorization_id ON wallet_transactions(authorization_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_wallet_tokens_token ON wallet_tokens(token);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_wallet_id ON wallet_tokens(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_user_id ON wallet_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_status ON wallet_tokens(status);
CREATE INDEX IF NOT EXISTS idx_wallet_tokens_expires_at ON wallet_tokens(expires_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_wallets_updated_at 
  BEFORE UPDATE ON wallets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at 
  BEFORE UPDATE ON wallet_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_tokens_updated_at 
  BEFORE UPDATE ON wallet_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Queries (run after creating tables)
-- ============================================
-- SELECT * FROM wallets LIMIT 1;
-- SELECT * FROM wallet_transactions LIMIT 1;
-- SELECT * FROM wallet_tokens LIMIT 1;
-- ============================================


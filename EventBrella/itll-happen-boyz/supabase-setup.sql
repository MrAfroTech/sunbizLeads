-- ============================================
-- EventBrella New Client White Lable System - Tickets Table (Supabase/PostgreSQL)
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- ============================================

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  -- Primary key (auto-incrementing)
  id SERIAL PRIMARY KEY,
  
  -- Unique ticket identifier (e.g., TKT_cs_test_abc123_1)
  ticket_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Stripe transaction/session ID
  transaction_id VARCHAR(255) NOT NULL,
  
  -- Event information
  event_name VARCHAR(255),
  event_date DATE,
  event_time VARCHAR(100),
  event_venue VARCHAR(255),
  
  -- Customer information
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  
  -- Ticket details
  ticket_count INTEGER DEFAULT 1,
  ticket_number INTEGER DEFAULT 1,
  tier VARCHAR(50),
  
  -- Purchase information
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- QR code and validation
  qr_code_url TEXT,
  checksum VARCHAR(100),
  
  -- Check-in/redemption tracking
  redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP,
  redeemed_by VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_transaction_id ON tickets(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_redeemed ON tickets(redeemed);
CREATE INDEX IF NOT EXISTS idx_tickets_event_date ON tickets(event_date);

-- Optional: Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_tickets_updated_at 
  BEFORE UPDATE ON tickets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification Query (run after creating table)
-- ============================================
-- SELECT * FROM tickets LIMIT 1;
-- ============================================









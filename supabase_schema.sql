-- ========================================================
-- PayPilot AI - Supabase Database Schema
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paypal_order_id VARCHAR(255) NOT NULL,
  paypal_capture_id VARCHAR(255),
  recipient VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  purpose VARCHAR(500) NOT NULL,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- CREATED, APPROVED, COMPLETED, FAILED, CANCELLED
  risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH
  risk_score INT DEFAULT 10,
  risk_reasons JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  raw_paypal_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_transactions_paypal_order ON transactions(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Comments
COMMENT ON TABLE transactions IS 'PayPilot AI PayPal Sandbox transactions log';

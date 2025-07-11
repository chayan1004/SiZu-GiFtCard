
-- Gift Card Platform Database Schema
-- Generated from shared/schema.ts

-- Session storage table (required for Replit Auth)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- User storage table (required for Replit Auth)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR DEFAULT 'user' NOT NULL,
  square_customer_id VARCHAR UNIQUE,
  is_email_verified BOOLEAN DEFAULT false,
  verification_otp VARCHAR(6),
  otp_expiry TIMESTAMP WITH TIME ZONE,
  reset_token VARCHAR,
  reset_token_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gift Cards table
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  square_gift_card_id VARCHAR UNIQUE,
  code VARCHAR UNIQUE NOT NULL,
  initial_amount DECIMAL(10,2) NOT NULL,
  current_balance DECIMAL(10,2) NOT NULL,
  design VARCHAR DEFAULT 'classic' NOT NULL,
  custom_message TEXT,
  recipient_email VARCHAR,
  recipient_name VARCHAR,
  sender_name VARCHAR,
  delivery_status VARCHAR DEFAULT 'pending' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  issued_by_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add other tables as needed...
-- (This is a simplified version - your full schema has many more tables)

/*
  # Create heartbeat table for connection testing

  1. New Tables
    - `heartbeat`
      - `id` (bigint, primary key, auto-increment)
      - `message` (text, default 'ok')
      - `created_at` (timestamptz, default now())
  
  2. Purpose
    - This table is used for testing database connectivity
    - Contains a simple test message to verify the connection is working
  
  3. Security
    - Enable RLS on heartbeat table
    - Add policy for public read access (SELECT only)
    - This table is used for connection testing and doesn't contain sensitive data
*/

-- Create heartbeat table for connection testing
CREATE TABLE IF NOT EXISTS heartbeat (
  id bigserial PRIMARY KEY,
  message text DEFAULT 'ok',
  created_at timestamptz DEFAULT now()
);

-- Insert a test record
INSERT INTO heartbeat (message) VALUES ('ok')
ON CONFLICT DO NOTHING;

-- Enable RLS on heartbeat table
ALTER TABLE heartbeat ENABLE ROW LEVEL SECURITY;

-- Add policy to allow anyone to read from heartbeat table
-- This is safe as the table only contains a test message
CREATE POLICY "Allow public read access to heartbeat"
  ON heartbeat
  FOR SELECT
  USING (true);

/*
  # Enable RLS on heartbeat table
  
  1. Changes
    - Enable Row Level Security on the heartbeat table
    - Add public read policy to allow the application to check connectivity
  
  2. Security
    - Enable RLS on heartbeat table
    - Add policy for public read access (SELECT only)
    - This table is used for connection testing and doesn't contain sensitive data
*/

-- Enable RLS on heartbeat table
ALTER TABLE heartbeat ENABLE ROW LEVEL SECURITY;

-- Add policy to allow anyone to read from heartbeat table
-- This is safe as the table only contains a test message
CREATE POLICY "Allow public read access to heartbeat"
  ON heartbeat
  FOR SELECT
  USING (true);

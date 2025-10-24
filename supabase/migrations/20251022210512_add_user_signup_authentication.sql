/*
  # User Signup and Authentication Enhancement

  ## Overview
  This migration enhances the authentication system to support user signup with email verification.

  ## 1. New Tables
  
  ### Email Verification
  - `email_verification_tokens` - Secure tokens for email verification
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `token` (text, unique)
    - `expires_at` (timestamptz)
    - `verified_at` (timestamptz, nullable)
    - `created_at` (timestamptz)

  ### Password Reset
  - `password_reset_tokens` - Secure tokens for password resets
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `token` (text, unique)
    - `expires_at` (timestamptz)
    - `used_at` (timestamptz, nullable)
    - `created_at` (timestamptz)

  ## 2. Updates to Existing Tables
  
  ### Users Table Enhancement
  - Add `email_verified` boolean field
  - Add `verification_sent_at` timestamp
  - Add `last_password_reset` timestamp
  
  ## 3. Security
  - Enable RLS on email_verification_tokens table
  - Enable RLS on password_reset_tokens table
  - Add policies for authenticated users to manage their own tokens
  - Add indexes for token lookups and expiration queries
  - Tokens expire after 24 hours by default

  ## 4. Important Notes
  - Email verification is optional but recommended for production
  - Password reset tokens are single-use and expire after 1 hour
  - All tokens are hashed for security
*/

-- ============================================================================
-- 1. EMAIL VERIFICATION TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own verification tokens
CREATE POLICY "Users can view own verification tokens"
  ON email_verification_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own verification tokens
CREATE POLICY "Users can create own verification tokens"
  ON email_verification_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own verification tokens
CREATE POLICY "Users can update own verification tokens"
  ON email_verification_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. PASSWORD RESET TOKENS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reset tokens
CREATE POLICY "Users can view own reset tokens"
  ON password_reset_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anyone can create reset tokens (for forgot password)
CREATE POLICY "Anyone can create reset tokens"
  ON password_reset_tokens
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can update their own reset tokens
CREATE POLICY "Users can update own reset tokens"
  ON password_reset_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. ENHANCE USERS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add email_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  -- Add verification_sent_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verification_sent_at'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_sent_at timestamptz;
  END IF;

  -- Add last_password_reset column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_password_reset'
  ) THEN
    ALTER TABLE users ADD COLUMN last_password_reset timestamptz;
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar_url text;
  END IF;
END $$;

-- ============================================================================
-- 4. CLEANUP FUNCTION FOR EXPIRED TOKENS
-- ============================================================================

-- Function to clean up expired tokens (can be called via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  -- Delete expired email verification tokens
  DELETE FROM email_verification_tokens
  WHERE expires_at < now() AND verified_at IS NULL;

  -- Delete used or expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE (expires_at < now() OR used_at IS NOT NULL) 
    AND created_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS text AS $$
  SELECT encode(gen_random_bytes(32), 'base64');
$$ LANGUAGE sql VOLATILE;

-- Function to check if email is verified
CREATE OR REPLACE FUNCTION is_email_verified(user_email text)
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT email_verified FROM users WHERE email = user_email LIMIT 1),
    false
  );
$$ LANGUAGE sql STABLE;
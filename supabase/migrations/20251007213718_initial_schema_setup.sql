/*
  # Initial Database Schema Setup for BrainBox-RetailPlus V25

  1. New Tables
    - `subscription_plans` - Available subscription plans with pricing and features
      - `id` (uuid, primary key)
      - `name` (text) - Plan name
      - `plan_type` (text) - basic, pro, or advance
      - `monthly_price` (numeric) - Price in NGN
      - `max_systems` (integer) - Maximum systems allowed
      - `max_phones` (integer) - Maximum phones allowed
      - `trial_days` (integer) - Trial period in days
      - `features` (jsonb) - Plan features
      - `is_active` (boolean) - Whether plan is active
      - `created_at`, `updated_at` (timestamptz)
    
    - `subscriptions` - User subscription records
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Associated user
      - `plan_type` (text) - Current plan type
      - `status` (text) - active, expired, cancelled
      - `start_date`, `end_date` (timestamptz) - Subscription period
      - `trial_days_used` (integer)
      - `max_systems`, `max_phones` (integer)
      - `features` (jsonb)
      - `amount_paid` (numeric)
      - `payment_reference` (text)
      - `created_at`, `updated_at` (timestamptz)
    
    - `complaints` - Customer complaint management system
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Complaint creator
      - `business_name`, `contact_email`, `contact_phone` (text)
      - `complaint_type` (text) - technical, billing, feature_request, general
      - `subject`, `description` (text)
      - `priority` (text) - low, medium, high, urgent
      - `status` (text) - open, in_progress, resolved, closed
      - `admin_response` (text)
      - `created_at`, `updated_at` (timestamptz)
    
    - `payments` - Payment transaction records
      - `id` (uuid, primary key)
      - `user_id` (uuid)
      - `subscription_id` (uuid)
      - `amount` (numeric)
      - `currency` (text) - Default NGN
      - `payment_method` (text) - Default paystack
      - `paystack_reference`, `paystack_transaction_id` (text)
      - `status` (text) - pending, success, failed
      - `payment_date`, `created_at` (timestamptz)
    
    - `heartbeat` - Connection testing table
      - `id` (uuid, primary key)
      - `message` (text)
      - `created_at` (timestamptz)
    
  2. Security
    - Enable RLS on all tables
    - Subscription plans: Public read for active plans, admin-only management
    - Complaints: Users can read/create own complaints, admins can read/update all
    - Payments: Users can read/create own payments, admins can read all
    
  3. Default Data
    - Three subscription plans: Basic (₦20,000), Pro (₦55,000), Advance (₦120,000)
    - Heartbeat test record
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'advance')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  trial_days_used integer DEFAULT 0,
  max_systems integer DEFAULT 3,
  max_phones integer DEFAULT 1,
  features jsonb DEFAULT '{}',
  amount_paid numeric(12,2) DEFAULT 0,
  payment_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Users can read their own subscriptions'
  ) THEN
    CREATE POLICY "Users can read their own subscriptions"
      ON subscriptions
      FOR SELECT
      TO authenticated
      USING (user_id::text = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Users can create their own subscriptions'
  ) THEN
    CREATE POLICY "Users can create their own subscriptions"
      ON subscriptions
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id::text = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscriptions' AND policyname = 'Users can update their own subscriptions'
  ) THEN
    CREATE POLICY "Users can update their own subscriptions"
      ON subscriptions
      FOR UPDATE
      TO authenticated
      USING (user_id::text = auth.uid()::text)
      WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
END $$;

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('basic', 'pro', 'advance')),
  monthly_price numeric(12,2) NOT NULL,
  max_systems integer NOT NULL DEFAULT 3,
  max_phones integer NOT NULL DEFAULT 1,
  trial_days integer NOT NULL DEFAULT 14,
  features jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_plans' AND policyname = 'Anyone can read active subscription plans'
  ) THEN
    CREATE POLICY "Anyone can read active subscription plans"
      ON subscription_plans
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  complaint_type text NOT NULL CHECK (complaint_type IN ('technical', 'billing', 'feature_request', 'general')),
  subject text NOT NULL,
  description text NOT NULL,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'complaints' AND policyname = 'Users can read their own complaints'
  ) THEN
    CREATE POLICY "Users can read their own complaints"
      ON complaints
      FOR SELECT
      TO authenticated
      USING (user_id::text = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'complaints' AND policyname = 'Users can create their own complaints'
  ) THEN
    CREATE POLICY "Users can create their own complaints"
      ON complaints
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'NGN',
  payment_method text DEFAULT 'paystack',
  paystack_reference text NOT NULL,
  paystack_transaction_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments' AND policyname = 'Users can read their own payments'
  ) THEN
    CREATE POLICY "Users can read their own payments"
      ON payments
      FOR SELECT
      TO authenticated
      USING (user_id::text = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments' AND policyname = 'Users can create their own payments'
  ) THEN
    CREATE POLICY "Users can create their own payments"
      ON payments
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id::text = auth.uid()::text);
  END IF;
END $$;

-- Create heartbeat table for connection testing
CREATE TABLE IF NOT EXISTS heartbeat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert test data into heartbeat
INSERT INTO heartbeat (message) VALUES ('Supabase is live!') ON CONFLICT DO NOTHING;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, plan_type, monthly_price, max_systems, max_phones, trial_days, features) VALUES
  (
    'Basic Plan',
    'basic',
    20000,
    3,
    1,
    14,
    '{"allFeatures": true, "phoneGreetings": true, "basicReportOnly": true, "tabletSupport": false, "multiStore": false, "advancedReporting": false, "apiAccess": false, "prioritySupport": false}'
  ),
  (
    'Pro Plan', 
    'pro',
    55000,
    5,
    2,
    14,
    '{"allFeatures": true, "phoneGreetings": false, "basicReportOnly": false, "tabletSupport": false, "multiStore": true, "advancedReporting": true, "apiAccess": true, "prioritySupport": false}'
  ),
  (
    'Advance Plan',
    'advance', 
    120000,
    8,
    3,
    14,
    '{"allFeatures": true, "phoneGreetings": true, "basicReportOnly": false, "tabletSupport": true, "multiStore": true, "advancedReporting": true, "apiAccess": true, "prioritySupport": true}'
  )
ON CONFLICT DO NOTHING;
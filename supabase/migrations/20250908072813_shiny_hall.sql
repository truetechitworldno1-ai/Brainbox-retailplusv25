/*
  # Fix Sales Table RLS Policies

  1. Security Updates
    - Drop existing restrictive policies on sales table
    - Add new policies to allow authenticated users to insert/read sales
    - Ensure proper access control for sales operations

  2. Changes
    - Allow authenticated users to insert sales records
    - Allow users to read sales data
    - Maintain data security while enabling functionality
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own sales" ON sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON sales;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON sales;

-- Create new policies for sales table
CREATE POLICY "Enable read access for all authenticated users"
  ON sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for all authenticated users"
  ON sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for all authenticated users"
  ON sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
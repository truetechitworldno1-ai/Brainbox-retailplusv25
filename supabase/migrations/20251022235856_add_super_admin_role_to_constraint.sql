/*
  # Add super_admin role to users table constraint

  1. Changes
    - Drops the existing role check constraint
    - Recreates it with 'super_admin' included in allowed roles
    
  2. Security
    - Maintains data integrity for role values
    - Allows super_admin role for system administrators
*/

-- Drop existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes super_admin
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('owner', 'admin', 'manager', 'cashier', 'staff', 'super_admin'));

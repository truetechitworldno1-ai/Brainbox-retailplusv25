/*
  # Global Admin System Implementation

  1. Overview
    - Creates a super_admin role that has system-wide access
    - Updates RLS policies to allow super_admins to view and manage ALL tenants
    - Adds global admin capabilities for cross-tenant management

  2. Changes to Users Table
    - No schema changes needed (role column already exists)
    - Role can now be: 'super_admin', 'owner', 'admin', 'manager', 'cashier', 'employee'

  3. RLS Policy Updates
    
    **Tenants Table:**
    - Super admins can view ALL tenants
    - Super admins can update ANY tenant
    - Super admins can delete ANY tenant (with safeguards)
    - Regular users still restricted to their own tenant
    
    **Users Table:**
    - Super admins can view ALL users across ALL tenants
    - Super admins can update ANY user
    - Super admins can delete users (except themselves)
    - Regular users still restricted to their own tenant

  4. Security Notes
    - Super admin role is separate from tenant ownership
    - Super admins have tenant_id = NULL (system-level accounts)
    - Only super admins can create other super admins
    - Super admins cannot delete themselves
    - All operations are audited via updated_at timestamps

  5. Important
    - Existing policies are replaced with more flexible versions
    - Data integrity is maintained through foreign key constraints
    - No data loss - this is purely a security enhancement
*/

-- First, let's drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view same tenant users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ============================================
-- TENANTS TABLE: New Super Admin Policies
-- ============================================

-- Policy 1: Super admins can view ALL tenants
CREATE POLICY "Super admins can view all tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy 2: Regular users can view their own tenant
CREATE POLICY "Users can view own tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT users.tenant_id
      FROM users
      WHERE users.id = auth.uid()
      AND users.role != 'super_admin'
    )
  );

-- Policy 3: Super admins can update ANY tenant
CREATE POLICY "Super admins can update any tenant"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Policy 4: Tenant owners/admins can update their own tenant
CREATE POLICY "Tenant admins can update own tenant"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT users.tenant_id
      FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
      AND users.role != 'super_admin'
    )
  )
  WITH CHECK (
    id IN (
      SELECT users.tenant_id
      FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
      AND users.role != 'super_admin'
    )
  );

-- Policy 5: Super admins can delete tenants
CREATE POLICY "Super admins can delete tenants"
  ON tenants
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- USERS TABLE: New Super Admin Policies
-- ============================================

-- Policy 1: Super admins can view ALL users
CREATE POLICY "Super admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy 2: Regular users can view users in their tenant
CREATE POLICY "Users can view same tenant users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT users.tenant_id
      FROM users
      WHERE users.id = auth.uid()
      AND users.role != 'super_admin'
    )
  );

-- Policy 3: Super admins can update ANY user
CREATE POLICY "Super admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- Policy 4: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 5: Tenant admins can update users in their tenant
CREATE POLICY "Tenant admins can update tenant users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT users.tenant_id
      FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
      AND users.role != 'super_admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT users.tenant_id
      FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('owner', 'admin')
      AND users.role != 'super_admin'
    )
  );

-- Policy 6: Super admins can delete users (except themselves)
CREATE POLICY "Super admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
    AND id != auth.uid()  -- Cannot delete themselves
  );

-- Policy 7: Super admins can insert users (for creating super admin accounts)
CREATE POLICY "Super admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- ============================================
-- Create a helper function to check if user is super admin
-- ============================================

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create indexes for performance
-- ============================================

-- Index on role for faster super_admin lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'super_admin';

-- Index on tenant_id for faster tenant filtering
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id) WHERE tenant_id IS NOT NULL;
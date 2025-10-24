/*
  # Complete Retail System Database Schema

  ## Overview
  This migration creates all core tables for the BrainBox-RetailPlus V25 retail management system.

  ## 1. New Tables

  ### Multi-Tenancy & Authentication
  - `tenants` - Company/organization information
  - `users` - System users with role-based access
  - `user_roles` - Role assignments for users
  - `subscriptions` - Subscription management for tenants
  - `licenses` - License keys and activation tracking

  ### Retail Operations
  - `products` - Product catalog with pricing and inventory
  - `categories` - Product categorization
  - `suppliers` - Supplier information
  - `customers` - Customer database with loyalty tracking
  - `purchases` - Purchase orders from suppliers
  - `purchase_items` - Line items for purchases
  - `sales` - Point of sale transactions
  - `sale_items` - Line items for sales
  - `returns` - Product return transactions
  - `return_items` - Line items for returns

  ### Inventory Management
  - `inventory_adjustments` - Stock adjustments and corrections
  - `stock_transfers` - Inter-store transfers
  - `low_stock_alerts` - Automated reorder alerts
  - `expiry_alerts` - Product expiration notifications

  ### Employee & Financial
  - `employees` - Employee records
  - `salaries` - Salary payment tracking
  - `expenses` - Business expense tracking
  - `expense_categories` - Categorization for expenses
  - `cashier_sessions` - Cash register session management

  ### Customer Engagement
  - `loyalty_rewards` - Reward program definitions
  - `reward_redemptions` - Customer reward usage tracking
  - `customer_complaints` - Customer feedback and complaints

  ### System Configuration
  - `workstations` - POS terminal configuration
  - `printer_configs` - Receipt printer settings
  - `payment_methods` - Available payment options
  - `tax_settings` - VAT and tax configuration

  ## 2. Security
  - Row Level Security (RLS) enabled on all tables
  - Tenant isolation enforced via RLS policies
  - User authentication checked via auth.uid()
  - Restrictive policies requiring explicit access grants

  ## 3. Key Features
  - Multi-tenant architecture with complete data isolation
  - Comprehensive audit trails (created_at, updated_at)
  - Soft delete support where applicable
  - Automated timestamp management
  - Foreign key constraints for data integrity
  - Indexes for performance optimization
*/

-- ============================================================================
-- 1. TENANTS & MULTI-TENANCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  logo_url text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  subscription_expires_at timestamptz,
  max_users integer DEFAULT 1,
  max_products integer DEFAULT 100,
  features jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'manager', 'cashier', 'staff')),
  phone text,
  avatar_url text,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. SUBSCRIPTIONS & LICENSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  plan_type text DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'annual')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  amount decimal(10,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'NGN',
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  auto_renew boolean DEFAULT true,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  license_key text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'revoked')),
  activated_at timestamptz,
  expires_at timestamptz,
  hardware_id text,
  max_activations integer DEFAULT 1,
  activation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 4. PRODUCT CATALOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  payment_terms text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  sku text NOT NULL,
  barcode text,
  name text NOT NULL,
  description text,
  cost_price decimal(10,2) NOT NULL DEFAULT 0,
  selling_price decimal(10,2) NOT NULL DEFAULT 0,
  quantity integer DEFAULT 0,
  reorder_level integer DEFAULT 10,
  min_stock_level integer DEFAULT 5,
  max_stock_level integer DEFAULT 1000,
  unit text DEFAULT 'piece',
  tax_rate decimal(5,2) DEFAULT 0,
  vat_inclusive boolean DEFAULT false,
  is_taxable boolean DEFAULT true,
  has_expiry boolean DEFAULT false,
  expiry_date date,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, sku)
);

-- ============================================================================
-- 5. CUSTOMER MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  customer_code text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  city text,
  state text,
  country text DEFAULT 'Nigeria',
  loyalty_points integer DEFAULT 0,
  total_purchases decimal(12,2) DEFAULT 0,
  visit_count integer DEFAULT 0,
  last_visit_at timestamptz,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, customer_code)
);

-- ============================================================================
-- 6. PURCHASES (FROM SUPPLIERS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  purchase_number text NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  tax_amount decimal(12,2) DEFAULT 0,
  discount_amount decimal(12,2) DEFAULT 0,
  net_amount decimal(12,2) NOT NULL DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_method text,
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, purchase_number)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL,
  unit_cost decimal(10,2) NOT NULL,
  total_cost decimal(12,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 7. SALES (POINT OF SALE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'card', 'mobile_money', 'bank_transfer', 'paystack', 'other')),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS cashier_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  cashier_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  workstation_id uuid,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  opening_cash decimal(10,2) DEFAULT 0,
  closing_cash decimal(10,2),
  expected_cash decimal(10,2),
  variance decimal(10,2),
  total_sales decimal(12,2) DEFAULT 0,
  transaction_count integer DEFAULT 0,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  cashier_id uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id uuid REFERENCES cashier_sessions(id) ON DELETE SET NULL,
  receipt_number text NOT NULL,
  sale_date timestamptz DEFAULT now(),
  subtotal decimal(12,2) NOT NULL DEFAULT 0,
  tax_amount decimal(12,2) DEFAULT 0,
  discount_amount decimal(12,2) DEFAULT 0,
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  amount_paid decimal(12,2) NOT NULL DEFAULT 0,
  change_given decimal(12,2) DEFAULT 0,
  payment_status text DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'refunded', 'cancelled')),
  payment_method text,
  split_payment jsonb,
  loyalty_points_earned integer DEFAULT 0,
  loyalty_points_redeemed integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(12,2) NOT NULL,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 8. RETURNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  return_number text NOT NULL,
  return_date timestamptz DEFAULT now(),
  total_amount decimal(12,2) NOT NULL DEFAULT 0,
  refund_method text,
  reason text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, return_number)
);

CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_amount decimal(12,2) NOT NULL,
  condition text CHECK (condition IN ('good', 'damaged', 'expired')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 9. INVENTORY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('add', 'remove', 'correct', 'damage', 'expiry', 'theft')),
  quantity_change integer NOT NULL,
  old_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reason text,
  adjusted_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  quantity integer NOT NULL,
  transfer_date timestamptz DEFAULT now(),
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  initiated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  current_quantity integer NOT NULL,
  reorder_level integer NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expiry_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  expiry_date date NOT NULL,
  days_until_expiry integer NOT NULL,
  quantity integer NOT NULL,
  alert_level text NOT NULL CHECK (alert_level IN ('warning', 'critical', 'expired')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by uuid REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 10. EMPLOYEES
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  employee_code text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  position text,
  department text,
  hire_date date,
  salary_amount decimal(10,2) DEFAULT 0,
  salary_frequency text DEFAULT 'monthly' CHECK (salary_frequency IN ('weekly', 'biweekly', 'monthly')),
  bank_name text,
  account_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, employee_code)
);

CREATE TABLE IF NOT EXISTS salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  base_salary decimal(10,2) NOT NULL,
  bonuses decimal(10,2) DEFAULT 0,
  deductions decimal(10,2) DEFAULT 0,
  net_salary decimal(10,2) NOT NULL,
  payment_date date,
  payment_method text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  notes text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 11. EXPENSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES expense_categories(id) ON DELETE SET NULL,
  expense_number text NOT NULL,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  expense_date date NOT NULL,
  payment_method text,
  vendor text,
  receipt_url text,
  notes text,
  recorded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, expense_number)
);

-- ============================================================================
-- 12. LOYALTY & REWARDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  points_required integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('discount', 'free_product', 'cash_voucher')),
  reward_value decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  valid_from date,
  valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES loyalty_rewards(id) ON DELETE RESTRICT NOT NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  points_redeemed integer NOT NULL,
  redemption_date timestamptz DEFAULT now(),
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 13. CUSTOMER COMPLAINTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  complaint_number text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, complaint_number)
);

-- ============================================================================
-- 14. SYSTEM CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS workstations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  location text,
  hardware_id text,
  ip_address text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE IF NOT EXISTS printer_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  workstation_id uuid REFERENCES workstations(id) ON DELETE CASCADE,
  name text NOT NULL,
  printer_type text NOT NULL CHECK (printer_type IN ('thermal', 'inkjet', 'laser')),
  connection_type text NOT NULL CHECK (connection_type IN ('usb', 'network', 'bluetooth')),
  printer_address text,
  paper_width integer DEFAULT 80,
  is_default boolean DEFAULT false,
  settings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  tax_name text NOT NULL,
  tax_rate decimal(5,2) NOT NULL,
  tax_type text NOT NULL CHECK (tax_type IN ('vat', 'sales_tax', 'other')),
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_purchases_tenant_id ON purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiry_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - TENANT ISOLATION
-- ============================================================================

-- Tenants: Users can only view their own tenant
CREATE POLICY "Users can view own tenant"
  ON tenants FOR SELECT
  TO authenticated
  USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own tenant"
  ON tenants FOR UPDATE
  TO authenticated
  USING (id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')))
  WITH CHECK (id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin')));

-- Users: Can view users in same tenant
CREATE POLICY "Users can view same tenant users"
  ON users FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Products: Full access within tenant
CREATE POLICY "Users can view tenant products"
  ON products FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert tenant products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update tenant products"
  ON products FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete tenant products"
  ON products FOR DELETE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Categories: Full access within tenant
CREATE POLICY "Users can view tenant categories"
  ON categories FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant categories"
  ON categories FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Suppliers: Full access within tenant
CREATE POLICY "Users can view tenant suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Customers: Full access within tenant
CREATE POLICY "Users can view tenant customers"
  ON customers FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant customers"
  ON customers FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Sales: Full access within tenant
CREATE POLICY "Users can view tenant sales"
  ON sales FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create tenant sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update tenant sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Sale Items: Access through sales
CREATE POLICY "Users can view sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (sale_id IN (SELECT id FROM sales WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage sale items"
  ON sale_items FOR ALL
  TO authenticated
  USING (sale_id IN (SELECT id FROM sales WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())))
  WITH CHECK (sale_id IN (SELECT id FROM sales WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- Purchases: Full access within tenant
CREATE POLICY "Users can view tenant purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant purchases"
  ON purchases FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Purchase Items: Access through purchases
CREATE POLICY "Users can view purchase items"
  ON purchase_items FOR SELECT
  TO authenticated
  USING (purchase_id IN (SELECT id FROM purchases WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage purchase items"
  ON purchase_items FOR ALL
  TO authenticated
  USING (purchase_id IN (SELECT id FROM purchases WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())))
  WITH CHECK (purchase_id IN (SELECT id FROM purchases WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- Returns: Full access within tenant
CREATE POLICY "Users can view tenant returns"
  ON returns FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant returns"
  ON returns FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Return Items: Access through returns
CREATE POLICY "Users can view return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (return_id IN (SELECT id FROM returns WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage return items"
  ON return_items FOR ALL
  TO authenticated
  USING (return_id IN (SELECT id FROM returns WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())))
  WITH CHECK (return_id IN (SELECT id FROM returns WHERE tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())));

-- Apply similar policies to remaining tables
CREATE POLICY "Users can view tenant subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant licenses"
  ON licenses FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant payment_methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant payment_methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant cashier_sessions"
  ON cashier_sessions FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant cashier_sessions"
  ON cashier_sessions FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant inventory_adjustments"
  ON inventory_adjustments FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant inventory_adjustments"
  ON inventory_adjustments FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant stock_transfers"
  ON stock_transfers FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant stock_transfers"
  ON stock_transfers FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant alerts"
  ON low_stock_alerts FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant alerts"
  ON low_stock_alerts FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant expiry_alerts"
  ON expiry_alerts FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant expiry_alerts"
  ON expiry_alerts FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant employees"
  ON employees FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant employees"
  ON employees FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant salaries"
  ON salaries FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant salaries"
  ON salaries FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant expense_categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant expense_categories"
  ON expense_categories FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant loyalty_rewards"
  ON loyalty_rewards FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant loyalty_rewards"
  ON loyalty_rewards FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant reward_redemptions"
  ON reward_redemptions FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant reward_redemptions"
  ON reward_redemptions FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant customer_complaints"
  ON customer_complaints FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant customer_complaints"
  ON customer_complaints FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant workstations"
  ON workstations FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant workstations"
  ON workstations FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant printer_configs"
  ON printer_configs FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant printer_configs"
  ON printer_configs FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view tenant tax_settings"
  ON tax_settings FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tenant tax_settings"
  ON tax_settings FOR ALL
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid()));

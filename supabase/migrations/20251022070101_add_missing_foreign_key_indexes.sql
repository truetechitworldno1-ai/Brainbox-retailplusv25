/*
  # Add Missing Foreign Key Indexes

  ## Overview
  This migration adds indexes to all foreign key columns that are missing them.
  Foreign key indexes significantly improve query performance, especially for JOIN operations.

  ## Performance Impact
  - Improves JOIN query performance
  - Speeds up CASCADE operations
  - Reduces database load during complex queries
  - Essential for multi-tenant queries with tenant_id filtering

  ## Changes
  - Add indexes for all foreign key columns across all tables
  - Uses IF NOT EXISTS to prevent conflicts with existing indexes
*/

-- Cashier Sessions
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_tenant_id ON cashier_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_cashier_id ON cashier_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_workstation_id ON cashier_sessions(workstation_id);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Customer Complaints
CREATE INDEX IF NOT EXISTS idx_customer_complaints_tenant_id ON customer_complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_customer_id ON customer_complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_assigned_to ON customer_complaints(assigned_to);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Expense Categories
CREATE INDEX IF NOT EXISTS idx_expense_categories_tenant_id ON expense_categories(tenant_id);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded_by ON expenses(recorded_by);

-- Expiry Alerts
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_tenant_id ON expiry_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_product_id ON expiry_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_acknowledged_by ON expiry_alerts(acknowledged_by);

-- Inventory Adjustments
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_tenant_id ON inventory_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_adjusted_by ON inventory_adjustments(adjusted_by);

-- Licenses
CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON licenses(tenant_id);

-- Low Stock Alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_tenant_id ON low_stock_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product_id ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_acknowledged_by ON low_stock_alerts(acknowledged_by);

-- Loyalty Rewards
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_tenant_id ON loyalty_rewards(tenant_id);

-- Payment Methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant_id ON payment_methods(tenant_id);

-- Printer Configs
CREATE INDEX IF NOT EXISTS idx_printer_configs_tenant_id ON printer_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_printer_configs_workstation_id ON printer_configs(workstation_id);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);

-- Purchase Items
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_by ON purchases(created_by);

-- Return Items
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON return_items(product_id);

-- Returns
CREATE INDEX IF NOT EXISTS idx_returns_tenant_id ON returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_returns_sale_id ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_processed_by ON returns(processed_by);

-- Reward Redemptions
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_tenant_id ON reward_redemptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer_id ON reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_sale_id ON reward_redemptions(sale_id);

-- Salaries
CREATE INDEX IF NOT EXISTS idx_salaries_tenant_id ON salaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_created_by ON salaries(created_by);

-- Sale Items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Sales
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_session_id ON sales(session_id);

-- Stock Transfers
CREATE INDEX IF NOT EXISTS idx_stock_transfers_tenant_id ON stock_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_product_id ON stock_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_initiated_by ON stock_transfers(initiated_by);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers(tenant_id);

-- Tax Settings
CREATE INDEX IF NOT EXISTS idx_tax_settings_tenant_id ON tax_settings(tenant_id);

-- Workstations
CREATE INDEX IF NOT EXISTS idx_workstations_tenant_id ON workstations(tenant_id);

-- Additional performance indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_cashier_sessions_status ON cashier_sessions(status);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_status ON expiry_alerts(status);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_status ON low_stock_alerts(status);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);

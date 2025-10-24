/*
  # Create Core Retail Tables

  ## New Tables
  
  ### `customers`
  - `id` (uuid, primary key) - Unique customer identifier
  - `name` (text, required) - Customer full name
  - `phone` (text, optional) - Customer phone number
  - `email` (text, optional) - Customer email address
  - `address` (text, optional) - Customer address
  - `loyalty_points` (integer, default 0) - Loyalty reward points
  - `total_spent` (numeric, default 0) - Total amount spent
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `suppliers`
  - `id` (uuid, primary key) - Unique supplier identifier
  - `name` (text, required) - Supplier business name
  - `phone` (text, optional) - Supplier phone number
  - `email` (text, optional) - Supplier email address
  - `address` (text, optional) - Supplier address
  - `balance` (numeric, default 0) - Current balance owed
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `inventory`
  - `id` (uuid, primary key) - Unique product identifier
  - `item_name` (text, required) - Product name
  - `barcode` (text, optional) - Product barcode
  - `category` (text, optional) - Product category
  - `quantity` (integer, default 0) - Stock quantity
  - `cost_price` (numeric, required) - Cost price per unit
  - `selling_price` (numeric, required) - Selling price per unit
  - `min_stock` (integer, default 10) - Minimum stock level
  - `supplier_id` (uuid, optional) - Reference to supplier
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `employees`
  - `id` (uuid, primary key) - Unique employee identifier
  - `name` (text, required) - Employee full name
  - `role` (text, required) - Employee role/position
  - `email` (text, optional) - Employee email address
  - `phone` (text, optional) - Employee phone number
  - `salary` (numeric, optional) - Employee salary
  - `is_active` (boolean, default true) - Employment status
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ### `sales`
  - `id` (uuid, primary key) - Unique sale identifier
  - `customer_id` (uuid, optional) - Reference to customer
  - `employee_id` (uuid, optional) - Reference to employee/cashier
  - `total_amount` (numeric, required) - Total sale amount
  - `payment_method` (text, optional) - Payment method used
  - `receipt_number` (text, optional) - Receipt reference number
  - `created_at` (timestamptz) - Sale timestamp

  ### `sale_items`
  - `id` (uuid, primary key) - Unique sale item identifier
  - `sale_id` (uuid, required) - Reference to sale
  - `product_id` (uuid, required) - Reference to inventory item
  - `quantity` (integer, required) - Quantity sold
  - `unit_price` (numeric, required) - Price per unit at time of sale
  - `total` (numeric, required) - Total for this line item
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their data
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  loyalty_points integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON customers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  barcode text,
  category text,
  quantity integer DEFAULT 0,
  cost_price numeric NOT NULL,
  selling_price numeric NOT NULL,
  min_stock integer DEFAULT 10,
  supplier_id uuid REFERENCES suppliers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON inventory
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  email text,
  phone text,
  salary numeric,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  employee_id uuid REFERENCES employees(id),
  total_amount numeric NOT NULL,
  payment_method text,
  receipt_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES inventory(id),
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users"
  ON sale_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
/*
  # Add VAT/Tax Support to Inventory

  ## Changes to Tables
  
  ### `inventory` table modifications
  - Add `is_taxable` (boolean, default false) - Whether item is subject to VAT
  - Add `tax_rate` (numeric, default 0) - Tax rate percentage (e.g., 7.5 for 7.5%)
  - Add `tax_amount` (numeric, default 0) - Calculated tax amount per unit
  - Add `price_with_tax` (numeric, default 0) - Final price including tax

  ### `sale_items` table modifications
  - Add `is_taxable` (boolean, default false) - Tax status at time of sale
  - Add `tax_rate` (numeric, default 0) - Tax rate applied
  - Add `tax_amount` (numeric, default 0) - Total tax for this line item
  - Add `subtotal` (numeric, default 0) - Amount before tax

  ### `sales` table modifications
  - Add `subtotal` (numeric, default 0) - Total before tax
  - Add `tax_amount` (numeric, default 0) - Total tax collected
  - Add `discount_amount` (numeric, default 0) - Discount applied
  
  ## Notes
  - Existing sales data will have tax fields set to 0
  - Tax calculations will be performed at sale time based on product settings
  - Tax rates are stored as percentages (7.5 means 7.5%)
*/

-- Add tax fields to inventory table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'is_taxable'
  ) THEN
    ALTER TABLE inventory ADD COLUMN is_taxable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE inventory ADD COLUMN tax_rate numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE inventory ADD COLUMN tax_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' AND column_name = 'price_with_tax'
  ) THEN
    ALTER TABLE inventory ADD COLUMN price_with_tax numeric DEFAULT 0;
  END IF;
END $$;

-- Add tax fields to sale_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sale_items' AND column_name = 'is_taxable'
  ) THEN
    ALTER TABLE sale_items ADD COLUMN is_taxable boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sale_items' AND column_name = 'tax_rate'
  ) THEN
    ALTER TABLE sale_items ADD COLUMN tax_rate numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sale_items' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE sale_items ADD COLUMN tax_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sale_items' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE sale_items ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;
END $$;

-- Add summary fields to sales table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE sales ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE sales ADD COLUMN tax_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE sales ADD COLUMN discount_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Create index for tax reporting queries
CREATE INDEX IF NOT EXISTS idx_sales_tax_amount ON sales(tax_amount);
CREATE INDEX IF NOT EXISTS idx_sales_created_at_tax ON sales(created_at, tax_amount);
CREATE INDEX IF NOT EXISTS idx_inventory_is_taxable ON inventory(is_taxable);
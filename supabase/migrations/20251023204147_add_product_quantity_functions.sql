/*
  # Add Product Quantity Management Functions

  1. Functions
    - `decrement_product_quantity` - Decreases product quantity when a sale is made
    - `increment_product_quantity` - Increases product quantity for returns or restocks

  2. Security
    - Functions are secure and check for sufficient stock before decrementing
    - Prevents negative stock quantities
*/

-- Function to decrement product quantity
CREATE OR REPLACE FUNCTION decrement_product_quantity(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET quantity = quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
    AND quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment product quantity
CREATE OR REPLACE FUNCTION increment_product_quantity(
  p_product_id UUID,
  p_quantity INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET quantity = quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

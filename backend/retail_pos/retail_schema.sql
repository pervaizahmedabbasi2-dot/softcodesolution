-- ===========================================================================
-- RETAIL STORE & POS MART DOMAIN SCHEMA
-- ===========================================================================

-- Retail Checkout Receipts
CREATE TABLE IF NOT EXISTS local_pos_orders (
  id TEXT PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  items_count INTEGER DEFAULT 1,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  cashier TEXT,
  items_json TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Retail Product Inventory
CREATE TABLE IF NOT EXISTS local_retail_products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_price REAL DEFAULT 0,
  selling_price REAL NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_alert INTEGER DEFAULT 10,
  status TEXT DEFAULT 'IN_STOCK',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Supermarket, Mart & Grocery Retail Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_supermarket_inventory (
  id TEXT PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  aisle_category TEXT DEFAULT 'Staples',
  unit_price REAL NOT NULL DEFAULT 0,
  stock_qty INTEGER DEFAULT 0,
  expiry_date TEXT,
  supplier_name TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_supermarket_checkouts (
  id TEXT PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  lane_no TEXT DEFAULT 'Lane 01',
  cashier_name TEXT,
  items_count INTEGER DEFAULT 1,
  total_amount REAL NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'Cash',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supermarket_inventory_sync ON local_supermarket_inventory(is_synced);
CREATE INDEX IF NOT EXISTS idx_supermarket_checkouts_sync ON local_supermarket_checkouts(is_synced);

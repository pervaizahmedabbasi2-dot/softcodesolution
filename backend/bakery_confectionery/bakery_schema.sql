-- Bakery, Confectionery & Patisserie Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_bakery_batches (
  id TEXT PRIMARY KEY,
  batch_no TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'Bread & Pastry',
  baked_qty INTEGER NOT NULL DEFAULT 0,
  sold_qty INTEGER DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  expiry_date TEXT,
  oven_shift TEXT DEFAULT 'MORNING',
  status TEXT DEFAULT 'FRESH',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_bakery_custom_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  cake_spec TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  advance_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bakery_batches_sync ON local_bakery_batches(is_synced);
CREATE INDEX IF NOT EXISTS idx_bakery_orders_sync ON local_bakery_custom_orders(is_synced);

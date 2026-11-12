-- Wholesale Distribution & Supply Chain Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_wholesale_orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  distributor_name TEXT NOT NULL,
  retailer_account TEXT NOT NULL,
  route_zone TEXT,
  cartons_count INTEGER DEFAULT 1,
  invoice_total REAL NOT NULL DEFAULT 0,
  payment_terms TEXT DEFAULT 'NET_15',
  status TEXT DEFAULT 'DISPATCHED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_wholesale_stock (
  id TEXT PRIMARY KEY,
  sku_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  warehouse_zone TEXT DEFAULT 'Zone A',
  bulk_qty INTEGER DEFAULT 0,
  wholesale_rate REAL NOT NULL DEFAULT 0,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wholesale_orders_sync ON local_wholesale_orders(is_synced);
CREATE INDEX IF NOT EXISTS idx_wholesale_stock_sync ON local_wholesale_stock(is_synced);

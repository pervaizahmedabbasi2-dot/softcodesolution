-- E-Commerce & Warehouse Fulfillment Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_ecommerce_parcels (
  id TEXT PRIMARY KEY,
  parcel_no TEXT UNIQUE NOT NULL,
  store_channel TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  warehouse_bin TEXT,
  courier_partner TEXT,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'PACKED_READY',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_ecommerce_pick_queue (
  id TEXT PRIMARY KEY,
  order_ref TEXT UNIQUE NOT NULL,
  items_count INTEGER DEFAULT 1,
  aisle_bin TEXT NOT NULL,
  picker_name TEXT,
  priority TEXT DEFAULT 'STANDARD',
  status TEXT DEFAULT 'PICKING',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ecommerce_parcels_sync ON local_ecommerce_parcels(is_synced);
CREATE INDEX IF NOT EXISTS idx_ecommerce_pick_sync ON local_ecommerce_pick_queue(is_synced);

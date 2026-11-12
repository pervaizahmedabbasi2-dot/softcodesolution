-- Logistics, Courier & Freight Dispatch Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_logistics_shipments (
  id TEXT PRIMARY KEY,
  tracking_no TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  consignee_name TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  weight_kg REAL DEFAULT 1.0,
  cod_amount REAL DEFAULT 0,
  rider_assigned TEXT,
  status TEXT DEFAULT 'BOOKED',
  booked_date TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_logistics_manifests (
  id TEXT PRIMARY KEY,
  manifest_no TEXT UNIQUE NOT NULL,
  route_corridor TEXT NOT NULL,
  vehicle_plate TEXT,
  driver_name TEXT,
  parcels_count INTEGER DEFAULT 0,
  dispatch_date TEXT,
  status TEXT DEFAULT 'IN_TRANSIT',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_shipments_sync ON local_logistics_shipments(is_synced);
CREATE INDEX IF NOT EXISTS idx_logistics_manifests_sync ON local_logistics_manifests(is_synced);

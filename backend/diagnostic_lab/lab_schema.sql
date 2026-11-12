-- Diagnostic Lab & Pathology Center Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_lab_orders (
  id TEXT PRIMARY KEY,
  sample_no TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  referred_by TEXT,
  test_panel TEXT NOT NULL,
  sample_type TEXT DEFAULT 'Blood',
  fee_amount REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'SAMPLE_COLLECTED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_lab_results (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  observed_value TEXT NOT NULL,
  reference_range TEXT,
  verified_by TEXT,
  verified_at TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_sync ON local_lab_orders(is_synced);
CREATE INDEX IF NOT EXISTS idx_lab_results_sync ON local_lab_results(is_synced);

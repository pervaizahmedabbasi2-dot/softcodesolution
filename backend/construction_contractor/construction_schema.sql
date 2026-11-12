-- Construction Contractor & Civil Engineering Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_construction_projects (
  id TEXT PRIMARY KEY,
  project_code TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  site_engineer TEXT NOT NULL,
  contract_value REAL NOT NULL DEFAULT 0,
  spent_amount REAL DEFAULT 0,
  completion_pct INTEGER DEFAULT 0,
  status TEXT DEFAULT 'IN_PROGRESS',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_construction_boq_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'Bags',
  unit_cost REAL NOT NULL DEFAULT 0,
  supplier_name TEXT,
  delivery_date TEXT,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_construction_projects_sync ON local_construction_projects(is_synced);
CREATE INDEX IF NOT EXISTS idx_construction_boq_sync ON local_construction_boq_logs(is_synced);

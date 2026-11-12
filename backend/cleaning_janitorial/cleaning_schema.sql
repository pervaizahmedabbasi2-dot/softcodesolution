-- Cleaning, Janitorial & Facility Maintenance Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_cleaning_contracts (
  id TEXT PRIMARY KEY,
  contract_no TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  site_location TEXT NOT NULL,
  service_frequency TEXT DEFAULT 'DAILY',
  crew_size INTEGER DEFAULT 2,
  monthly_fee REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_cleaning_dispatches (
  id TEXT PRIMARY KEY,
  job_no TEXT UNIQUE NOT NULL,
  contract_id TEXT,
  supervisor_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  checklist_score INTEGER DEFAULT 100,
  status TEXT DEFAULT 'SCHEDULED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cleaning_contracts_sync ON local_cleaning_contracts(is_synced);
CREATE INDEX IF NOT EXISTS idx_cleaning_dispatches_sync ON local_cleaning_dispatches(is_synced);

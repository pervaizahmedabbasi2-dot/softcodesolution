-- Solar Energy & Renewable EPC Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_solar_installations (
  id TEXT PRIMARY KEY,
  project_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  site_city TEXT NOT NULL,
  capacity_kw REAL NOT NULL DEFAULT 5.0,
  inverter_model TEXT,
  net_metering_status TEXT DEFAULT 'APPLIED',
  contract_total REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'INSTALLED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_solar_surveys (
  id TEXT PRIMARY KEY,
  survey_no TEXT UNIQUE NOT NULL,
  prospect_name TEXT NOT NULL,
  roof_area_sqft REAL DEFAULT 0,
  monthly_units_kwh INTEGER DEFAULT 0,
  recommended_kw REAL DEFAULT 5.0,
  engineer_name TEXT,
  survey_date TEXT,
  status TEXT DEFAULT 'COMPLETED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_solar_installations_sync ON local_solar_installations(is_synced);
CREATE INDEX IF NOT EXISTS idx_solar_surveys_sync ON local_solar_surveys(is_synced);

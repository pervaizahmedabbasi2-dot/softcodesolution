-- Car Rental & Chauffeur Fleet Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_carrental_vehicles (
  id TEXT PRIMARY KEY,
  plate_no TEXT UNIQUE NOT NULL,
  vehicle_model TEXT NOT NULL,
  category TEXT DEFAULT 'Sedan',
  daily_rate REAL NOT NULL,
  mileage_km INTEGER DEFAULT 0,
  fuel_type TEXT DEFAULT 'Petrol',
  status TEXT DEFAULT 'AVAILABLE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_carrental_contracts (
  id TEXT PRIMARY KEY,
  contract_no TEXT UNIQUE NOT NULL,
  plate_no TEXT NOT NULL,
  hirer_name TEXT NOT NULL,
  hirer_phone TEXT,
  driver_assigned TEXT,
  pickup_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  deposit_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carrental_vehicles_sync ON local_carrental_vehicles(is_synced);
CREATE INDEX IF NOT EXISTS idx_carrental_contracts_sync ON local_carrental_contracts(is_synced);

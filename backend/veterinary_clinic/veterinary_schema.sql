-- Veterinary Clinic & Pet Hospital Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_veterinary_patients (
  id TEXT PRIMARY KEY,
  pet_code TEXT UNIQUE NOT NULL,
  pet_name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  attending_vet TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_veterinary_vaccinations (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  vaccine_name TEXT NOT NULL,
  administered_date TEXT NOT NULL,
  next_due_date TEXT,
  vet_name TEXT,
  fee_amount REAL DEFAULT 0,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_veterinary_patients_sync ON local_veterinary_patients(is_synced);
CREATE INDEX IF NOT EXISTS idx_veterinary_vaccines_sync ON local_veterinary_vaccinations(is_synced);

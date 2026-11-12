-- Dental Clinic & Orthodontic Center Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_dental_patients (
  id TEXT PRIMARY KEY,
  patient_code TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  phone TEXT,
  dentist_name TEXT NOT NULL,
  last_visit TEXT,
  allergies TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_dental_treatments (
  id TEXT PRIMARY KEY,
  treatment_no TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  tooth_number TEXT,
  procedure_name TEXT NOT NULL,
  dentist_name TEXT NOT NULL,
  procedure_fee REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  visit_date TEXT NOT NULL,
  status TEXT DEFAULT 'COMPLETED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dental_patients_sync ON local_dental_patients(is_synced);
CREATE INDEX IF NOT EXISTS idx_dental_treatments_sync ON local_dental_treatments(is_synced);

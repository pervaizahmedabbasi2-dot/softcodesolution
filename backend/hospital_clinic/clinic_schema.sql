-- Hospital & OPD Clinic Domain Schema
CREATE TABLE IF NOT EXISTS local_clinic_appointments (
  id TEXT PRIMARY KEY,
  token_no TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status TEXT DEFAULT 'QUEUED',
  fee REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_clinic_patients (
  id TEXT PRIMARY KEY,
  mr_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  blood_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

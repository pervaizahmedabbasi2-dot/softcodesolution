-- Auto Workshop & Garage Domain Schema
CREATE TABLE IF NOT EXISTS local_auto_jobs (
  id TEXT PRIMARY KEY,
  job_no TEXT UNIQUE NOT NULL,
  vehicle TEXT NOT NULL,
  customer TEXT NOT NULL,
  mechanic TEXT NOT NULL,
  service_type TEXT NOT NULL,
  estimate_usd REAL NOT NULL,
  status TEXT DEFAULT 'QUEUED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_auto_fleet (
  id TEXT PRIMARY KEY,
  vehicle TEXT NOT NULL,
  plate_no TEXT UNIQUE NOT NULL,
  rate_per_day REAL NOT NULL,
  status TEXT DEFAULT 'AVAILABLE',
  current_hirer TEXT
);

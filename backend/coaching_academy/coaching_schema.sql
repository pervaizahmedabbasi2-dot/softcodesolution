-- Coaching Academy & Test Prep Institute Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_coaching_batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT UNIQUE NOT NULL,
  program_name TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  timing_slot TEXT NOT NULL,
  enrolled_count INTEGER DEFAULT 0,
  monthly_fee REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_coaching_enrollments (
  id TEXT PRIMARY KEY,
  roll_no TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  batch_id TEXT NOT NULL,
  phone TEXT,
  fee_status TEXT DEFAULT 'PAID',
  mock_avg_score REAL DEFAULT 0,
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coaching_batches_sync ON local_coaching_batches(is_synced);
CREATE INDEX IF NOT EXISTS idx_coaching_enrollments_sync ON local_coaching_enrollments(is_synced);

-- Vocational Training & Skill Institute Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_vocational_courses (
  id TEXT PRIMARY KEY,
  course_code TEXT UNIQUE NOT NULL,
  trade_title TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  duration_months INTEGER DEFAULT 6,
  tuition_fee REAL NOT NULL DEFAULT 0,
  lab_capacity INTEGER DEFAULT 25,
  status TEXT DEFAULT 'OPEN',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_vocational_trainees (
  id TEXT PRIMARY KEY,
  trainee_no TEXT UNIQUE NOT NULL,
  trainee_name TEXT NOT NULL,
  course_id TEXT NOT NULL,
  phone TEXT,
  assessment_score REAL DEFAULT 0,
  certificate_status TEXT DEFAULT 'IN_TRAINING',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocational_courses_sync ON local_vocational_courses(is_synced);
CREATE INDEX IF NOT EXISTS idx_vocational_trainees_sync ON local_vocational_trainees(is_synced);

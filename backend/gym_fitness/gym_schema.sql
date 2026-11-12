-- Gym & Fitness Center Domain Schema
CREATE TABLE IF NOT EXISTS local_gym_members (
  id TEXT PRIMARY KEY,
  member_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  plan TEXT NOT NULL,
  monthly_fee REAL NOT NULL,
  due_date TEXT NOT NULL,
  trainer TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_gym_checkins (
  id TEXT PRIMARY KEY,
  member_name TEXT NOT NULL,
  plan TEXT NOT NULL,
  checkin_time TEXT NOT NULL,
  turnstile_gate TEXT DEFAULT 'Main Gate'
);

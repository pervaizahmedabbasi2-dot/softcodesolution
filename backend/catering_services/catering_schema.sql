-- Catering Services & Banquet Kitchen Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_catering_events (
  id TEXT PRIMARY KEY,
  event_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  event_title TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  event_date TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 100,
  per_head_rate REAL NOT NULL DEFAULT 0,
  total_contract REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_catering_menus (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  dish_name TEXT NOT NULL,
  course_type TEXT DEFAULT 'Main Course',
  quantity_kg REAL DEFAULT 0,
  chef_assigned TEXT,
  status TEXT DEFAULT 'PLANNED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catering_events_sync ON local_catering_events(is_synced);
CREATE INDEX IF NOT EXISTS idx_catering_menus_sync ON local_catering_menus(is_synced);

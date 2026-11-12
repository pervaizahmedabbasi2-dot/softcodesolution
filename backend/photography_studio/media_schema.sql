-- Photography Studio & Media Production Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_media_shoots (
  id TEXT PRIMARY KEY,
  shoot_code TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  package_name TEXT NOT NULL,
  lead_photographer TEXT NOT NULL,
  shoot_date TEXT NOT NULL,
  studio_bay TEXT DEFAULT 'Studio A',
  package_fee REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'SCHEDULED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_media_deliverables (
  id TEXT PRIMARY KEY,
  shoot_id TEXT NOT NULL,
  asset_type TEXT DEFAULT 'Edited Album & 4K Reel',
  editor_name TEXT,
  delivery_link TEXT,
  status TEXT DEFAULT 'POST_PROCESSING',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_shoots_sync ON local_media_shoots(is_synced);
CREATE INDEX IF NOT EXISTS idx_media_deliverables_sync ON local_media_deliverables(is_synced);

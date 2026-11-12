-- Event Management & Wedding Planning Domain Schema (SQLite Offline-First + Cloud Sync)
CREATE TABLE IF NOT EXISTS local_events_bookings (
  id TEXT PRIMARY KEY,
  event_no TEXT UNIQUE NOT NULL,
  event_title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  guest_capacity INTEGER DEFAULT 200,
  budget_total REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_events_vendors (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  contract_fee REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'BOOKED',
  is_synced INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_bookings_sync ON local_events_bookings(is_synced);
CREATE INDEX IF NOT EXISTS idx_events_vendors_sync ON local_events_vendors(is_synced);

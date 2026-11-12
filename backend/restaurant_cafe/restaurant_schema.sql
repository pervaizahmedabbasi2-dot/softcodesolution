-- ===========================================================================
-- RESTAURANT & FINE DINE DOMAIN SCHEMA
-- ===========================================================================

-- Table Layout & Occupancy
CREATE TABLE IF NOT EXISTS local_restaurant_tables (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  zone TEXT NOT NULL,
  seats INTEGER DEFAULT 4,
  guests INTEGER DEFAULT 0,
  status TEXT DEFAULT 'VACANT',
  order_total REAL DEFAULT 0,
  waiter_name TEXT
);

-- Food Menu
CREATE TABLE IF NOT EXISTS local_restaurant_menu (
  id TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  prep_time TEXT,
  kitchen_station TEXT DEFAULT 'Main Kitchen',
  is_available INTEGER DEFAULT 1
);

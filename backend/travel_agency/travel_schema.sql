-- Travel Agency & Tourism Domain Schema
CREATE TABLE IF NOT EXISTS local_travel_packages (
  id TEXT PRIMARY KEY,
  package_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  dest_city TEXT NOT NULL,
  duration TEXT NOT NULL,
  price_usd REAL NOT NULL,
  status TEXT DEFAULT 'AVAILABLE'
);

CREATE TABLE IF NOT EXISTS local_travel_visas (
  id TEXT PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  country TEXT NOT NULL,
  passport_no TEXT NOT NULL,
  embassy TEXT NOT NULL,
  status TEXT DEFAULT 'APPLIED'
);

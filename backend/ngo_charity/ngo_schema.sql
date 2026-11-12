-- NGO & Non-Profit Charity Domain Schema
CREATE TABLE IF NOT EXISTS local_ngo_campaigns (
  id TEXT PRIMARY KEY,
  campaign_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  target_usd REAL NOT NULL,
  raised_usd REAL DEFAULT 0,
  region TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS local_ngo_donations (
  id TEXT PRIMARY KEY,
  receipt_no TEXT UNIQUE NOT NULL,
  donor_name TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
